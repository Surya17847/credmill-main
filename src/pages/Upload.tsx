import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload as UploadIcon, FileText, CheckCircle2, AlertCircle, TrendingUp, Loader2, Download, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

const API_URL = 'https://be-project-xak5.onrender.com';

export default function Upload() {
  // Training data states
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [training, setTraining] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);
  
  // Batch prediction states
  const [predictionFile, setPredictionFile] = useState<File | null>(null);
  const [predicting, setPredicting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  
  const { toast } = useToast();

  const stripEmoji = (text: string): string => {
    if (!text) return text;
    return text
      .replace(/[\u{1F000}-\u{1FFFF}]/gu, '') // emoji ranges
      .replace(/[\u2600-\u27BF]/gu, '')         // misc symbols & dingbats
      .replace(/[\uFE00-\uFE0F]/gu, '')         // variation selectors
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')   // supplemental symbols
      .trim();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "text/csv" || selectedFile.name.endsWith(".csv")) {
        setFile(selectedFile);
        setUploadComplete(false);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a CSV file",
          variant: "destructive",
        });
      }
    }
  };

  const handleProcessData = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-data');
      
      if (error) throw error;

      toast({
        title: "Data Processed",
        description: `${data.recordsProcessed} records analyzed, ${data.featuresAnalyzed} features computed`,
      });
      
      setUploadComplete(true);
    } catch (error: any) {
      toast({
        title: "Processing Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleTrainModel = async () => {
    setTraining(true);
    try {
      const { data, error } = await supabase.functions.invoke('train-model');
      
      if (error) throw error;

      setMetrics(data.metrics);
      toast({
        title: "Model Trained Successfully",
        description: `Accuracy: ${data.metrics.accuracy}%, AUC: ${data.metrics.auc}%`,
      });
    } catch (error: any) {
      toast({
        title: "Training Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTraining(false);
    }
  };

  const isValidPredictionFile = (f: File) =>
    f.type === "text/csv" ||
    f.name.endsWith(".csv") ||
    f.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    f.name.endsWith(".xlsx");

  const handlePredictionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (isValidPredictionFile(selectedFile)) {
        setPredictionFile(selectedFile);
        setPredictions([]);
        setBatchId(null);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a CSV or Excel (.xlsx) file",
          variant: "destructive",
        });
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && isValidPredictionFile(droppedFile)) {
      setPredictionFile(droppedFile);
      setPredictions([]);
      setBatchId(null);
    } else if (droppedFile) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV or Excel (.xlsx) file",
        variant: "destructive",
      });
    }
  };

  const parseFileToRows = async (file: File): Promise<{ headers: string[]; rows: any[] }> => {
    if (file.name.endsWith(".xlsx")) {
      // Dynamically import SheetJS for Excel parsing
      const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs" as any);
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
      const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
      return { headers, rows: jsonData };
    } else {
      const text = await file.text();
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1).map(line => {
        const values = line.split(',');
        const row: any = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx]?.trim();
        });
        return row;
      });
      return { headers, rows };
    }
  };

  const handleBatchPredict = async () => {
    if (!predictionFile) return;

    setPredicting(true);
    setProgress(0);
    setPredictions([]);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { rows } = await parseFileToRows(predictionFile);

      // Generate batch ID
      const newBatchId = crypto.randomUUID();
      setBatchId(newBatchId);

      const results: any[] = [];
      
      // Process each row
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        // Map CSV columns to API payload
        const apiPayload = {
          Age: parseInt(row.Age || row.age) || 0,
          Employment_Status: row.Employment_Status || row.employment_status || '',
          Employment_Duration: parseInt(row.Employment_Duration || row.employment_duration) || 0,
          Industry_Sector: row.Industry_Sector || row.industry_sector || '',
          Education_Level: row.Education_Level || row.education_level || '',
          Marital_Status: row.Marital_Status || row.marital_status || '',
          Housing_Status: row.Housing_Status || row.housing_status || '',
          Years_at_Residence: parseInt(row.Years_at_Residence || row.years_at_residence) || 0,
          Number_of_Dependents: parseInt(row.Number_of_Dependents || row.number_of_dependents) || 0,
          Annual_Income: parseFloat(row.Annual_Income || row.annual_income) || 0,
          Total_Debt: parseFloat(row.Total_Debt || row.total_debt) || 0,
          Debt_to_Income_Ratio: parseFloat(row.Debt_to_Income_Ratio || row.debt_to_income_ratio) || 0,
          Loan_to_Income_Ratio: parseFloat(row.Loan_to_Income_Ratio || row.loan_to_income_ratio) || 0,
          Credit_Score: parseInt(row.Credit_Score || row.credit_score) || 0,
          Credit_History_Length: parseInt(row.Credit_History_Length || row.credit_history_length) || 0,
          Number_of_Existing_Loans: parseInt(row.Number_of_Existing_Loans || row.number_of_existing_loans) || 0,
          Total_Credit_Limit: parseFloat(row.Total_Credit_Limit || row.total_credit_limit) || 0,
          Credit_Utilization_Rate: parseFloat(row.Credit_Utilization_Rate || row.credit_utilization_rate) || 0,
          Savings_Account_Balance: parseFloat(row.Savings_Account_Balance || row.savings_account_balance) || 0,
          Checking_Account_Balance: parseFloat(row.Checking_Account_Balance || row.checking_account_balance) || 0,
          Total_Assets: parseFloat(row.Total_Assets || row.total_assets) || 0,
          Net_Worth: parseFloat(row.Net_Worth || row.net_worth) || 0,
          Number_of_Late_Payments: parseInt(row.Number_of_Late_Payments || row.number_of_late_payments) || 0,
          Worst_Delinquency_Status: parseInt(row.Worst_Delinquency_Status || row.worst_delinquency_status) || 0,
          Months_since_Last_Delinquency: parseInt(row.Months_since_Last_Delinquency || row.months_since_last_delinquency) || 999,
          Number_of_Credit_Inquiries: parseInt(row.Number_of_Credit_Inquiries || row.number_of_credit_inquiries) || 0,
          Number_of_Open_Credit_Lines: parseInt(row.Number_of_Open_Credit_Lines || row.number_of_open_credit_lines) || 0,
          Number_of_Derogatory_Records: parseInt(row.Number_of_Derogatory_Records || row.number_of_derogatory_records) || 0,
          Bankruptcy_Flag: (row.Bankruptcy_Flag || row.bankruptcy_flag) === 'TRUE' || (row.Bankruptcy_Flag || row.bankruptcy_flag) === '1',
          Credit_Mix: row.Credit_Mix || row.credit_mix || '',
          Loan_Amount_Requested: parseFloat(row.Loan_Amount_Requested || row.loan_amount_requested) || 0,
          Loan_Term_Months: parseInt(row.Loan_Term_Months || row.loan_term_months) || 0,
          Loan_Purpose: row.Loan_Purpose || row.loan_purpose || '',
          Payment_to_Income_Ratio: parseFloat(row.Payment_to_Income_Ratio || row.payment_to_income_ratio) || 0,
          Collateral_Type: row.Collateral_Type || row.collateral_type || '',
          Collateral_Value: parseFloat(row.Collateral_Value || row.collateral_value) || 0,
          Transaction_Amount: parseFloat(row.Transaction_Amount || row.transaction_amount) || 0,
          Transaction_Frequency: parseInt(row.Transaction_Frequency || row.transaction_frequency) || 0,
          Days_since_Last_Transaction: parseInt(row.Days_since_Last_Transaction || row.days_since_last_transaction) || 0,
          Avg_Probability_of_Default: parseFloat(row.Avg_Probability_of_Default || row.avg_probability_of_default) || 0,
          Avg_Risk_Weighted_Assets: parseFloat(row.Avg_Risk_Weighted_Assets || row.avg_risk_weighted_assets) || 0,
          DPD_Trigger_Count: parseInt(row.DPD_Trigger_Count || row.dpd_trigger_count) || 0,
          Bankruptcy_Trigger_Flag: (row.Bankruptcy_Trigger_Flag || row.bankruptcy_trigger_flag) === 'TRUE' || (row.Bankruptcy_Trigger_Flag || row.bankruptcy_trigger_flag) === '1',
          Cash_Flow_Volatility: parseFloat(row.Cash_Flow_Volatility || row.cash_flow_volatility) || 0,
          Seasonal_Spending_Pattern: row.Seasonal_Spending_Pattern || row.seasonal_spending_pattern || ''
        };

        // Call prediction API
        const response = await fetch(`${API_URL}/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiPayload),
        });

        if (!response.ok) {
          throw new Error(`Prediction failed for row ${i + 1}`);
        }

        const predictionResult = await response.json();

        // Strip emoji/symbols from risk_level (e.g. "🔴 High Risk" → "High Risk")
        const cleanRiskLevel = stripEmoji(predictionResult.risk_level || '');

        // Store in database (map to lowercase column names)
        const { error: dbError } = await (supabase as any)
          .from('predictions')
          .insert({
            user_id: user.id,
            batch_id: newBatchId,
            prediction_type: 'batch',
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
            debt_to_income_ratio: apiPayload.Debt_to_Income_Ratio,
            loan_to_income_ratio: apiPayload.Loan_to_Income_Ratio,
            credit_score: apiPayload.Credit_Score,
            credit_history_length: apiPayload.Credit_History_Length,
            number_of_existing_loans: apiPayload.Number_of_Existing_Loans,
            total_credit_limit: apiPayload.Total_Credit_Limit,
            credit_utilization_rate: apiPayload.Credit_Utilization_Rate,
            savings_account_balance: apiPayload.Savings_Account_Balance,
            checking_account_balance: apiPayload.Checking_Account_Balance,
            total_assets: apiPayload.Total_Assets,
            net_worth: apiPayload.Annual_Income - apiPayload.Total_Debt,
            number_of_late_payments: apiPayload.Number_of_Late_Payments,
            worst_delinquency_status: apiPayload.Worst_Delinquency_Status,
            months_since_last_delinquency: apiPayload.Months_since_Last_Delinquency,
            number_of_credit_inquiries: apiPayload.Number_of_Credit_Inquiries,
            number_of_open_credit_lines: apiPayload.Number_of_Open_Credit_Lines,
            number_of_derogatory_records: apiPayload.Number_of_Derogatory_Records,
            bankruptcy_flag: apiPayload.Bankruptcy_Flag,
            credit_mix: apiPayload.Credit_Mix,
            loan_amount_requested: apiPayload.Loan_Amount_Requested,
            loan_term_months: apiPayload.Loan_Term_Months,
            loan_purpose: apiPayload.Loan_Purpose,
            payment_to_income_ratio: apiPayload.Payment_to_Income_Ratio,
            collateral_type: apiPayload.Collateral_Type,
            collateral_value: apiPayload.Collateral_Value,
            transaction_amount: apiPayload.Transaction_Amount,
            transaction_frequency: apiPayload.Transaction_Frequency,
            days_since_last_transaction: apiPayload.Days_since_Last_Transaction,
            avg_probability_of_default: apiPayload.Avg_Probability_of_Default,
            avg_risk_weighted_assets: apiPayload.Avg_Risk_Weighted_Assets,
            dpd_trigger_count: apiPayload.DPD_Trigger_Count,
            bankruptcy_trigger_flag: apiPayload.Bankruptcy_Trigger_Flag,
            cash_flow_volatility: apiPayload.Cash_Flow_Volatility,
            seasonal_spending_pattern: apiPayload.Seasonal_Spending_Pattern,
            prediction_score: predictionResult.predicted_credit_risk_score || predictionResult.risk_score,
            risk_level: cleanRiskLevel,
            prediction_label: predictionResult.prediction
          });

        if (dbError) {
          console.error('Database insert error:', dbError);
        }

        results.push({
          row: i + 1,
          ...apiPayload,
          prediction_score: predictionResult.predicted_credit_risk_score || predictionResult.risk_score,
          risk_level: cleanRiskLevel
        });

        setProgress(((i + 1) / rows.length) * 100);
      }

      setPredictions(results);
      toast({
        title: "Batch Prediction Complete",
        description: `Successfully predicted ${results.length} customer credit scores`,
      });

    } catch (error: any) {
      console.error('Batch prediction error:', error);
      toast({
        title: "Batch Prediction Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setPredicting(false);
    }
  };

  const downloadResults = () => {
    if (predictions.length === 0) return;

    const headers = ['Row', 'Credit_Score', 'Annual_Income', 'Prediction_Score', 'Risk_Level'];
    const csvContent = [
      headers.join(','),
      ...predictions.map(p => [
        p.row,
        p.Credit_Score,
        p.Annual_Income,
        p.prediction_score,
        p.risk_level
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `predictions_${batchId}.csv`;
    a.click();
  };

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Data Upload & Batch Prediction</h1>
          <p className="text-muted-foreground">
            Train models or predict credit scores for multiple customers at once
          </p>
        </div>

        <Tabs defaultValue="predict" className="space-y-6">
          <TabsList className="grid w-full grid-cols-1">
          {/* <TabsList className="grid w-full grid-cols-2"> */}
            <TabsTrigger value="predict">Batch Prediction</TabsTrigger>
            {/* <TabsTrigger value="train">Train Model</TabsTrigger> */}
          </TabsList>

          {/* Batch Prediction Tab */}
          <TabsContent value="predict" className="space-y-6">
            <Card className="p-8">
              <div className="space-y-6">
                {/* Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                    dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    id="prediction-file-upload"
                    accept=".csv,.xlsx"
                    onChange={handlePredictionFileChange}
                    className="hidden"
                  />
                  <label htmlFor="prediction-file-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-4">
                      <div className="rounded-full bg-primary/10 p-4">
                        <UploadIcon className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold mb-1">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-sm text-muted-foreground">
                          CSV or Excel (.xlsx) file with customer data (Max 50MB)
                        </p>
                      </div>
                    </div>
                  </label>
                </div>

                {/* File Info */}
                {predictionFile && (
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <FileText className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium">{predictionFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(predictionFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                )}

                {/* Predict Button */}
                <Button
                  onClick={handleBatchPredict}
                  disabled={!predictionFile || predicting}
                  className="w-full"
                  size="lg"
                >
                  {predicting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Predicting...
                    </>
                  ) : (
                    "Predict All Customers"
                  )}
                </Button>

                {/* Progress */}
                {predicting && (
                  <div className="space-y-2">
                    <Progress value={progress} className="w-full" />
                    <p className="text-sm text-muted-foreground text-center">
                      {progress.toFixed(0)}% complete
                    </p>
                  </div>
                )}

                {/* Results */}
                {predictions.length > 0 && (
                  <Card className="p-6 bg-primary/5 border-primary/20">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Prediction Results</h3>
                        <p className="text-sm text-muted-foreground">
                          Successfully predicted {predictions.length} customers
                        </p>
                      </div>
                      <Button onClick={downloadResults} variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Download CSV
                      </Button>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left">Row</th>
                            <th className="px-4 py-2 text-left">Credit Score</th>
                            <th className="px-4 py-2 text-left">Income</th>
                            <th className="px-4 py-2 text-left">Risk Score</th>
                            <th className="px-4 py-2 text-left">Risk Level</th>
                          </tr>
                        </thead>
                        <tbody>
                          {predictions.map((pred, idx) => (
                            <tr key={idx} className="border-t border-border">
                              <td className="px-4 py-2">{pred.row}</td>
                              <td className="px-4 py-2">{pred.Credit_Score}</td>
                              <td className="px-4 py-2">{pred.Annual_Income}</td>
                              <td className="px-4 py-2 font-semibold">{pred.prediction_score}</td>
                              <td className="px-4 py-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  pred.risk_level === 'Low Risk' ? 'bg-green-100 text-green-800' :
                                  pred.risk_level === 'Medium Risk' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {pred.risk_level}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}

                {/* Info */}
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>File Format:</strong> Upload a CSV or Excel (.xlsx) file with columns like Age, Employment_Status, Annual_Income, Credit_Score, Debt_to_Income_Ratio, etc. All predictions will be saved to your account for later analysis.
                  </AlertDescription>
                </Alert>
              </div>
            </Card>
          </TabsContent>

          {/* Train Model Tab */}
          <TabsContent value="train" className="space-y-6">
            <Card className="p-8">
              <div className="space-y-6">
            {/* Upload Area */}
            <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors">
              <input
                type="file"
                id="file-upload"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="flex flex-col items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-4">
                    <UploadIcon className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-muted-foreground">
                      CSV files only (Max 50MB)
                    </p>
                  </div>
                </div>
              </label>
            </div>

            {/* File Info */}
            {file && (
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                {uploadComplete && (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
              </div>
            )}

            {/* Process Data Button */}
            <Button
              onClick={handleProcessData}
              disabled={processing}
              className="w-full"
              size="lg"
            >
              {processing ? "Processing Dataset..." : "Process Dataset"}
            </Button>

            {/* Train Model Button */}
            {uploadComplete && (
              <Button
                onClick={handleTrainModel}
                disabled={training}
                className="w-full"
                size="lg"
                variant="default"
              >
                {training ? "Training Model..." : "Train Model"}
              </Button>
            )}

            {/* Metrics Display */}
            {metrics && (
              <Card className="p-6 bg-primary/5 border-primary/20">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-6 w-6 text-primary mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-3">Model Performance</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Accuracy</p>
                        <p className="text-xl font-bold">{metrics.accuracy}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">AUC Score</p>
                        <p className="text-xl font-bold">{metrics.auc}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Precision</p>
                        <p className="text-xl font-bold">{metrics.precision}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">F1 Score</p>
                        <p className="text-xl font-bold">{metrics.f1Score}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

                {/* Data Requirements */}
                <div className="mt-8 space-y-4">
                  <h3 className="font-semibold">Data Requirements</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <p>Include borrower financial data: income, debt, credit history, etc.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <p>Target variable should be named 'default' or 'loan_status' (0=paid, 1=default)</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <p>Optional: Include demographic data for fairness analysis (age, gender, race)</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <p>Missing values will be handled automatically during preprocessing</p>
                    </div>
                  </div>
                </div>

                {/* Sample Data Format */}
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">Sample Data Format</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-border rounded-lg">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium">income</th>
                          <th className="px-4 py-2 text-left font-medium">debt_ratio</th>
                          <th className="px-4 py-2 text-left font-medium">credit_score</th>
                          <th className="px-4 py-2 text-left font-medium">age</th>
                          <th className="px-4 py-2 text-left font-medium">default</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-border">
                          <td className="px-4 py-2">65000</td>
                          <td className="px-4 py-2">0.35</td>
                          <td className="px-4 py-2">720</td>
                          <td className="px-4 py-2">35</td>
                          <td className="px-4 py-2">0</td>
                        </tr>
                        <tr className="border-t border-border">
                          <td className="px-4 py-2">42000</td>
                          <td className="px-4 py-2">0.62</td>
                          <td className="px-4 py-2">580</td>
                          <td className="px-4 py-2">28</td>
                          <td className="px-4 py-2">1</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}