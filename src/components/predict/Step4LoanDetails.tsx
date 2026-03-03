import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface Step4LoanDetailsProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export const Step4LoanDetails = ({ formData, onChange }: Step4LoanDetailsProps) => {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="w-5 h-5 text-primary" />
        <h2 className="text-2xl font-bold">Loan & Transaction-Specific Features</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="loan_amount_requested">Loan Amount Requested (₹) *</Label>
          <Input
            id="loan_amount_requested"
            type="number"
            value={formData.loan_amount_requested || ''}
            onChange={(e) => onChange('loan_amount_requested', e.target.value)}
            required
            min="0"
          />
        </div>

        <div>
          <Label htmlFor="loan_term">Loan Term (Months) *</Label>
          <Input
            id="loan_term"
            type="number"
            value={formData.loan_term || ''}
            onChange={(e) => onChange('loan_term', e.target.value)}
            required
            min="1"
          />
        </div>

        <div>
          <Label htmlFor="loan_purpose">Loan Purpose *</Label>
          <Select value={formData.loan_purpose} onValueChange={(v) => onChange('loan_purpose', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select purpose" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Debt Consolidation">Debt Consolidation</SelectItem>
              <SelectItem value="Home Improvement">Home Improvement</SelectItem>
              <SelectItem value="Business">Business</SelectItem>
              <SelectItem value="Education">Education</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="collateral_type">Collateral Type *</Label>
          <Select value={formData.collateral_type} onValueChange={(v) => onChange('collateral_type', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select collateral" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Real Estate">Real Estate</SelectItem>
              <SelectItem value="Vehicle">Vehicle</SelectItem>
              <SelectItem value="None">None</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="collateral_value">Collateral Value (₹) *</Label>
          <Input
            id="collateral_value"
            type="number"
            value={formData.collateral_value || ''}
            onChange={(e) => onChange('collateral_value', e.target.value)}
            required
            min="0"
          />
        </div>

        <div>
          <Label htmlFor="transaction_amount">Transaction Amount (₹) *</Label>
          <Input
            id="transaction_amount"
            type="number"
            value={formData.transaction_amount || ''}
            onChange={(e) => onChange('transaction_amount', e.target.value)}
            required
            min="0"
          />
        </div>

        <div>
          <Label htmlFor="transaction_frequency">Transaction Frequency *</Label>
          <Input
            id="transaction_frequency"
            type="number"
            value={formData.transaction_frequency || ''}
            onChange={(e) => onChange('transaction_frequency', e.target.value)}
            required
            min="0"
          />
        </div>

        <div>
          <Label htmlFor="time_since_last_transaction">Time Since Last Transaction (Days) *</Label>
          <Input
            id="time_since_last_transaction"
            type="number"
            value={formData.time_since_last_transaction || ''}
            onChange={(e) => onChange('time_since_last_transaction', e.target.value)}
            required
            min="0"
          />
        </div>
      </div>
    </Card>
  );
};
