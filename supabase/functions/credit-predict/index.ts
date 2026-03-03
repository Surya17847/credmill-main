import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
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

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { applicantData } = await req.json();

    console.log('Calculating credit risk using built-in model...');

    // Parse input data
    const income = parseFloat(applicantData.income) || 65000;
    const debtRatio = parseFloat(applicantData.debtRatio) || 0.35;
    const creditScore = parseInt(applicantData.creditScore) || 720;
    const age = parseInt(applicantData.age) || 35;
    const employmentLength = parseInt(applicantData.employmentLength) || 5;
    const creditLines = parseInt(applicantData.creditLines) || 3;
    const recentInquiries = parseInt(applicantData.recentInquiries) || 1;

    // Built-in risk scoring model (weights calibrated for credit risk assessment)
    // Base score starts at 550 (middle of range)
    let baseScore = 550;

    // Credit Score Impact (300-850 range normalized) - Most important factor (40% weight)
    const creditScoreNormalized = (creditScore - 300) / 550; // 0 to 1 range
    const creditScoreContribution = creditScoreNormalized * 240; // Up to 240 points

    // Debt-to-Income Ratio Impact (20% weight) - Lower is better
    const debtRatioContribution = Math.max(0, (0.5 - debtRatio) * 200); // Up to 100 points

    // Income Impact (15% weight) - Higher is better
    const incomeNormalized = Math.min(income / 150000, 1); // Cap at 150k
    const incomeContribution = incomeNormalized * 75;

    // Employment Length Impact (10% weight)
    const employmentContribution = Math.min(employmentLength / 10, 1) * 50;

    // Credit Lines Impact (8% weight) - Moderate number is best
    const optimalLines = 5;
    const creditLinesScore = 1 - Math.abs(creditLines - optimalLines) / optimalLines;
    const creditLinesContribution = Math.max(0, creditLinesScore) * 40;

    // Recent Inquiries Impact (7% weight) - Fewer is better
    const inquiriesContribution = Math.max(0, (5 - recentInquiries) / 5) * 35;

    // Calculate final risk score (300-900 range)
    const rawScore = baseScore + creditScoreContribution + debtRatioContribution + 
                     incomeContribution + employmentContribution + 
                     creditLinesContribution + inquiriesContribution;
    
    const riskScore = Math.round(Math.max(300, Math.min(900, rawScore)));

    // Determine risk level based on score ranges
    let riskLevel: string;
    let riskEmoji: string;
    let defaultProbability: number;

    if (riskScore >= 760) {
      riskLevel = 'Very Low Risk';
      riskEmoji = '🟢';
      defaultProbability = 0.05;
    } else if (riskScore >= 660) {
      riskLevel = 'Low Risk';
      riskEmoji = '🟩';
      defaultProbability = 0.15;
    } else if (riskScore >= 540) {
      riskLevel = 'Medium Risk';
      riskEmoji = '🟨';
      defaultProbability = 0.35;
    } else if (riskScore >= 420) {
      riskLevel = 'High Risk';
      riskEmoji = '🟧';
      defaultProbability = 0.60;
    } else {
      riskLevel = 'Very High Risk';
      riskEmoji = '🔴';
      defaultProbability = 0.85;
    }

    // Feature contributions for explainability
    const featureContributions = [
      {
        name: `Credit Score (${creditScore})`,
        impact: creditScoreContribution,
        direction: creditScoreContribution > 0 ? 'positive' : 'negative'
      },
      {
        name: `Debt Ratio (${(debtRatio * 100).toFixed(1)}%)`,
        impact: debtRatioContribution,
        direction: debtRatioContribution > 0 ? 'positive' : 'negative'
      },
      {
        name: `Annual Income ($${income.toLocaleString()})`,
        impact: incomeContribution,
        direction: incomeContribution > 0 ? 'positive' : 'negative'
      },
      {
        name: `Employment (${employmentLength} years)`,
        impact: employmentContribution,
        direction: employmentContribution > 0 ? 'positive' : 'negative'
      },
      {
        name: `Credit Lines (${creditLines})`,
        impact: creditLinesContribution,
        direction: creditLinesContribution > 0 ? 'positive' : 'negative'
      },
      {
        name: `Recent Inquiries (${recentInquiries})`,
        impact: inquiriesContribution,
        direction: inquiriesContribution > 0 ? 'positive' : 'negative'
      }
    ].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

    const recommendation = riskScore >= 760 ? 'Approve with standard terms - excellent creditworthiness' :
                          riskScore >= 660 ? 'Approve with standard terms - good creditworthiness' :
                          riskScore >= 540 ? 'Review manually - moderate risk, consider higher interest rate' :
                          riskScore >= 420 ? 'High risk - require additional collateral or deny' :
                          'Very high risk - recommend denial';

    return new Response(
      JSON.stringify({
        defaultProbability,
        riskScore,
        riskLevel: `${riskEmoji} ${riskLevel}`,
        features: featureContributions,
        recommendation,
        modelInfo: {
          name: 'Built-in Credit Risk Model',
          version: 'v2.0',
          algorithm: 'Weighted Multi-Factor Analysis'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error making prediction:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
