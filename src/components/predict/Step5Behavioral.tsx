import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, HelpCircle } from "lucide-react";

interface Step5BehavioralProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export const Step5Behavioral = ({ formData, onChange }: Step5BehavioralProps) => {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="text-2xl font-bold">Behavioral & Temporal Features</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="average_pd" className="flex items-center gap-2">
            Average Probability of Default - Last 6 Months (%)
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Historical average likelihood of default</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Input
            id="average_pd"
            type="number"
            value={formData.average_pd || ''}
            onChange={(e) => onChange('average_pd', e.target.value)}
            
            min="0"
            max="100"
            step="0.01"
          />
        </div>

        <div>
          <Label htmlFor="average_lgd" className="flex items-center gap-2">
            Average Loss Given Default - Last 6 Months (%)
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Average percentage of loss if default occurs</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Input
            id="average_lgd"
            type="number"
            value={formData.average_lgd || ''}
            onChange={(e) => onChange('average_lgd', e.target.value)}
            min="0"
            max="100"
            step="0.01"
          />
        </div>

        <div>
          <Label htmlFor="average_rwa" className="flex items-center gap-2">
            Average Risk-Weighted Assets - Last 6 Months (₹)
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Assets weighted by their risk levels</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Input
            id="average_rwa"
            type="number"
            value={formData.average_rwa || ''}
            onChange={(e) => onChange('average_rwa', e.target.value)}
            min="0"
          />
        </div>

        <div>
          <Label htmlFor="dpd_trigger_count">DPD Trigger Count</Label>
          <Input
            id="dpd_trigger_count"
            type="number"
            value={formData.dpd_trigger_count || ''}
            onChange={(e) => onChange('dpd_trigger_count', e.target.value)}
            min="0"
          />
        </div>

        <div>
          <Label htmlFor="cash_flow_volatility">Cash Flow Volatility (0-1)</Label>
          <Input
            id="cash_flow_volatility"
            type="number"
            value={formData.cash_flow_volatility || ''}
            onChange={(e) => onChange('cash_flow_volatility', e.target.value)}
            min="0"
            max="1"
            step="0.01"
          />
        </div>

        <div>
          <Label htmlFor="seasonal_spending_pattern">Seasonal Spending Pattern</Label>
          <Select value={formData.seasonal_spending_pattern} onValueChange={(v) => onChange('seasonal_spending_pattern', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select pattern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
};
