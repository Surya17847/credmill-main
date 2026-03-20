import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Info, TrendingUp, TrendingDown, AlertCircle, CheckCircle, XCircle, Sparkles, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line
} from "recharts";

const API_URL = 'https://be-project-xak5.onrender.com';

export default function Explainability() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'shap' | 'lime' | 'reasons'>('shap');
  const [storedPredictions, setStoredPredictions] = useState<any[]>([]);
  const [selectedPredictionId, setSelectedPredictionId] = useState<string | null>(null);
  const [loadingPredictions, setLoadingPredictions] = useState(false);

  useEffect(() => {
    loadStoredPredictions();
  }, []);

  const loadStoredPredictions = async () => {
    setLoadingPredictions(true);
    try {
      const { data, error } = await (supabase as any)
        .from('predictions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setStoredPredictions(data || []);
      if (data && data.length > 0 && !selectedPredictionId) {
        setSelectedPredictionId(data[0].id);
      }
    } catch (err: any) {
      console.error('Error loading predictions:', err);
    } finally {
      setLoadingPredictions(false);
    }
  };

  const handleExplain = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let payload: any;

      if (selectedPredictionId) {
        const prediction = storedPredictions.find(p => p.id === selectedPredictionId);
        if (!prediction) throw new Error("Selected prediction not found");

        payload = {
          Age: prediction.age,
          Employment_Status: prediction.employment_status,
          Employment_Duration: prediction.employment_duration,
          Industry_Sector: prediction.industry_sector,
          Education_Level: prediction.education_level,
          Marital_Status: prediction.marital_status,
          Housing_Status: prediction.housing_status,
          Years_at_Residence: prediction.years_at_residence,
          Number_of_Dependents: prediction.number_of_dependents,
          Annual_Income: prediction.annual_income,
          Total_Debt: prediction.total_debt,
          Debt_to_Income_Ratio: prediction.debt_to_income_ratio,
          Loan_to_Income_Ratio: prediction.loan_to_income_ratio,
          Credit_Score: prediction.credit_score,
          Credit_History_Length: prediction.credit_history_length,
          Number_of_Existing_Loans: prediction.number_of_existing_loans,
          Total_Credit_Limit: prediction.total_credit_limit,
          Credit_Utilization_Rate: prediction.credit_utilization_rate,
          Savings_Account_Balance: prediction.savings_account_balance,
          Checking_Account_Balance: prediction.checking_account_balance,
          Total_Assets: prediction.total_assets,
          Net_Worth: prediction.net_worth,
          Number_of_Late_Payments: prediction.number_of_late_payments,
          Worst_Delinquency_Status: prediction.worst_delinquency_status,
          Months_since_Last_Delinquency: prediction.months_since_last_delinquency,
          Number_of_Credit_Inquiries: prediction.number_of_credit_inquiries,
          Number_of_Open_Credit_Lines: prediction.number_of_open_credit_lines,
          Number_of_Derogatory_Records: prediction.number_of_derogatory_records,
          Bankruptcy_Flag: prediction.bankruptcy_flag,
          Credit_Mix: prediction.credit_mix,
          Loan_Amount_Requested: prediction.loan_amount_requested,
          Loan_Term_Months: prediction.loan_term_months,
          Loan_Purpose: prediction.loan_purpose,
          Payment_to_Income_Ratio: prediction.payment_to_income_ratio,
          Collateral_Type: prediction.collateral_type,
          Collateral_Value: prediction.collateral_value,
          Transaction_Amount: prediction.transaction_amount,
          Transaction_Frequency: prediction.transaction_frequency,
          Days_since_Last_Transaction: prediction.days_since_last_transaction,
          Avg_Probability_of_Default: prediction.avg_probability_of_default,
          Avg_Risk_Weighted_Assets: prediction.avg_risk_weighted_assets,
          DPD_Trigger_Count: prediction.dpd_trigger_count,
          Bankruptcy_Trigger_Flag: prediction.bankruptcy_trigger_flag,
          Cash_Flow_Volatility: prediction.cash_flow_volatility,
          Seasonal_Spending_Pattern: prediction.seasonal_spending_pattern
        };
      } else {
        const storedPayload = localStorage.getItem("lastPredictionInput");
        if (!storedPayload) {
          setError("No prediction data available. Please make a prediction first or select from stored predictions.");
          setLoading(false);
          return;
        }
        payload = JSON.parse(storedPayload);
      }

      const response = await fetch(`${API_URL}/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();
      if (data.status === "error") throw new Error(data.error || "Unknown error occurred");
      
      setResult(data);
    } catch (err: any) {
      console.error("Explainability Error:", err);
      setError(err.message || "Failed to load explainability report.");
    }
    
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    if (status === "approved") return <CheckCircle className="h-6 w-6 text-green-600" />;
    if (status === "conditional") return <AlertCircle className="h-6 w-6 text-yellow-600" />;
    return <XCircle className="h-6 w-6 text-red-600" />;
  };

  const getStatusColor = (status: string) => {
    if (status === "approved") return "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800";
    if (status === "conditional") return "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800";
    return "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800";
  };

  const getColor = (impact: string) =>
    impact === "positive" ? "#10b981" : "#ef4444";

  const getShapFeatures = () => result?.feature_importance_explanation?.top_features || [];

  const getImpactDistribution = () => {
    const features = getShapFeatures();
    if (!features.length) return [];
    const positive = features.filter((f: any) => f.impact === "positive").reduce((sum: number, f: any) => sum + f.magnitude, 0);
    const negative = features.filter((f: any) => f.impact === "negative").reduce((sum: number, f: any) => sum + f.magnitude, 0);
    return [
      { name: "Risk Reducing", value: positive, fill: "#10b981" },
      { name: "Risk Increasing", value: negative, fill: "#ef4444" }
    ];
  };

  const getRadarData = () => {
    const features = getShapFeatures();
    if (!features.length) return [];
    return features.slice(0, 6).map((f: any) => ({
      feature: f.feature.replace(/_/g, ' ').slice(0, 20),
      value: f.magnitude,
      fullMark: Math.max(...features.map((x: any) => x.magnitude))
    }));
  };

  const getCumulativeImpact = () => {
    const features = getShapFeatures();
    if (!features.length) return [];
    let cumulative = 0;
    return features.map((f: any) => {
      cumulative += f.shap_value;
      return { feature: f.feature.replace(/_/g, ' ').slice(0, 15), cumulative, impact: f.shap_value };
    });
  };

  return (
    <div className="container max-w-7xl py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-3 flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-primary" />
          Model Explainability Dashboard
        </h1>
        <p className="text-muted-foreground text-lg">
          Understand how your credit score was calculated using advanced AI explainability techniques
        </p>
      </div>

      {/* Stored Predictions Selector */}
      <Card className="p-6 mb-8">
        <div className="flex items-start gap-4">
          <Database className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">Select Stored Prediction</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Choose from your previous predictions saved in the database or use the most recent prediction from the form.
            </p>
            
            {loadingPredictions ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading predictions...
              </div>
            ) : storedPredictions.length > 0 ? (
              <Select value={selectedPredictionId || ''} onValueChange={setSelectedPredictionId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a prediction" />
                </SelectTrigger>
                <SelectContent>
                  {storedPredictions.map((pred) => (
                    <SelectItem key={pred.id} value={pred.id}>
                      📄 Score: {pred.prediction_score} - 
                      {new Date(pred.created_at).toLocaleDateString()} {new Date(pred.created_at).toLocaleTimeString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No stored predictions found. Make a prediction from the Predict page first.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </Card>

      {/* Info Card */}
      <Card className="p-5 mb-8">
        <div className="flex gap-4">
          <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">How This Works</p>
            <p className="text-sm text-muted-foreground">
              <strong>SHAP</strong> (SHapley Additive exPlanations) shows which features pushed your score higher or lower globally.
              <br />
              <strong>LIME</strong> (Local Interpretable Model-agnostic Explanations) explains the model's reasoning for your specific case.
            </p>
          </div>
        </div>
      </Card>

      {/* Generate Button */}
      <Button onClick={handleExplain} disabled={loading} size="lg" className="mb-8 text-base px-6">
        {loading ? (
          <><Loader2 className="animate-spin mr-2 h-5 w-5" />Generating Report...</>
        ) : (
          <><Sparkles className="mr-2 h-5 w-5" />Generate Explainability Report</>
        )}
      </Button>

      {/* Error Alert */}
      {error && (
        <Alert className="mb-8 border-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-8">
          {/* Summary Score Card */}
          <Card className={`p-8 ${getStatusColor(result.approval_status)} border-2`}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Credit Risk Assessment</h2>
                <p className="text-lg font-medium">{result.approval_message}</p>
              </div>
              {getStatusIcon(result.approval_status)}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-background rounded-lg border">
                <p className="text-sm text-muted-foreground mb-2">Credit Risk Score</p>
                <p className="text-5xl font-bold text-primary mb-2">
                  {result.predicted_credit_risk_score}
                </p>
                <p className="text-lg font-medium">{result.risk_level}</p>
              </div>
              
              <div className="text-center p-4 bg-background rounded-lg border">
                <p className="text-sm text-muted-foreground mb-2">Default Probability</p>
                <p className="text-5xl font-bold text-orange-600 mb-2">
                  {(result.probability_of_default * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">Risk of default</p>
              </div>
              
              <div className="text-center p-4 bg-background rounded-lg border">
                <p className="text-sm text-muted-foreground mb-2">Features Analyzed</p>
                <p className="text-5xl font-bold text-primary mb-2">
                  {result.total_features_used}
                </p>
                <p className="text-sm text-muted-foreground">Data points</p>
              </div>
            </div>
          </Card>

          {/* Detailed Feature Explanation */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              What Shaped Your Credit Score
            </h3>
            <p className="text-base leading-relaxed mb-4">
              {result.explanation_summary}
            </p>

            {(() => {
              const shapFeatures = result?.feature_importance_explanation?.top_features || [];
              const negativeFeatures = shapFeatures.filter((f: any) => f.impact === 'positive');
              const positiveFeatures = shapFeatures.filter((f: any) => f.impact === 'negative');

              return (
                <div className="space-y-5 mt-2">
                  {negativeFeatures.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-red-700 dark:text-red-400 flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4" />
                        Features Increasing Your Risk (Need Improvement)
                      </h4>
                      <div className="space-y-2">
                        {negativeFeatures.map((f: any, i: number) => (
                          <div key={i} className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-red-900 dark:text-red-300">{f.feature.replace(/_/g, ' ')}</span>
                              <span className="text-sm font-semibold text-red-600 dark:text-red-400">Impact: {f.magnitude.toFixed(3)}</span>
                            </div>
                            <p className="text-sm text-red-800 dark:text-red-400">
                              {f.feature.includes('Debt') || f.feature.includes('debt') ? 'Your debt levels are contributing to higher risk. Consider paying down existing debts to improve this factor.' :
                               f.feature.includes('Credit_Score') || f.feature.includes('credit_score') ? 'Your credit score is pulling the assessment towards higher risk. Timely bill payments and reducing credit utilization can help.' :
                               f.feature.includes('Late_Payment') || f.feature.includes('late') ? 'History of late payments is negatively affecting your profile. Consistent on-time payments over 6-12 months can improve this.' :
                               f.feature.includes('Inquiry') || f.feature.includes('inquiry') ? 'Too many recent credit inquiries suggest credit-seeking behavior. Avoid applying for multiple credit lines simultaneously.' :
                               f.feature.includes('Utilization') || f.feature.includes('utilization') ? 'High credit utilization signals heavy reliance on credit. Aim to keep utilization below 30% of your total limit.' :
                               f.feature.includes('Income') || f.feature.includes('income') ? 'Income level relative to obligations is a concern. Increasing income or reducing financial commitments would help.' :
                               f.feature.includes('Bankruptcy') || f.feature.includes('bankruptcy') ? 'Bankruptcy history is a significant negative factor. This impact diminishes over time with responsible credit behavior.' :
                               f.feature.includes('Derogatory') || f.feature.includes('derogatory') ? 'Derogatory records are weighing down your score. These typically take 7 years to clear from your record.' :
                               f.feature.includes('Employment') || f.feature.includes('employment') ? 'Employment stability is a concern. Longer tenure at your current job demonstrates reliability to lenders.' :
                               f.feature.includes('Loan') || f.feature.includes('loan') ? 'Loan-related factors are contributing to risk. Consider requesting a smaller loan amount or longer term.' :
                               `This factor is pushing your score towards higher risk. Improving the value of ${f.feature.replace(/_/g, ' ')} would positively impact your assessment.`}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {positiveFeatures.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-green-700 dark:text-green-400 flex items-center gap-2 mb-2">
                        <TrendingDown className="h-4 w-4" />
                        Features Working in Your Favor (Strengths)
                      </h4>
                      <div className="space-y-2">
                        {positiveFeatures.map((f: any, i: number) => (
                          <div key={i} className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-green-900 dark:text-green-300">{f.feature.replace(/_/g, ' ')}</span>
                              <span className="text-sm font-semibold text-green-600 dark:text-green-400">Impact: {f.magnitude.toFixed(3)}</span>
                            </div>
                            <p className="text-sm text-green-800 dark:text-green-400">
                              {f.feature.includes('Credit_Score') || f.feature.includes('credit_score') ? 'Your credit score is a strong positive. Continue maintaining good credit habits to keep this advantage.' :
                               f.feature.includes('Income') || f.feature.includes('income') ? 'Your income level supports a strong credit profile. This demonstrates good repayment capacity.' :
                               f.feature.includes('Asset') || f.feature.includes('asset') ? 'Your asset base provides a financial cushion, which lenders view favorably.' :
                               f.feature.includes('Employment') || f.feature.includes('employment') ? 'Your employment stability is a positive signal to lenders, showing reliable income.' :
                               f.feature.includes('History') || f.feature.includes('history') ? 'Your established credit history demonstrates experience in managing credit responsibly.' :
                               f.feature.includes('Savings') || f.feature.includes('savings') || f.feature.includes('Checking') ? 'Your account balances indicate financial stability and ability to handle unexpected expenses.' :
                               f.feature.includes('Collateral') || f.feature.includes('collateral') ? 'The collateral offered reduces lender risk, strengthening your application.' :
                               `This factor is positively contributing to your credit assessment. Keep maintaining the current level of ${f.feature.replace(/_/g, ' ')}.`}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {shapFeatures.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">
                      Detailed feature breakdown will appear after generating the explainability report with SHAP analysis.
                    </p>
                  )}
                </div>
              );
            })()}
          </Card>

          {/* Tabs */}
          <div className="flex gap-2 mb-4 border-b border-border">
            {(['shap', 'lime', 'reasons'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === tab
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'shap' ? 'SHAP Analysis' : tab === 'lime' ? 'LIME Analysis' : 'Detailed Reasons'}
              </button>
            ))}
          </div>

          {/* SHAP Tab */}
          {activeTab === 'shap' && (
            <div className="space-y-8">
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-2">Key Factors Affecting Your Score (SHAP)</h2>
                <p className="text-muted-foreground mb-6">These features had the strongest impact on your credit risk score</p>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={getShapFeatures()} layout="vertical" margin={{ left: 180, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="feature" tick={{ fontSize: 13 }} width={170} />
                    <Tooltip formatter={(value: any) => [value.toFixed(4), 'Impact']} />
                    <Bar dataKey="magnitude" radius={[0, 8, 8, 0]}>
                      {getShapFeatures().map((item: any, idx: number) => (
                        <Cell key={idx} fill={getColor(item.impact)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-sm">Risk Increasing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-sm">Risk Reducing</span>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Impact Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={getImpactDistribution()} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={100} dataKey="value">
                        {getImpactDistribution().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>

                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Feature Impact Radar</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={getRadarData()}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="feature" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis />
                      <Radar name="Impact" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Cumulative Feature Impact</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getCumulativeImpact()} margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="feature" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="cumulative" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </div>
          )}

          {/* LIME Tab */}
          {activeTab === 'lime' && (
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-2">Case-Specific Breakdown (LIME)</h2>
              <p className="text-muted-foreground mb-6">How each feature influenced the prediction for your specific application</p>
              <div className="space-y-3">
                {(result?.lime_explanation?.contributions || []).map((item: any, index: number) => {
                  const isRiskIncreasing = item.weight > 0;
                  return (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        {isRiskIncreasing ? (
                          <TrendingUp className="text-red-500 h-5 w-5 flex-shrink-0" />
                        ) : (
                          <TrendingDown className="text-green-500 h-5 w-5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{item.feature}</p>
                          <p className="text-xs text-muted-foreground">
                            {isRiskIncreasing ? 'Increases default risk' : 'Reduces default risk'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <span className={`text-lg font-semibold ${isRiskIncreasing ? "text-red-600" : "text-green-600"}`}>
                          {item.weight > 0 ? '+' : ''}{item.weight.toFixed(3)}
                        </span>
                        <p className="text-xs text-muted-foreground">weight</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 p-4 bg-muted rounded-lg border">
                <p className="text-sm font-medium mb-1">Model Score</p>
                <p className="text-2xl font-bold text-primary">{result?.lime_explanation?.score?.toFixed(4) ?? 'N/A'}</p>
              </div>
            </Card>
          )}

          {/* Reasons Tab */}
          {activeTab === 'reasons' && (
            <div className="space-y-8">
              {result.rejection_reasons && result.rejection_reasons.length > 0 && (
                <Card className="p-6">
                  <h2 className="text-2xl font-semibold mb-4 text-red-700 dark:text-red-400 flex items-center gap-2">
                    <XCircle className="h-6 w-6" />
                    Areas for Improvement
                  </h2>
                  <div className="space-y-4">
                    {result.rejection_reasons.map((reason: any, idx: number) => (
                      <div key={idx} className="p-5 border-l-4 border-red-500 bg-red-50 dark:bg-red-950/30 rounded-r-lg">
                        <h3 className="font-semibold text-lg mb-2">{reason.factor}</h3>
                        <p className="text-sm mb-2"><strong>Issue:</strong> {reason.issue}</p>
                        <p className="text-sm mb-2"><strong>How to Improve:</strong> {reason.improvement}</p>
                        <div className="mt-3 flex items-center gap-2">
                          <div className="flex-1 bg-red-200 dark:bg-red-900/50 rounded-full h-2">
                            <div className="bg-red-600 h-2 rounded-full" style={{ width: `${Math.min(reason.impact_score * 100, 100)}%` }}></div>
                          </div>
                          <span className="text-xs font-medium">Impact: {reason.impact_score.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {result.approval_factors && result.approval_factors.length > 0 && (
                <Card className="p-6">
                  <h2 className="text-2xl font-semibold mb-4 text-green-700 dark:text-green-400 flex items-center gap-2">
                    <CheckCircle className="h-6 w-6" />
                    Strengths in Your Application
                  </h2>
                  <div className="space-y-3">
                    {result.approval_factors.map((factor: any, idx: number) => (
                      <div key={idx} className="p-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-950/30 rounded-r-lg">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{factor.factor}</h3>
                          <span className="text-sm font-medium text-green-700 dark:text-green-400">
                            +{factor.contribution.toFixed(3)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
