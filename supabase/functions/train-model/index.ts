import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple logistic regression implementation
function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

function trainLogisticRegression(X: number[][], y: number[], learningRate = 0.01, iterations = 1000) {
  const m = X.length;
  const n = X[0].length;
  const weights = Array(n).fill(0);
  let intercept = 0;

  for (let iter = 0; iter < iterations; iter++) {
    const predictions = X.map((xi, i) => {
      const z = xi.reduce((sum, val, j) => sum + val * weights[j], intercept);
      return sigmoid(z);
    });

    // Gradient descent
    const dw = Array(n).fill(0);
    let db = 0;

    for (let i = 0; i < m; i++) {
      const error = predictions[i] - y[i];
      for (let j = 0; j < n; j++) {
        dw[j] += error * X[i][j];
      }
      db += error;
    }

    // Update weights
    for (let j = 0; j < n; j++) {
      weights[j] -= (learningRate * dw[j]) / m;
    }
    intercept -= (learningRate * db) / m;
  }

  return { weights, intercept };
}

function calculateMetrics(yTrue: number[], yPred: number[], yProb: number[]) {
  let tp = 0, fp = 0, tn = 0, fn = 0;
  
  for (let i = 0; i < yTrue.length; i++) {
    if (yTrue[i] === 1 && yPred[i] === 1) tp++;
    else if (yTrue[i] === 0 && yPred[i] === 1) fp++;
    else if (yTrue[i] === 0 && yPred[i] === 0) tn++;
    else if (yTrue[i] === 1 && yPred[i] === 0) fn++;
  }

  const accuracy = (tp + tn) / yTrue.length;
  const precision = tp / (tp + fp) || 0;
  const recall = tp / (tp + fn) || 0;
  const f1 = 2 * (precision * recall) / (precision + recall) || 0;

  // Calculate AUC (simplified)
  const auc = calculateAUC(yTrue, yProb);

  return { accuracy, precision, recall, f1, auc };
}

function calculateAUC(yTrue: number[], yProb: number[]): number {
  const pairs = yTrue.map((y, i) => ({ y, prob: yProb[i] }))
    .sort((a, b) => b.prob - a.prob);
  
  let auc = 0;
  let positives = yTrue.filter(y => y === 1).length;
  let negatives = yTrue.length - positives;
  
  if (positives === 0 || negatives === 0) return 0.5;
  
  let truePos = 0, falsePos = 0;
  let prevProb = -1;
  
  for (let i = 0; i < pairs.length; i++) {
    if (pairs[i].prob !== prevProb) {
      auc += truePos * (falsePos - (i > 0 ? (pairs[i-1].y === 0 ? 1 : 0) : 0));
      prevProb = pairs[i].prob;
    }
    if (pairs[i].y === 1) truePos++;
    else falsePos++;
  }
  
  auc += truePos * falsePos;
  return auc / (positives * negatives);
}

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

    console.log('Starting model training...');

    // Use service role key for database operations
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the CSV data
    const baseUrl = req.url.split('/functions/')[0];
    const dataUrl = `${baseUrl}/data/credit_risk_dataset.csv`;
    
    const response = await fetch(dataUrl);
    const csvText = await response.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',');

    // Key features for the model
    const featureNames = [
      'Annual_Income', 'Debt_to_Income_Ratio', 'Credit_Score',
      'Credit_Utilization_Rate', 'Number_of_Late_Payments',
      'Number_of_Credit_Inquiries', 'Loan_to_Income_Ratio',
      'Credit_History_Length', 'Number_of_Existing_Loans'
    ];

    // Get feature statistics for normalization
    const { data: stats } = await supabaseAdmin
      .from('feature_statistics')
      .select('*')
      .in('feature_name', featureNames);

    const featureMap = new Map(stats?.map(s => [s.feature_name, s]) || []);

    // Parse and normalize data (use first 800 rows for training)
    const X: number[][] = [];
    const y: number[] = [];
    const maxRows = Math.min(800, lines.length - 1);

    for (let i = 1; i <= maxRows; i++) {
      const values = lines[i].split(',');
      const features: number[] = [];
      let valid = true;

      for (const fname of featureNames) {
        const idx = headers.findIndex(h => h === fname);
        if (idx === -1) {
          valid = false;
          break;
        }
        
        let val = parseFloat(values[idx]);
        const stat = featureMap.get(fname);
        
        // Handle missing values with mean imputation
        if (isNaN(val) && stat) {
          val = stat.mean_value;
        }
        
        // Normalize using z-score
        if (stat && stat.std_dev > 0) {
          val = (val - stat.mean_value) / stat.std_dev;
        }
        
        features.push(val);
      }

      if (valid) {
        X.push(features);
        const defaultIdx = headers.findIndex(h => h === 'Default_Flag');
        const defaultVal = values[defaultIdx]?.toLowerCase();
        y.push(defaultVal === 'true' || defaultVal === '1' ? 1 : 0);
      }
    }

    console.log(`Training on ${X.length} samples with ${featureNames.length} features`);

    // Train logistic regression
    const { weights, intercept } = trainLogisticRegression(X, y, 0.1, 2000);

    // Make predictions for evaluation
    const yProb = X.map(xi => {
      const z = xi.reduce((sum, val, j) => sum + val * weights[j], intercept);
      return sigmoid(z);
    });
    const yPred = yProb.map(p => p >= 0.5 ? 1 : 0);

    // Calculate metrics
    const metrics = calculateMetrics(y, yPred, yProb);

    console.log('Model metrics:', metrics);

    // Deactivate previous models
    await supabaseAdmin
      .from('trained_models')
      .update({ is_active: false })
      .eq('is_active', true);

    // Store the trained model
    const { error: insertError } = await supabaseAdmin
      .from('trained_models')
      .insert({
        model_name: 'Logistic Regression',
        model_type: 'logistic_regression',
        feature_names: featureNames,
        feature_stats: Object.fromEntries(featureMap),
        model_coefficients: Object.fromEntries(weights.map((w, i) => [featureNames[i], w])),
        model_intercept: intercept,
        accuracy: metrics.accuracy,
        precision_score: metrics.precision,
        recall: metrics.recall,
        f1_score: metrics.f1,
        auc_score: metrics.auc,
        is_active: true
      });

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        metrics: {
          accuracy: (metrics.accuracy * 100).toFixed(2),
          precision: (metrics.precision * 100).toFixed(2),
          recall: (metrics.recall * 100).toFixed(2),
          f1Score: (metrics.f1 * 100).toFixed(2),
          auc: (metrics.auc * 100).toFixed(2)
        },
        trainingSize: X.length,
        features: featureNames
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error training model:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
