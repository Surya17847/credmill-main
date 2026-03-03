import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user and check admin role
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing credit risk dataset...');

    // Use service role key for database operations
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch CSV from public folder
    const baseUrl = req.url.split('/functions/')[0];
    const dataUrl = `${baseUrl}/data/credit_risk_dataset.csv`;
    
    const response = await fetch(dataUrl);
    const csvText = await response.text();
    
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',');
    
    console.log(`Found ${lines.length - 1} records with ${headers.length} columns`);
    
    // Parse CSV and calculate statistics
    const featureStats: Record<string, any> = {};
    const numericFeatures = [
      'Age', 'Employment_Duration', 'Years_at_Residence', 'Number_of_Dependents',
      'Annual_Income', 'Total_Debt', 'Debt_to_Income_Ratio', 'Loan_to_Income_Ratio',
      'Credit_Score', 'Credit_History_Length', 'Number_of_Existing_Loans',
      'Total_Credit_Limit', 'Credit_Utilization_Rate', 'Savings_Account_Balance',
      'Checking_Account_Balance', 'Total_Assets', 'Net_Worth', 'Number_of_Late_Payments',
      'Worst_Delinquency_Status', 'Months_since_Last_Delinquency', 'Number_of_Credit_Inquiries',
      'Number_of_Open_Credit_Lines', 'Number_of_Derogatory_Records', 'Loan_Amount_Requested',
      'Loan_Term_Months', 'Payment_to_Income_Ratio', 'Collateral_Value', 'Transaction_Amount',
      'Transaction_Frequency', 'Days_since_Last_Transaction', 'Avg_Probability_of_Default',
      'Avg_Risk_Weighted_Assets', 'DPD_Trigger_Count', 'Cash_Flow_Volatility',
      'Custom_Risk_Score', 'Credit_Risk_Score'
    ];

    // Initialize feature stats
    numericFeatures.forEach(feature => {
      featureStats[feature] = { values: [], sum: 0, count: 0 };
    });

    // Process data rows (sample first 1000 for performance)
    const maxRows = Math.min(1000, lines.length - 1);
    for (let i = 1; i <= maxRows; i++) {
      const values = lines[i].split(',');
      numericFeatures.forEach((feature, idx) => {
        const headerIdx = headers.findIndex(h => h === feature);
        if (headerIdx !== -1) {
          const val = parseFloat(values[headerIdx]);
          if (!isNaN(val)) {
            featureStats[feature].values.push(val);
            featureStats[feature].sum += val;
            featureStats[feature].count++;
          }
        }
      });
    }

    // Calculate mean, median, std for each feature
    const statsToStore = [];
    for (const [feature, data] of Object.entries(featureStats)) {
      if (data.count > 0) {
        const mean = data.sum / data.count;
        const sorted = [...data.values].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];
        const variance = data.values.reduce((acc: number, val: number) => acc + Math.pow(val - mean, 2), 0) / data.count;
        const std = Math.sqrt(variance);
        const min = Math.min(...data.values);
        const max = Math.max(...data.values);

        statsToStore.push({
          feature_name: feature,
          mean_value: mean,
          median_value: median,
          std_dev: std,
          min_value: min,
          max_value: max,
          data_type: 'numeric'
        });
      }
    }

    // Store feature statistics using upsert with admin client
    for (const stat of statsToStore) {
      const { error: upsertError } = await supabaseAdmin
        .from('feature_statistics')
        .upsert(stat, { onConflict: 'feature_name' });
      
      if (upsertError) {
        console.error(`Error upserting ${stat.feature_name}:`, upsertError);
      }
    }

    console.log(`Stored statistics for ${statsToStore.length} features`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        recordsProcessed: maxRows,
        featuresAnalyzed: statsToStore.length,
        message: 'Dataset processed successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
