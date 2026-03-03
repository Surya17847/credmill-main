import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2 } from "lucide-react";

interface SummaryStepProps {
  formData: any;
  derivedMetrics: {
    monthly_income: number;
    debt_to_income_ratio: number;
    loan_to_income_ratio: number;
    payment_to_income_ratio: number;
    net_worth: number;
  };
}

export const SummaryStep = ({ formData, derivedMetrics }: SummaryStepProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatRatio = (value: number) => {
    return value.toFixed(2);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-primary/5 border-primary">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Review Your Information</h2>
        </div>
        <p className="text-muted-foreground">
          Please review all the information before submitting for credit risk assessment.
        </p>
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Derived Financial Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Monthly Income</p>
            <p className="text-2xl font-bold">{formatCurrency(derivedMetrics.monthly_income)}</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Debt-to-Income Ratio</p>
            <p className="text-2xl font-bold">{formatRatio(derivedMetrics.debt_to_income_ratio)}</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Loan-to-Income Ratio</p>
            <p className="text-2xl font-bold">{formatRatio(derivedMetrics.loan_to_income_ratio)}</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Payment-to-Income Ratio</p>
            <p className="text-2xl font-bold">{formatRatio(derivedMetrics.payment_to_income_ratio)}</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Net Worth</p>
            <p className="text-2xl font-bold">{formatCurrency(derivedMetrics.net_worth)}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Personal Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-muted-foreground">Age:</span> {formData.age}</div>
          <div><span className="text-muted-foreground">Employment:</span> {formData.employment_status}</div>
          <div><span className="text-muted-foreground">Employment Duration:</span> {formData.employment_duration} years</div>
          <div><span className="text-muted-foreground">Housing:</span> {formData.housing_status}</div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Financial Summary</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-muted-foreground">Annual Income:</span> {formatCurrency(Number(formData.annual_income))}</div>
          <div><span className="text-muted-foreground">Total Debt:</span> {formatCurrency(Number(formData.total_debt))}</div>
          <div><span className="text-muted-foreground">Credit Score:</span> {formData.credit_score}</div>
          <div><span className="text-muted-foreground">Total Assets:</span> {formatCurrency(Number(formData.total_assets))}</div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Loan Request</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-muted-foreground">Loan Amount:</span> {formatCurrency(Number(formData.loan_amount_requested))}</div>
          <div><span className="text-muted-foreground">Loan Term:</span> {formData.loan_term} months</div>
          <div><span className="text-muted-foreground">Purpose:</span> {formData.loan_purpose}</div>
          <div><span className="text-muted-foreground">Collateral:</span> {formData.collateral_type}</div>
        </div>
      </Card>
    </div>
  );
};
