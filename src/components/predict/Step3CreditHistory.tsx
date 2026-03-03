import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

interface Step3CreditHistoryProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export const Step3CreditHistory = ({ formData, onChange }: Step3CreditHistoryProps) => {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <CreditCard className="w-5 h-5 text-primary" />
        <h2 className="text-2xl font-bold">Credit History & Payment Behavior</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="number_of_late_payments">Number of Late Payments (Last 24 Months) *</Label>
          <Input
            id="number_of_late_payments"
            type="number"
            value={formData.number_of_late_payments || ''}
            onChange={(e) => onChange('number_of_late_payments', e.target.value)}
            required
            min="0"
          />
        </div>

        <div>
          <Label htmlFor="worst_delinquency_status">Worst Delinquency Status (in months) *</Label>
          <Input
            type="number"
            id="worst_delinquency_status"
            placeholder="Enter the months"
            value={formData.worst_delinquency_status}
            onChange={(e) => onChange('worst_delinquency_status', Number(e.target.value))}
            min={0}
            step={1}
          />
        </div>


        <div>
          <Label htmlFor="months_since_last_delinquency">Months Since Last Delinquency *</Label>
          <Input
            id="months_since_last_delinquency"
            type="number"
            value={formData.months_since_last_delinquency || ''}
            onChange={(e) => onChange('months_since_last_delinquency', e.target.value)}
            required
            min="0"
          />
        </div>

        <div>
          <Label htmlFor="number_of_credit_inquiries">Number of Credit Inquiries (Last 12 Months) *</Label>
          <Input
            id="number_of_credit_inquiries"
            type="number"
            value={formData.number_of_credit_inquiries || ''}
            onChange={(e) => onChange('number_of_credit_inquiries', e.target.value)}
            required
            min="0"
          />
        </div>

        <div>
          <Label htmlFor="number_of_derogatory_records">Number of Derogatory Records *</Label>
          <Input
            id="number_of_derogatory_records"
            type="number"
            value={formData.number_of_derogatory_records || ''}
            onChange={(e) => onChange('number_of_derogatory_records', e.target.value)}
            required
            min="0"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="bankruptcy_flag"
            checked={formData.bankruptcy_flag || false}
            onCheckedChange={(checked) => onChange('bankruptcy_flag', checked)}
          />
          <Label htmlFor="bankruptcy_flag">Bankruptcy Flag</Label>
        </div>

        {formData.bankruptcy_flag && (
          <div>
            <Label htmlFor="time_since_bankruptcy">Time Since Bankruptcy (Months) *</Label>
            <Input
              id="time_since_bankruptcy"
              type="number"
              value={formData.time_since_bankruptcy || ''}
              onChange={(e) => onChange('time_since_bankruptcy', e.target.value)}
              required
              min="0"
            />
          </div>
        )}

        <div>
          <Label htmlFor="credit_mix">Credit Mix *</Label>
          <Select value={formData.credit_mix} onValueChange={(v) => onChange('credit_mix', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select credit mix" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Poor">Poor</SelectItem>
              <SelectItem value="Fair">Fair</SelectItem>
              <SelectItem value="Good">Good</SelectItem>
              <SelectItem value="Excellent">Excellent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="bankruptcy_trigger_flag"
            checked={formData.bankruptcy_trigger_flag || false}
            onCheckedChange={(checked) => onChange('bankruptcy_trigger_flag', checked)}
          />
          <Label htmlFor="bankruptcy_trigger_flag">Bankruptcy Trigger Flag</Label>
        </div>
      </div>
    </Card>
  );
};
