import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { User } from "lucide-react";

interface Step1PersonalProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export const Step1Personal = ({ formData, onChange }: Step1PersonalProps) => {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <User className="w-5 h-5 text-primary" />
        <h2 className="text-2xl font-bold">Personal & Residential Information</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="age">Age *</Label>
          <Input
            id="age"
            type="number"
            value={formData.age || ''}
            onChange={(e) => onChange('age', e.target.value)}
            required
            min="18"
            max="100"
          />
        </div>

        <div>
          <Label htmlFor="employment_status">Employment Status *</Label>
          <Select value={formData.employment_status} onValueChange={(v) => onChange('employment_status', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Employed">Employed</SelectItem>
              <SelectItem value="Self-Employed">Self-Employed</SelectItem>
              <SelectItem value="Unemployed">Unemployed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="employment_duration">Employment Duration (Years) *</Label>
          <Input
            id="employment_duration"
            type="number"
            value={formData.employment_duration || ''}
            onChange={(e) => onChange('employment_duration', e.target.value)}
            required
            min="0"
            step="0.1"
          />
        </div>

        <div>
          <Label htmlFor="housing_status">Housing Status *</Label>
          <Select value={formData.housing_status} onValueChange={(v) => onChange('housing_status', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Own">Own</SelectItem>
              <SelectItem value="Rent">Rent</SelectItem>
              <SelectItem value="Mortgage">Mortgage</SelectItem>
              <SelectItem value="With Family">With Family</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="years_at_residence">Years at Current Residence *</Label>
          <Input
            id="years_at_residence"
            type="number"
            value={formData.years_at_residence || ''}
            onChange={(e) => onChange('years_at_residence', e.target.value)}
            required
            min="0"
            step="0.1"
          />
        </div>

        <div>
          <Label htmlFor="city_region">City/Region of Residence *</Label>
          <Input
            id="city_region"
            value={formData.city_region || ''}
            onChange={(e) => onChange('city_region', e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="industry_sector">Industry Sector *</Label>
          <Select value={formData.industry_sector} onValueChange={(v) => onChange('industry_sector', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select sector" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Finance">Finance</SelectItem>
              <SelectItem value="Technology">Technology</SelectItem>
              <SelectItem value="Healthcare">Healthcare</SelectItem>
              <SelectItem value="Manufacturing">Manufacturing</SelectItem>
              <SelectItem value="Retail">Retail</SelectItem>
              <SelectItem value="Education">Education</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="education_level">Education Level *</Label>
          <Select value={formData.education_level} onValueChange={(v) => onChange('education_level', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select education" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="High School">High School</SelectItem>
              <SelectItem value="Undergraduate">Undergraduate</SelectItem>
              <SelectItem value="Postgraduate">Postgraduate</SelectItem>
              <SelectItem value="Doctorate">Doctorate</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="marital_status">Marital Status *</Label>
          <Select value={formData.marital_status} onValueChange={(v) => onChange('marital_status', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Single">Single</SelectItem>
              <SelectItem value="Married">Married</SelectItem>
              <SelectItem value="Divorced">Divorced</SelectItem>
              <SelectItem value="Widowed">Widowed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="number_of_dependents">Number of Dependents *</Label>
          <Input
            id="number_of_dependents"
            type="number"
            value={formData.number_of_dependents || ''}
            onChange={(e) => onChange('number_of_dependents', e.target.value)}
            required
            min="0"
          />
        </div>
      </div>
    </Card>
  );
};
