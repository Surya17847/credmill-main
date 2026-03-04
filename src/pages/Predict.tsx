import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RiskMeter } from "@/components/RiskMeter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { StepIndicator } from "@/components/predict/StepIndicator";
import { Step1Personal } from "@/components/predict/Step1Personal";
import { Step2Financial } from "@/components/predict/Step2Financial";
import { Step3CreditHistory } from "@/components/predict/Step3CreditHistory";
import { Step4LoanDetails } from "@/components/predict/Step4LoanDetails";
import { Step5Behavioral } from "@/components/predict/Step5Behavioral";
import { SummaryStep } from "@/components/predict/SummaryStep";
import { Loader2, AlertCircle, Download, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const API_URL = 'https://be-project-xak5.onrender.com';

const Predict = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  
  const [formData, setFormData] = useState({
    // Step 1: Personal & Residential
    age: '',
    employment_status: '',
    employment_duration: '',
    industry_sector: '',
    education_level: '',
    marital_status: '',
    housing_status: '',
    years_at_residence: '',
    number_of_dependents: '',
    city_region: '',

    // Step 2: Financial
    annual_income: '',
    total_debt: '',
    credit_score: '',
    credit_history_length: '',
    number_of_existing_loans: '',
    total_credit_limit: '',
    credit_utilization_rate: '',
    savings_account_balance: '',
    checking_account_balance: '',
    total_assets: '',
    number_of_open_credit_lines: '',

    // Step 3: Credit History
    number_of_late_payments: '',
    worst_delinquency_status: '',
    months_since_last_delinquency: '',
    number_of_credit_inquiries: '',
    number_of_derogatory_records: '',
    bankruptcy_flag: false,
    time_since_bankruptcy: '',
    credit_mix: '',
    bankruptcy_trigger_flag: false,

    // Step 4: Loan Details
    loan_amount_requested: '',
    loan_term: '',
    loan_purpose: '',
    collateral_type: '',
    collateral_value: '',
    transaction_amount: '',
    transaction_frequency: '',
    time_since_last_transaction: '',

    // Step 5: Behavioral
    average_pd: '',
    average_lgd: '',
    average_rwa: '',
    dpd_trigger_count: '',
    cash_flow_volatility: '',
    seasonal_spending_pattern: '',
  });

  const [derivedMetrics, setDerivedMetrics] = useState({
    monthly_income: 0,
    debt_to_income_ratio: 0,
    loan_to_income_ratio: 0,
    payment_to_income_ratio: 0,
    net_worth: 0,
    credit_utilization_rate: 0,
  });

  const [prediction, setPrediction] = useState<any>(null);

  const stepLabels = [
    "Personal",
    "Financial",
    "Credit",
    "Loan",
    "Behavioral"
  ];

  useEffect(() => {
    checkApiConnection();
  }, []);

  const checkApiConnection = async () => {
    try {
      const response = await fetch(`${API_URL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        setApiConnected(data.model_loaded);
        if (data.model_loaded) {
          toast({ title: "✅ API Connected", description: "Successfully connected to prediction API" });
        } else {
          toast({ title: "⚠️ Model Not Loaded", description: "API is running but model is not loaded", variant: "destructive" });
        }
      } else {
        setApiConnected(false);
      }
    } catch (error) {
      console.error('API connection error:', error);
      setApiConnected(false);
      toast({
        title: "❌ API Connection Failed",
        description: "Cannot connect to Flask API. Make sure it's running on port 10000.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const annualIncome = Number(formData.annual_income) || 0;
    const totalDebt = Number(formData.total_debt) || 0;
    const loanAmount = Number(formData.loan_amount_requested) || 0;
    const loanTerm = Number(formData.loan_term) || 1;
    const totalAssets = Number(formData.total_assets) || 0;
    const totalCreditLimit = Number(formData.total_credit_limit) || 0;

    const monthlyIncome = annualIncome / 12;
    const estimatedMonthlyPayment = loanTerm > 0 ? loanAmount / loanTerm : 0;
    const creditUtilization = totalCreditLimit > 0 ? totalDebt / totalCreditLimit : 0;

    const newMetrics = {
      monthly_income: monthlyIncome,
      debt_to_income_ratio: annualIncome > 0 ? totalDebt / annualIncome : 0,
      loan_to_income_ratio: annualIncome > 0 ? loanAmount / annualIncome : 0,
      payment_to_income_ratio: monthlyIncome > 0 ? estimatedMonthlyPayment / monthlyIncome : 0,
      net_worth: totalAssets - totalDebt,
      credit_utilization_rate: creditUtilization,
    };

    setDerivedMetrics(newMetrics);
    setFormData(prev => ({ ...prev, credit_utilization_rate: creditUtilization.toString() }));
  }, [formData.annual_income, formData.total_debt, formData.loan_amount_requested, formData.loan_term, formData.total_assets, formData.total_credit_limit]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    const requiredFields: { [key: number]: string[] } = {
      1: ['age', 'employment_status', 'employment_duration', 'industry_sector', 'education_level', 'marital_status', 'housing_status', 'years_at_residence', 'number_of_dependents'],
      2: ['annual_income', 'total_debt', 'credit_score', 'credit_history_length', 'number_of_existing_loans',
        'total_credit_limit', 'savings_account_balance', 'checking_account_balance', 'total_assets', 'number_of_open_credit_lines'],
      3: ['number_of_late_payments', 'worst_delinquency_status', 'months_since_last_delinquency',
        'number_of_credit_inquiries', 'number_of_derogatory_records', 'credit_mix'],
      4: ['loan_amount_requested', 'loan_term', 'loan_purpose', 'collateral_type', 'collateral_value',
        'transaction_amount', 'transaction_frequency', 'time_since_last_transaction'],
    };

    const fields = requiredFields[step] || [];
    const missingFields = fields.filter(field => {
      const value = formData[field as keyof typeof formData];
      return value === '' || value === null || value === undefined;
    });

    if (missingFields.length > 0) {
      toast({
        title: "Missing Fields",
        description: `Please fill in all required fields: ${missingFields.join(', ')}`,
        variant: "destructive",
      });
      return false;
    }

    if (step === 3 && formData.bankruptcy_flag && !formData.time_since_bankruptcy) {
      toast({ title: "Missing Information", description: "Please enter time since bankruptcy.", variant: "destructive" });
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) setCurrentStep(prev => Math.min(prev + 1, 6));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // ─── PDF Download ──────────────────────────────────────────────────────────
  const handleDownloadPDF = () => {
    if (!prediction) return;

    const getRiskColor = (score: number) => {
      if (score >= 780) return '#10b981';
      if (score >= 660) return '#34d399';
      if (score >= 540) return '#f59e0b';
      if (score >= 420) return '#f97316';
      return '#ef4444';
    };

    const riskColor = getRiskColor(prediction.riskScore);

    const getSuggestions = (score: number) => {
      if (score >= 780) return `
        <li>Excellent credit profile — continue maintaining low debt and timely payments.</li>
        <li>Keep credit utilization below 30% and avoid unnecessary credit inquiries.</li>
        <li>Consider diversifying your credit mix to sustain this outstanding standing.</li>`;
      if (score >= 660) return `
        <li>Good credit profile — you are in a solid position.</li>
        <li>Pay down existing debts to push into the excellent range.</li>
        <li>Build a longer credit history for further improvement.</li>`;
      if (score >= 540) return `
        <li>Moderate risk — focus on reducing debt-to-income ratio.</li>
        <li>Avoid taking new loans and increase savings where possible.</li>
        <li>Consider consolidating high-interest debts and providing collateral.</li>`;
      return `
        <li>High risk — prioritize paying off overdue and delinquent accounts immediately.</li>
        <li>Set up automatic payments to prevent future late payments.</li>
        <li>Reduce credit utilization below 50% and avoid new credit inquiries.</li>`;
    };

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>CredMill Credit Risk Assessment Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; color: #1e293b; }
    .page { max-width: 900px; margin: 0 auto; background: #fff; padding: 48px 56px; }
    .header { text-align: center; border-bottom: 3px solid #6366f1; padding-bottom: 24px; margin-bottom: 32px; }
    .header h1 { font-size: 28px; font-weight: 700; color: #4f46e5; letter-spacing: -0.5px; }
    .header p { color: #64748b; font-size: 13px; margin-top: 6px; }
    .score-banner { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #fff; border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 32px; }
    .score-banner .score-label { font-size: 14px; opacity: 0.85; text-transform: uppercase; letter-spacing: 1px; }
    .score-banner .score-value { font-size: 72px; font-weight: 800; line-height: 1; margin: 8px 0; }
    .score-banner .risk-badge { display: inline-block; background: rgba(255,255,255,0.2); border-radius: 999px; padding: 6px 20px; font-size: 16px; font-weight: 600; margin-top: 4px; }
    .section-title { font-size: 17px; font-weight: 700; color: #1e293b; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 28px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px; }
    .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; }
    .stat-card .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; font-weight: 600; }
    .stat-card .value { font-size: 22px; font-weight: 700; color: #1e293b; margin-top: 4px; }
    .stat-card .value.highlight { color: ${riskColor}; }
    .recommendation-box { background: #f0f9ff; border-left: 4px solid #6366f1; border-radius: 0 12px 12px 0; padding: 20px 24px; margin-bottom: 28px; }
    .recommendation-box p { color: #1e40af; font-size: 15px; line-height: 1.6; }
    .suggestions { margin-bottom: 28px; }
    .suggestions ul { list-style: none; padding: 0; }
    .suggestions ul li { background: #fafafa; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; margin-bottom: 10px; font-size: 14px; color: #374151; padding-left: 36px; position: relative; }
    .suggestions ul li::before { content: '💡'; position: absolute; left: 12px; }
    .derived-metrics { margin-bottom: 28px; }
    .footer { text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 32px; color: #94a3b8; font-size: 12px; }
    .generated { color: #64748b; font-size: 12px; margin-top: 4px; }
    @media print {
      body { background: #fff; }
      .page { padding: 32px 40px; }
    }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <h1>CredMill — Credit Risk Assessment Report</h1>
    <p class="generated">Generated on ${new Date().toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}</p>
  </div>

  <div class="score-banner">
    <div class="score-label">Credit Risk Score</div>
    <div class="score-value">${prediction.riskScore}</div>
    <div class="risk-badge">${prediction.riskLevel.replace(/🟢|🟩|🟨|🟧|🔴|🟡|🟠/g, '').trim()}</div>
  </div>

  <div class="section-title">Key Metrics</div>
  <div class="grid-3">
    <div class="stat-card">
      <div class="label">Credit Risk Score</div>
      <div class="value highlight">${prediction.riskScore}</div>
    </div>
    <div class="stat-card">
      <div class="label">Default Probability</div>
      <div class="value">${(prediction.probabilityOfDefault * 100).toFixed(1)}%</div>
    </div>
    <div class="stat-card">
      <div class="label">Risk Level</div>
      <div class="value">${prediction.riskLevel.replace(/🟢|🟩|🟨|🟧|🔴|🟡|🟠/g, '').trim()}</div>
    </div>
  </div>

  <div class="section-title">Applicant Profile</div>
  <div class="grid-3">
    <div class="stat-card">
      <div class="label">Age</div>
      <div class="value">${formData.age} yrs</div>
    </div>
    <div class="stat-card">
      <div class="label">Employment Status</div>
      <div class="value" style="font-size:15px">${formData.employment_status}</div>
    </div>
    <div class="stat-card">
      <div class="label">Education Level</div>
      <div class="value" style="font-size:15px">${formData.education_level}</div>
    </div>
    <div class="stat-card">
      <div class="label">Annual Income</div>
      <div class="value">₹${Number(formData.annual_income).toLocaleString('en-IN')}</div>
    </div>
    <div class="stat-card">
      <div class="label">Total Debt</div>
      <div class="value">₹${Number(formData.total_debt).toLocaleString('en-IN')}</div>
    </div>
    <div class="stat-card">
      <div class="label">Credit Score</div>
      <div class="value">${formData.credit_score}</div>
    </div>
    <div class="stat-card">
      <div class="label">Loan Requested</div>
      <div class="value">₹${Number(formData.loan_amount_requested).toLocaleString('en-IN')}</div>
    </div>
    <div class="stat-card">
      <div class="label">Loan Term</div>
      <div class="value">${formData.loan_term} months</div>
    </div>
    <div class="stat-card">
      <div class="label">Loan Purpose</div>
      <div class="value" style="font-size:15px">${formData.loan_purpose}</div>
    </div>
  </div>

  <div class="section-title">Derived Financial Metrics</div>
  <div class="grid-3">
    <div class="stat-card">
      <div class="label">Debt-to-Income Ratio</div>
      <div class="value">${derivedMetrics.debt_to_income_ratio.toFixed(3)}</div>
    </div>
    <div class="stat-card">
      <div class="label">Loan-to-Income Ratio</div>
      <div class="value">${derivedMetrics.loan_to_income_ratio.toFixed(3)}</div>
    </div>
    <div class="stat-card">
      <div class="label">Credit Utilization</div>
      <div class="value">${(derivedMetrics.credit_utilization_rate * 100).toFixed(1)}%</div>
    </div>
    <div class="stat-card">
      <div class="label">Monthly Income</div>
      <div class="value">₹${Math.round(derivedMetrics.monthly_income).toLocaleString('en-IN')}</div>
    </div>
    <div class="stat-card">
      <div class="label">Net Worth</div>
      <div class="value">₹${Math.round(derivedMetrics.net_worth).toLocaleString('en-IN')}</div>
    </div>
    <div class="stat-card">
      <div class="label">Payment-to-Income</div>
      <div class="value">${derivedMetrics.payment_to_income_ratio.toFixed(3)}</div>
    </div>
  </div>

  ${prediction.recommendation ? `
  <div class="section-title">Recommendation</div>
  <div class="recommendation-box">
    <p>${prediction.recommendation}</p>
  </div>` : ''}

  <div class="suggestions">
    <div class="section-title">${prediction.riskScore >= 660 ? 'Suggestions to Maintain Your Score' : 'Suggestions to Improve Your Score'}</div>
    <ul>${getSuggestions(prediction.riskScore)}</ul>
  </div>

  <div class="footer">
    <p>This report was generated by <strong>CredMill Credit Risk Assessment System</strong>.</p>
    <p style="margin-top:4px">For informational purposes only. Not financial advice.</p>
  </div>
</div>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ title: "Popup Blocked", description: "Please allow popups for this site to download the report.", variant: "destructive" });
      return;
    }
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    // Wait for content to fully render before printing
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    };
  };

  const handleSubmit = async () => {
    if (apiConnected === false) {
      toast({ title: "API Not Connected", description: "Please ensure Flask API is running on port 10000", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const apiPayload = {
        Age: Number(formData.age),
        Employment_Status: formData.employment_status,
        Employment_Duration: Number(formData.employment_duration),
        Industry_Sector: formData.industry_sector,
        Education_Level: formData.education_level,
        Marital_Status: formData.marital_status,
        Housing_Status: formData.housing_status,
        Years_at_Residence: Number(formData.years_at_residence),
        Number_of_Dependents: Number(formData.number_of_dependents),
        Annual_Income: Number(formData.annual_income),
        Total_Debt: Number(formData.total_debt),
        Debt_to_Income_Ratio: derivedMetrics.debt_to_income_ratio,
        Loan_to_Income_Ratio: derivedMetrics.loan_to_income_ratio,
        Credit_Score: Number(formData.credit_score),
        Credit_History_Length: Number(formData.credit_history_length),
        Number_of_Existing_Loans: Number(formData.number_of_existing_loans),
        Total_Credit_Limit: Number(formData.total_credit_limit),
        Credit_Utilization_Rate: derivedMetrics.credit_utilization_rate,
        Savings_Account_Balance: Number(formData.savings_account_balance),
        Checking_Account_Balance: Number(formData.checking_account_balance),
        Total_Assets: Number(formData.total_assets),
        Net_Worth: derivedMetrics.net_worth,
        Number_of_Late_Payments: Number(formData.number_of_late_payments),
        Worst_Delinquency_Status: Number(formData.worst_delinquency_status),
        Months_since_Last_Delinquency: Number(formData.months_since_last_delinquency),
        Number_of_Credit_Inquiries: Number(formData.number_of_credit_inquiries),
        Number_of_Open_Credit_Lines: Number(formData.number_of_open_credit_lines),
        Number_of_Derogatory_Records: Number(formData.number_of_derogatory_records),
        Bankruptcy_Flag: formData.bankruptcy_flag ? "TRUE" : "FALSE",
        Credit_Mix: formData.credit_mix,
        Bankruptcy_Trigger_Flag: formData.bankruptcy_trigger_flag ? "TRUE" : "FALSE",
        Loan_Amount_Requested: Number(formData.loan_amount_requested),
        Loan_Term_Months: Number(formData.loan_term),
        Loan_Purpose: formData.loan_purpose,
        Payment_to_Income_Ratio: derivedMetrics.payment_to_income_ratio,
        Collateral_Type: formData.collateral_type,
        Collateral_Value: Number(formData.collateral_value),
        Transaction_Amount: Number(formData.transaction_amount),
        Transaction_Frequency: Number(formData.transaction_frequency),
        Days_since_Last_Transaction: Number(formData.time_since_last_transaction),
        Avg_Probability_of_Default: Number(formData.average_pd) / 100,
        Avg_Risk_Weighted_Assets: Number(formData.average_rwa),
        DPD_Trigger_Count: Number(formData.dpd_trigger_count),
        Cash_Flow_Volatility: Number(formData.cash_flow_volatility),
        Seasonal_Spending_Pattern: formData.seasonal_spending_pattern,
      };
      localStorage.setItem("lastPredictionInput", JSON.stringify(apiPayload));

      const response = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Prediction API request failed');

      console.log('API Response:', data);

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { error: dbError } = await (supabase as any)
          .from('predictions')
          .insert({
            user_id: user.id,
            prediction_type: 'single',
            age: apiPayload.Age,
            employment_status: apiPayload.Employment_Status,
            employment_duration: apiPayload.Employment_Duration,
            industry_sector: apiPayload.Industry_Sector,
            education_level: apiPayload.Education_Level,
            marital_status: apiPayload.Marital_Status,
            housing_status: apiPayload.Housing_Status,
            years_at_residence: apiPayload.Years_at_Residence,
            number_of_dependents: apiPayload.Number_of_Dependents,
            annual_income: apiPayload.Annual_Income,
            total_debt: apiPayload.Total_Debt,
            debt_to_income_ratio: derivedMetrics.debt_to_income_ratio,
            loan_to_income_ratio: derivedMetrics.loan_to_income_ratio,
            credit_score: apiPayload.Credit_Score,
            credit_history_length: apiPayload.Credit_History_Length,
            number_of_existing_loans: apiPayload.Number_of_Existing_Loans,
            total_credit_limit: apiPayload.Total_Credit_Limit,
            credit_utilization_rate: derivedMetrics.credit_utilization_rate,
            savings_account_balance: apiPayload.Savings_Account_Balance,
            checking_account_balance: apiPayload.Checking_Account_Balance,
            total_assets: apiPayload.Total_Assets,
            net_worth: derivedMetrics.net_worth,
            number_of_late_payments: apiPayload.Number_of_Late_Payments,
            worst_delinquency_status: apiPayload.Worst_Delinquency_Status,
            months_since_last_delinquency: apiPayload.Months_since_Last_Delinquency,
            number_of_credit_inquiries: apiPayload.Number_of_Credit_Inquiries,
            number_of_open_credit_lines: apiPayload.Number_of_Open_Credit_Lines,
            number_of_derogatory_records: apiPayload.Number_of_Derogatory_Records,
            bankruptcy_flag: apiPayload.Bankruptcy_Flag === "TRUE",
            credit_mix: apiPayload.Credit_Mix,
            loan_amount_requested: apiPayload.Loan_Amount_Requested,
            loan_term_months: apiPayload.Loan_Term_Months,
            loan_purpose: apiPayload.Loan_Purpose,
            payment_to_income_ratio: derivedMetrics.payment_to_income_ratio,
            collateral_type: apiPayload.Collateral_Type,
            collateral_value: apiPayload.Collateral_Value,
            transaction_amount: apiPayload.Transaction_Amount,
            transaction_frequency: apiPayload.Transaction_Frequency,
            days_since_last_transaction: apiPayload.Days_since_Last_Transaction,
            avg_probability_of_default: apiPayload.Avg_Probability_of_Default,
            avg_risk_weighted_assets: apiPayload.Avg_Risk_Weighted_Assets,
            dpd_trigger_count: apiPayload.DPD_Trigger_Count,
            bankruptcy_trigger_flag: apiPayload.Bankruptcy_Trigger_Flag === "TRUE",
            cash_flow_volatility: apiPayload.Cash_Flow_Volatility,
            seasonal_spending_pattern: apiPayload.Seasonal_Spending_Pattern,
            prediction_score: data.predicted_credit_risk_score || data.risk_score,
            risk_level: data.risk_level,
            prediction_label: data.prediction
          });

        if (dbError) {
          console.error('Database insert error:', dbError);
          toast({ title: "Warning", description: "Prediction successful but failed to save to database", variant: "destructive" });
        } else {
          await (supabase as any)
            .from('profiles')
            .update({
              latest_credit_score: data.predicted_credit_risk_score || data.risk_score,
              latest_risk_level: data.risk_level,
              total_predictions: (await (supabase as any).from('predictions').select('id', { count: 'exact', head: true }).eq('user_id', user.id)).count || 0,
            })
            .eq('user_id', user.id);

          const loanAmount = Number(formData.loan_amount_requested);
          const loanTermMonths = Number(formData.loan_term);
          if (loanAmount > 0 && loanTermMonths > 0) {
            const annualRate = 12;
            const monthlyRate = annualRate / 12 / 100;
            const emi = monthlyRate > 0
              ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, loanTermMonths)) / (Math.pow(1 + monthlyRate, loanTermMonths) - 1)
              : loanAmount / loanTermMonths;
            const totalPayable = emi * loanTermMonths;

            const { data: loanData, error: loanError } = await (supabase as any)
              .from('loans')
              .insert({
                user_id: user.id,
                loan_amount: loanAmount,
                loan_term_months: loanTermMonths,
                interest_rate: annualRate,
                monthly_emi: Math.round(emi),
                total_payable: Math.round(totalPayable),
                remaining_principal: loanAmount,
              })
              .select()
              .single();

            if (loanData && !loanError) {
              let remainingPrincipal = loanAmount;
              const repaymentRows = [];
              const startDate = new Date();

              for (let i = 1; i <= loanTermMonths; i++) {
                const interestPortion = remainingPrincipal * monthlyRate;
                const principalPortion = emi - interestPortion;
                remainingPrincipal -= principalPortion;

                const dueDate = new Date(startDate);
                dueDate.setMonth(dueDate.getMonth() + i);

                repaymentRows.push({
                  loan_id: loanData.id,
                  user_id: user.id,
                  month_number: i,
                  due_date: dueDate.toISOString().split('T')[0],
                  emi_amount: Math.round(emi),
                  principal_portion: Math.round(principalPortion),
                  interest_portion: Math.round(interestPortion),
                });
              }

              await (supabase as any).from('repayments').insert(repaymentRows);
            }
          }

          toast({ title: "Saved", description: "Prediction and loan schedule saved to database" });
        }
      }

      const transformedPrediction = {
        riskScore: data.predicted_credit_risk_score,
        riskLevel: data.risk_level || (
          data.predicted_credit_risk_score >= 780 ? '🟢 Very Low Risk' :
          data.predicted_credit_risk_score >= 660 ? '🟢 Low Risk' :
          data.predicted_credit_risk_score >= 540 ? '🟡 Medium Risk' :
          data.predicted_credit_risk_score >= 420 ? '🟠 High Risk' : '🔴 Very High Risk'
        ),
        probabilityOfDefault: data.probability_of_default || (
          data.predicted_credit_risk_score >= 780 ? 0.02 :
          data.predicted_credit_risk_score >= 660 ? 0.05 :
          data.predicted_credit_risk_score >= 540 ? 0.15 :
          data.predicted_credit_risk_score >= 420 ? 0.30 : 0.50
        ),
        modelVersion: 'XGBoost v2.0',
        totalFeaturesUsed: data.total_features_used,
        recommendation: data.predicted_credit_risk_score >= 780 ?
          'Excellent credit profile. Loan approval recommended with the most favorable terms.' :
          data.predicted_credit_risk_score >= 660 ?
            'Good credit profile. Loan approval recommended with standard terms.' :
            data.predicted_credit_risk_score >= 540 ?
              'Moderate credit profile. Loan may be approved with higher interest rates or additional requirements.' :
              data.predicted_credit_risk_score >= 420 ?
                'High risk profile. Additional collateral or co-signer may be required.' :
                'Very high risk. Consider debt reduction and timely payments before reapplying.',
      };

      setPrediction(transformedPrediction);
      setCurrentStep(7);
      toast({ title: "✅ Assessment Complete", description: `Credit Risk Score: ${transformedPrediction.riskScore}` });
    } catch (error: any) {
      console.error('Prediction error:', error);
      toast({ title: "Error", description: error.message || "Failed to generate prediction. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1Personal formData={formData} onChange={handleChange} />;
      case 2: return <Step2Financial formData={formData} onChange={handleChange} />;
      case 3: return <Step3CreditHistory formData={formData} onChange={handleChange} />;
      case 4: return <Step4LoanDetails formData={formData} onChange={handleChange} />;
      case 5: return <Step5Behavioral formData={formData} onChange={handleChange} />;
      case 6: return <SummaryStep formData={formData} derivedMetrics={derivedMetrics} />;
      case 7: return null;
      default: return null;
    }
  };

  // ─── Results View ──────────────────────────────────────────────────────────
  if (currentStep === 7 && prediction) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8" ref={(el) => { if (el) window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <h1 className="text-4xl font-bold mb-2">Risk Assessment Results</h1>
          <p className="text-muted-foreground">Based on your comprehensive credit profile</p>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <RiskMeter score={prediction.riskScore} riskLevel={prediction.riskLevel} />
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Summary Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Credit Risk Score</p>
                <p className="text-2xl font-bold">{prediction.riskScore}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Default Probability</p>
                <p className="text-2xl font-bold">{(prediction.probabilityOfDefault * 100).toFixed(1)}%</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Risk Level</p>
                <p className="text-2xl font-bold">{prediction.riskLevel}</p>
              </div>
            </div>
          </Card>

          {prediction.recommendation && (
            <Card className="p-6 border-l-4 border-l-primary">
              <h2 className="text-2xl font-bold mb-2">Recommendation</h2>
              <p className="text-lg">{prediction.recommendation}</p>
            </Card>
          )}

          {/* Improvement Suggestions */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">
              {prediction.riskScore >= 660 ? '✅ Suggestions to Maintain Your Score' : '⚠️ Suggestions to Improve Your Score'}
            </h2>
            <div className="space-y-3">
              {prediction.riskScore >= 780 && (
                <>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="font-medium text-green-800">🌟 Excellent Credit Profile!</p>
                    <p className="text-sm text-green-700">Your credit score is outstanding. Continue maintaining low debt, timely payments, and stable employment.</p>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">💡 Keep credit utilization below 30% and avoid unnecessary credit inquiries to maintain this excellent standing.</p>
                  </div>
                </>
              )}
              {prediction.riskScore >= 660 && prediction.riskScore < 780 && (
                <>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="font-medium text-blue-800">👍 Good Credit Profile</p>
                    <p className="text-sm text-blue-700">You're in a solid position. Small improvements can push you into the excellent range.</p>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">💡 Consider paying down existing debts and building a longer credit history to improve further.</p>
                  </div>
                </>
              )}
              {prediction.riskScore >= 540 && prediction.riskScore < 660 && (
                <>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="font-medium text-yellow-800">⚡ Moderate Risk — Room for Improvement</p>
                    <p className="text-sm text-yellow-700">Focus on reducing debt-to-income ratio and ensuring all payments are made on time.</p>
                  </div>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-700">💡 Avoid taking new loans, increase savings, and consider consolidating high-interest debts.</p>
                  </div>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-700">💡 If possible, provide collateral to strengthen your application.</p>
                  </div>
                </>
              )}
              {prediction.riskScore < 540 && (
                <>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="font-medium text-red-800">🚨 High Risk — Immediate Action Needed</p>
                    <p className="text-sm text-red-700">Your profile indicates significant risk. Focus on these critical areas:</p>
                  </div>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">💡 Prioritize paying off overdue debts and clearing any delinquent accounts immediately.</p>
                  </div>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">💡 Set up automatic payments to avoid future late payments. Even 6 months of on-time payments shows improvement.</p>
                  </div>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">💡 Reduce credit utilization below 50%, increase your income sources, and avoid any new credit inquiries.</p>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 flex-wrap">
            <Button onClick={handleDownloadPDF} size="lg" variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download PDF Report
            </Button>
            <Button
              onClick={() => navigate('/repayments')}
              size="lg"
              variant="default"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              View Repayments
            </Button>
            <Button
              onClick={() => {
                setCurrentStep(1);
                setPrediction(null);
              }}
              size="lg"
              variant="outline"
            >
              Start New Assessment
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Multi-step Form ───────────────────────────────────────────────────────
  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">CredMill - Credit Risk Assessment</h1>
        <p className="text-muted-foreground">Complete the multi-step form for comprehensive credit risk evaluation</p>

        {apiConnected === false && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">API Connection Failed</p>
              <p className="text-sm text-red-700">Make sure Flask API is running: python app.py</p>
            </div>
            <Button variant="outline" size="sm" onClick={checkApiConnection} className="ml-auto">
              Retry
            </Button>
          </div>
        )}

        {apiConnected === true && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <p className="text-sm text-green-700">API Connected</p>
          </div>
        )}
      </div>

      <StepIndicator currentStep={currentStep} totalSteps={stepLabels.length} stepLabels={stepLabels} />

      <div className="my-8">{renderStep()}</div>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
          Back
        </Button>

        {currentStep < 5 && <Button onClick={handleNext}>Next</Button>}
        {currentStep === 5 && <Button onClick={handleNext}>Review Summary</Button>}
        {currentStep === 6 && (
          <Button onClick={handleSubmit} disabled={isSubmitting || apiConnected === false}>
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
            ) : (
              'Submit for Risk Assessment'
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default Predict;
