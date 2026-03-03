import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { TrendingUp, Award, Target, Zap } from "lucide-react";

export default function Evaluation() {
  const modelMetrics = [
    { model: "XGBoost", mae: 0.0910, mse: 0.0434, r2: 0.9551 },
    { model: "GradientBoosting", mae: 0.1019, mse: 0.0461, r2: 0.9523 },
    { model: "RandomForest", mae: 0.1213, mse: 0.0551, r2: 0.9430 },
    { model: "SVR", mae: 0.1224, mse: 0.0548, r2: 0.9432 },
    { model: "LinearRegression", mae: 0.1789, mse: 0.0783, r2: 0.9189 },
    { model: "Ridge", mae: 0.1788, mse: 0.0783, r2: 0.9189 },
    { model: "DecisionTree", mae: 0.2002, mse: 0.1369, r2: 0.8582 },
    { model: "Lasso", mae: 0.7952, mse: 0.9660, r2: -0.0006 },
  ];

  const rocData = [
    { fpr: 0, tpr: 0 },
    { fpr: 0.1, tpr: 0.65 },
    { fpr: 0.2, tpr: 0.78 },
    { fpr: 0.3, tpr: 0.85 },
    { fpr: 0.4, tpr: 0.89 },
    { fpr: 0.5, tpr: 0.91 },
    { fpr: 0.6, tpr: 0.94 },
    { fpr: 0.7, tpr: 0.96 },
    { fpr: 0.8, tpr: 0.98 },
    { fpr: 0.9, tpr: 0.99 },
    { fpr: 1, tpr: 1 },
  ];

  const radarData = [
    { metric: "R²", XGBoost: 0.9551, GradientBoosting: 0.9523, RandomForest: 0.9430, SVR: 0.9432 },
    { metric: "MAE (inv)", XGBoost: 1-0.0910, GradientBoosting: 1-0.1019, RandomForest: 1-0.1213, SVR: 1-0.1224 },
    { metric: "MSE (inv)", XGBoost: 1-0.0434, GradientBoosting: 1-0.0461, RandomForest: 1-0.0551, SVR: 1-0.0548 },
  ];

  const highlights = [
    {
      icon: Award,
      label: "Best Model",
      value: "XGBoost",
      color: "text-green-500",
    },
    {
      icon: Target,
      label: "Best R²",
      value: "0.9551",
      color: "text-primary",
    },
    {
      icon: TrendingUp,
      label: "Best MAE",
      value: "0.0910",
      color: "text-accent",
    },
    {
      icon: Zap,
      label: "Best MSE",
      value: "0.0434",
      color: "text-amber-500",
    },
  ];

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">About: Model Performance</h1>
        <p className="text-muted-foreground">
          Performance comparison of trained credit risk models
        </p>
      </div>

      {/* Key Highlights */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {highlights.map((item, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg bg-muted p-2 ${item.color}`}>
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="text-2xl font-bold">{item.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Model Comparison Table */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Model Performance Metrics</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold">Model</th>
                <th className="text-left py-3 px-4 font-semibold">MAE</th>
                <th className="text-left py-3 px-4 font-semibold">MSE</th>
                <th className="text-left py-3 px-4 font-semibold">R²</th>
              </tr>
            </thead>
            <tbody>
              {modelMetrics.map((model, index) => (
                <tr key={index} className="border-b border-border hover:bg-muted/50">
                  <td className="py-3 px-4 font-medium">
                    {model.model}
                    {index === 0 && (
                      <Badge className="ml-2" variant="default">Best</Badge>
                    )}
                  </td>
                  <td className="py-3 px-4">{model.mae.toFixed(4)}</td>
                  <td className="py-3 px-4">{model.mse.toFixed(4)}</td>
                  <td className="py-3 px-4">{model.r2.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-8 md:grid-cols-2">
        {/* R² Score Comparison */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">R² Score by Model</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={modelMetrics} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis type="number" domain={[-0.1, 1]} className="text-xs" />
              <YAxis type="category" dataKey="model" className="text-xs" width={120} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--background))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem"
                }}
              />
              <Legend />
              <Bar dataKey="r2" fill="hsl(var(--chart-1))" name="R² Score" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Error Metrics Comparison */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Error Metrics (MAE & MSE)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={modelMetrics}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="model" className="text-xs" angle={-45} textAnchor="end" height={100} />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--background))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem"
                }}
              />
              <Legend />
              <Bar dataKey="mae" fill="hsl(var(--chart-2))" name="MAE" />
              <Bar dataKey="mse" fill="hsl(var(--chart-3))" name="MSE" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Radar Chart */}
        <Card className="p-6 md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Top 4 Models Performance Radar</h2>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid className="stroke-border" />
              <PolarAngleAxis dataKey="metric" className="text-sm" />
              <PolarRadiusAxis angle={90} domain={[0, 1]} className="text-xs" />
              <Radar 
                name="XGBoost" 
                dataKey="XGBoost" 
                stroke="hsl(var(--chart-1))" 
                fill="hsl(var(--chart-1))" 
                fillOpacity={0.3} 
              />
              <Radar 
                name="GradientBoosting" 
                dataKey="GradientBoosting" 
                stroke="hsl(var(--chart-2))" 
                fill="hsl(var(--chart-2))" 
                fillOpacity={0.3} 
              />
              <Radar 
                name="RandomForest" 
                dataKey="RandomForest" 
                stroke="hsl(var(--chart-3))" 
                fill="hsl(var(--chart-3))" 
                fillOpacity={0.3} 
              />
              <Radar 
                name="SVR" 
                dataKey="SVR" 
                stroke="hsl(var(--chart-4))" 
                fill="hsl(var(--chart-4))" 
                fillOpacity={0.3} 
              />
              <Legend />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--background))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem"
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
