import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Shield, AlertCircle, CheckCircle2, Info } from "lucide-react";

export default function Fairness() {
  const fairnessMetrics = [
    {
      group: "Age: 20-30",
      approvalRate: 0.68,
      avgScore: 72,
      auc: 0.88,
      fpr: 0.12,
    },
    {
      group: "Age: 31-40",
      approvalRate: 0.74,
      avgScore: 76,
      auc: 0.89,
      fpr: 0.11,
    },
    {
      group: "Age: 41-50",
      approvalRate: 0.78,
      avgScore: 78,
      auc: 0.90,
      fpr: 0.10,
    },
    {
      group: "Age: 51+",
      approvalRate: 0.76,
      avgScore: 77,
      auc: 0.88,
      fpr: 0.11,
    },
  ];

  const disparateImpact = [
    { metric: "Approval Rate", value: 0.92, threshold: 0.80, status: "pass" },
    { metric: "False Positive Rate", value: 0.88, threshold: 0.80, status: "pass" },
    { metric: "False Negative Rate", value: 0.85, threshold: 0.80, status: "pass" },
    { metric: "Equal Opportunity", value: 0.94, threshold: 0.80, status: "pass" },
  ];

  const rocComparison = [
    { fpr: 0, group1: 0, group2: 0 },
    { fpr: 0.1, group1: 0.64, group2: 0.66 },
    { fpr: 0.2, group1: 0.77, group2: 0.79 },
    { fpr: 0.3, group1: 0.84, group2: 0.86 },
    { fpr: 0.4, group1: 0.88, group2: 0.90 },
    { fpr: 0.5, group1: 0.91, group2: 0.92 },
    { fpr: 0.6, group1: 0.93, group2: 0.94 },
    { fpr: 0.7, group1: 0.95, group2: 0.96 },
    { fpr: 0.8, group1: 0.97, group2: 0.98 },
    { fpr: 0.9, group1: 0.99, group2: 0.99 },
    { fpr: 1, group1: 1, group2: 1 },
  ];

  const overallScore = 91; // out of 100

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Fairness Audit</h1>
        <p className="text-muted-foreground">
          Evaluate model fairness across demographic groups to ensure equitable treatment
        </p>
      </div>

      {/* Overall Fairness Score */}
      <Card className="p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-gradient-primary p-4">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Overall Fairness Score</h2>
              <p className="text-muted-foreground">Based on multiple fairness metrics</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold text-primary">{overallScore}</div>
            <p className="text-sm text-muted-foreground">out of 100</p>
            <Badge className="mt-2" variant="default">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Excellent
            </Badge>
          </div>
        </div>
      </Card>

      {/* Info Banner */}
      <Card className="p-4 mb-8 bg-accent/5 border-accent/20">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold mb-1">About Fairness Metrics</h3>
            <p className="text-sm text-muted-foreground">
              We measure fairness using the "80% rule" (disparate impact ratio ≥ 0.80) and equal opportunity difference. The model passes when the ratio between groups for key metrics exceeds 0.80, indicating no significant bias.
            </p>
          </div>
        </div>
      </Card>

      {/* Disparate Impact Analysis */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Disparate Impact Analysis</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Comparing protected vs unprotected groups (80% rule threshold)
        </p>
        <div className="space-y-4">
          {disparateImpact.map((item, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  {item.status === "pass" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  )}
                  <span className="font-medium">{item.metric}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    Ratio: <strong className="text-foreground">{item.value.toFixed(2)}</strong>
                  </span>
                  <Badge variant={item.status === "pass" ? "default" : "secondary"}>
                    {item.status === "pass" ? "Pass" : "Review"}
                  </Badge>
                </div>
              </div>
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.status === "pass" ? "bg-green-500" : "bg-amber-500"}`}
                  style={{ width: `${item.value * 100}%` }}
                />
                <div
                  className="absolute top-0 h-full w-0.5 bg-border"
                  style={{ left: `${item.threshold * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Group Performance Comparison */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Group Performance Comparison</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={fairnessMetrics}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="group" className="text-xs" angle={-15} textAnchor="end" height={60} />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
              />
              <Legend />
              <Bar dataKey="approvalRate" fill="hsl(var(--chart-1))" name="Approval Rate" />
              <Bar dataKey="auc" fill="hsl(var(--chart-2))" name="AUC" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* ROC Curve Comparison */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">ROC Curve Comparison by Group</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={rocComparison}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="fpr"
                label={{ value: "False Positive Rate", position: "insideBottom", offset: -5 }}
                className="text-xs"
              />
              <YAxis
                label={{ value: "True Positive Rate", angle: -90, position: "insideLeft" }}
                className="text-xs"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="group1"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                name="Age 20-40 (AUC=0.88)"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="group2"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                name="Age 41+ (AUC=0.89)"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Detailed Metrics Table */}
      <Card className="p-6 mt-8">
        <h2 className="text-xl font-semibold mb-4">Detailed Fairness Metrics by Group</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold">Group</th>
                <th className="text-left py-3 px-4 font-semibold">Approval Rate</th>
                <th className="text-left py-3 px-4 font-semibold">Avg Risk Score</th>
                <th className="text-left py-3 px-4 font-semibold">AUC</th>
                <th className="text-left py-3 px-4 font-semibold">FPR</th>
              </tr>
            </thead>
            <tbody>
              {fairnessMetrics.map((metric, index) => (
                <tr key={index} className="border-b border-border hover:bg-muted/50">
                  <td className="py-3 px-4 font-medium">{metric.group}</td>
                  <td className="py-3 px-4">{(metric.approvalRate * 100).toFixed(1)}%</td>
                  <td className="py-3 px-4">{metric.avgScore}/100</td>
                  <td className="py-3 px-4">{metric.auc.toFixed(3)}</td>
                  <td className="py-3 px-4">{(metric.fpr * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
