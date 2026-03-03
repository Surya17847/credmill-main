import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DollarSign, HelpCircle } from "lucide-react";

interface Step2FinancialProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export const Step2Financial = ({ formData, onChange }: Step2FinancialProps) => {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <DollarSign className="w-5 h-5 text-primary" />
        <h2 className="text-2xl font-bold">Financial Capacity & History</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="annual_income" className="flex items-center gap-2">
            Annual Income (₹) *
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Your total yearly income before taxes</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Input
            id="annual_income"
            type="number"
            value={formData.annual_income || ''}
            onChange={(e) => onChange('annual_income', e.target.value)}
            required
            min="0"
          />
        </div>

        <div>
          <Label htmlFor="total_debt">Total Debt (₹) *</Label>
          <Input
            id="total_debt"
            type="number"
            value={formData.total_debt || ''}
            onChange={(e) => onChange('total_debt', e.target.value)}
            required
            min="0"
          />
        </div>

        <div>
          <Label htmlFor="credit_score">Credit Score (300-900) *</Label>
          <Input
            id="credit_score"
            type="number"
            value={formData.credit_score || ''}
            onChange={(e) => onChange('credit_score', e.target.value)}
            required
            min="300"
            max="900"
          />
        </div>

        <div>
          <Label htmlFor="credit_history_length">Credit History Length (Years) *</Label>
          <Input
            id="credit_history_length"
            type="number"
            value={formData.credit_history_length || ''}
            onChange={(e) => onChange('credit_history_length', e.target.value)}
            required
            min="0"
            step="0.1"
          />
        </div>

        <div>
          <Label htmlFor="number_of_existing_loans">Number of Existing Loans *</Label>
          <Input
            id="number_of_existing_loans"
            type="number"
            value={formData.number_of_existing_loans || ''}
            onChange={(e) => onChange('number_of_existing_loans', e.target.value)}
            required
            min="0"
          />
        </div>

        <div>
          <Label htmlFor="total_credit_limit">Total Credit Limit (₹) *</Label>
          <Input
            id="total_credit_limit"
            type="number"
            value={formData.total_credit_limit || ''}
            onChange={(e) => onChange('total_credit_limit', e.target.value)}
            required
            min="0"
          />
        </div>

        <div>
          <Label htmlFor="savings_account_balance">Savings Account Balance (₹) *</Label>
          <Input
            id="savings_account_balance"
            type="number"
            value={formData.savings_account_balance || ''}
            onChange={(e) => onChange('savings_account_balance', e.target.value)}
            required
            min="0"
          />
        </div>

        <div>
          <Label htmlFor="checking_account_balance">Checking Account Balance (₹) *</Label>
          <Input
            id="checking_account_balance"
            type="number"
            value={formData.checking_account_balance || ''}
            onChange={(e) => onChange('checking_account_balance', e.target.value)}
            required
            min="0"
          />
        </div>

        <div>
          <Label htmlFor="total_assets">Total Assets (₹) *</Label>
          <Input
            id="total_assets"
            type="number"
            value={formData.total_assets || ''}
            onChange={(e) => onChange('total_assets', e.target.value)}
            required
            min="0"
          />
        </div>

        <div>
          <Label htmlFor="number_of_open_credit_lines">Number of Open Credit Lines *</Label>
          <Input
            id="number_of_open_credit_lines"
            type="number"
            value={formData.number_of_open_credit_lines || ''}
            onChange={(e) => onChange('number_of_open_credit_lines', e.target.value)}
            required
            min="0"
          />
        </div>

        <div>
          <Label htmlFor="credit_utilization_rate">Credit Utilization Rate (0-1) *</Label>
          <Input
            id="credit_utilization_rate"
            type="number"
            value={formData.credit_utilization_rate || ''}
            onChange={(e) => onChange('credit_utilization_rate', e.target.value)}
            required
            min="0"
            max="1"
            step="0.01"
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground mt-1">Auto-calculated from debt and credit limit</p>
        </div>
      </div>
    </Card>
  );
};
