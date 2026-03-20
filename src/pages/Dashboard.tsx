import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { TrendingUp, TrendingDown, BarChart3, History, Target, ArrowRight, User, CreditCard } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

const getRiskColorFromScore = (score: number | null) => {
  if (!score) return "text-muted-foreground";
  if (score >= 760) return "text-green-600";
  if (score >= 660) return "text-lime-600";
  if (score >= 540) return "text-yellow-600";
  if (score >= 420) return "text-orange-600";
  return "text-red-600";
};

const getRiskLabelFromScore = (score: number | null) => {
  if (!score) return "—";
  if (score >= 760) return "Very Low Risk";
  if (score >= 660) return "Low Risk";
  if (score >= 540) return "Medium Risk";
  if (score >= 420) return "High Risk";
  return "Very High Risk";
};

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [profileRes, predictionsRes] = await Promise.all([
      (supabase as any).from('profiles').select('*').eq('user_id', user.id).single(),
      (supabase as any).from('predictions').select('*').eq('user_id', user.id).eq('prediction_type', 'single').order('created_at', { ascending: false }).limit(50),
    ]);

    if (profileRes.data) setProfile(profileRes.data);
    if (predictionsRes.data) setPredictions(predictionsRes.data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  const latestPrediction = predictions[0];
  const latestScore = latestPrediction?.prediction_score;
  const previousScore = predictions[1]?.prediction_score;
  const scoreChange = latestScore && previousScore ? latestScore - previousScore : null;

  const chartData = [...predictions].reverse().map((p, i) => ({
    date: new Date(p.created_at).toLocaleDateString(),
    score: p.prediction_score,
    index: i + 1,
  }));

  const riskDistribution = predictions.reduce((acc: any, p) => {
    const score = p.prediction_score;
    const label = getRiskLabelFromScore(score);
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  const riskChartData = Object.entries(riskDistribution).map(([name, count]) => ({
    name,
    count,
    fill: name === "Very Low Risk" ? "#10b981" : name === "Low Risk" ? "#84cc16" :
          name === "Medium Risk" ? "#f59e0b" : name === "High Risk" ? "#f97316" : "#ef4444",
  }));

  const displayName = profile?.display_name || 'User';
  const avatarUrl = profile?.avatar_url;
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="container max-w-7xl py-8 px-4">
      {/* Profile Header */}
      <Card className="p-6 mb-8 bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="flex items-center gap-4 flex-wrap">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback className="text-lg bg-primary text-primary-foreground">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold">Welcome back, {displayName}!</h1>
            <p className="text-muted-foreground">{profile?.email}</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link to="/repayments">
              <Button variant="outline">
                <CreditCard className="mr-2 h-4 w-4" />
                Repayments
              </Button>
            </Link>
            <Link to="/predict">
              <Button>
                New Prediction <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <Target className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Latest Score</p>
              <p className="text-3xl font-bold">{latestScore ?? '—'}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            {scoreChange !== null && scoreChange >= 0 ? (
              <TrendingUp className="h-8 w-8 text-green-600" />
            ) : (
              <TrendingDown className="h-8 w-8 text-red-600" />
            )}
            <div>
              <p className="text-sm text-muted-foreground">Score Change</p>
              <p className={`text-3xl font-bold ${scoreChange !== null ? (scoreChange >= 0 ? 'text-green-600' : 'text-red-600') : ''}`}>
                {scoreChange !== null ? `${scoreChange > 0 ? '+' : ''}${scoreChange.toFixed(0)}` : '—'}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">Risk Level</p>
              <p className={`text-lg font-bold ${getRiskColorFromScore(latestScore)}`}>
                {getRiskLabelFromScore(latestScore)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <History className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Total Predictions</p>
              <p className="text-3xl font-bold">{predictions.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      {predictions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Credit Score History</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[300, 900]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="hsl(221, 83%, 53%)" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Risk Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={riskChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {riskChartData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Prediction History */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <User className="h-5 w-5" />
          Prediction History
          <span className="ml-1 bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">
            {predictions.length}
          </span>
        </h3>
        {predictions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="mb-4">No predictions yet. Start your first credit risk assessment!</p>
            <Link to="/predict"><Button>Make a Prediction</Button></Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Score</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Risk Level</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Credit Score</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Income</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Loan Amount</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-2">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-2 font-semibold">{p.prediction_score ?? '—'}</td>
                    <td className={`py-3 px-2 font-medium ${getRiskColorFromScore(p.prediction_score)}`}>
                      {getRiskLabelFromScore(p.prediction_score)}
                    </td>
                    <td className="py-3 px-2">{p.credit_score ?? '—'}</td>
                    <td className="py-3 px-2">₹{p.annual_income?.toLocaleString() ?? '—'}</td>
                    <td className="py-3 px-2">₹{p.loan_amount_requested?.toLocaleString() ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
