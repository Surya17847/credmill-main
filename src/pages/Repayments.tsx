import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  CalendarCheck, AlertTriangle, Clock, IndianRupee, TrendingUp,
  CheckCircle2, XCircle, AlertCircle, BarChart2
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine, Legend
} from "recharts";

interface Loan {
  id: string;
  loan_amount: number;
  loan_term_months: number;
  interest_rate: number;
  monthly_emi: number;
  total_payable: number;
  remaining_principal: number;
  status: string;
  credit_score_impact: number;
  created_at: string;
}

interface Repayment {
  id: string;
  loan_id: string;
  month_number: number;
  due_date: string;
  emi_amount: number;
  principal_portion: number;
  interest_portion: number;
  amount_paid: number;
  paid_date: string | null;
  status: string;
  penalty_amount: number;
  fine_amount: number;
  score_impact: number;
}

export default function Repayments() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [repayments, setRepayments] = useState<Repayment[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"schedule" | "analytics">("schedule");

  useEffect(() => {
    loadLoans();
  }, []);

  const loadLoans = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await (supabase as any)
      .from('loans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setLoans(data);
      if (data.length > 0 && !selectedLoan) {
        setSelectedLoan(data[0].id);
        loadRepayments(data[0].id);
      }
    }
    setLoading(false);
  };

  const loadRepayments = async (loanId: string) => {
    const { data } = await (supabase as any)
      .from('repayments')
      .select('*')
      .eq('loan_id', loanId)
      .order('month_number', { ascending: true });

    if (data) setRepayments(data);
  };

  const handleSelectLoan = (loanId: string) => {
    setSelectedLoan(loanId);
    loadRepayments(loanId);
  };

  const handlePayEMI = async (repayment: Repayment) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date();
    const dueDate = new Date(repayment.due_date);
    const daysDiff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    let status = 'paid_on_time';
    let penalty = 0;
    let fine = 0;
    let scoreImpact = 5;

    if (daysDiff > 30) {
      status = 'missed';
      penalty = repayment.emi_amount * 0.05;
      scoreImpact = -15;
    } else if (daysDiff > 0) {
      status = 'paid_late';
      fine = repayment.emi_amount * 0.02;
      scoreImpact = -5;
    } else if (daysDiff < -15) {
      scoreImpact = 10;
      status = 'paid_early';
    }

    const totalPaid = repayment.emi_amount + penalty + fine;

    await (supabase as any)
      .from('repayments')
      .update({
        amount_paid: totalPaid,
        paid_date: today.toISOString().split('T')[0],
        status,
        penalty_amount: penalty,
        fine_amount: fine,
        score_impact: scoreImpact,
      })
      .eq('id', repayment.id);

    const loan = loans.find(l => l.id === repayment.loan_id);
    if (loan) {
      const newRemaining = Math.max(0, loan.remaining_principal - repayment.principal_portion);
      const newImpact = loan.credit_score_impact + scoreImpact;

      await (supabase as any)
        .from('loans')
        .update({
          remaining_principal: newRemaining,
          credit_score_impact: newImpact,
          status: newRemaining <= 0 ? 'completed' : 'active',
        })
        .eq('id', loan.id);

      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('latest_credit_score')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        const newScore = Math.max(300, Math.min(900, (profile.latest_credit_score || 650) + scoreImpact));
        await (supabase as any)
          .from('profiles')
          .update({ latest_credit_score: newScore })
          .eq('user_id', user.id);
      }
    }

    const statusMessages: Record<string, string> = {
      paid_early: '🌟 Paid early! Score impact: +10',
      paid_on_time: '✅ Paid on time! Score impact: +5',
      paid_late: `⚠️ Paid late. Fine: ₹${fine.toFixed(0)}. Score impact: -5`,
      missed: `🚨 Missed (30+ days late). Penalty: ₹${penalty.toFixed(0)}. Score impact: -15`,
    };

    toast(statusMessages[status] || 'Payment recorded');
    loadLoans();
    loadRepayments(repayment.loan_id);
  };

  const handlePayoffRemaining = async (loan: Loan) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const pendingRepayments = repayments.filter(r => r.status === 'pending');
    const earlyPayoffBonus = pendingRepayments.length * 8;

    for (const r of pendingRepayments) {
      await (supabase as any)
        .from('repayments')
        .update({
          amount_paid: r.principal_portion,
          paid_date: new Date().toISOString().split('T')[0],
          status: 'paid_early',
          score_impact: 8,
        })
        .eq('id', r.id);
    }

    await (supabase as any)
      .from('loans')
      .update({
        remaining_principal: 0,
        credit_score_impact: loan.credit_score_impact + earlyPayoffBonus,
        status: 'completed',
      })
      .eq('id', loan.id);

    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('latest_credit_score')
      .eq('user_id', user.id)
      .single();

    if (profile) {
      const newScore = Math.min(900, (profile.latest_credit_score || 650) + earlyPayoffBonus);
      await (supabase as any)
        .from('profiles')
        .update({ latest_credit_score: newScore })
        .eq('user_id', user.id);
    }

    toast(`🎉 Loan paid off early! Credit score boosted by +${earlyPayoffBonus} points!`);
    loadLoans();
    loadRepayments(loan.id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid_on_time': return <Badge className="bg-green-500 text-white">On Time ✓</Badge>;
      case 'paid_early':   return <Badge className="bg-emerald-600 text-white">Early ✨</Badge>;
      case 'paid_late':    return <Badge className="bg-yellow-500 text-white">Late ⚠️</Badge>;
      case 'missed':       return <Badge variant="destructive">Missed 🚨</Badge>;
      default:             return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getRowClass = (status: string) => {
    switch (status) {
      case 'paid_late':  return 'bg-yellow-50 border-b border-yellow-100';
      case 'missed':     return 'bg-red-50 border-b border-red-100';
      case 'paid_early': return 'bg-emerald-50 border-b border-emerald-100';
      case 'paid_on_time': return 'bg-green-50/40 border-b';
      default:           return 'border-b hover:bg-muted/50';
    }
  };

  // Derived stats
  const activeLoan = loans.find(l => l.id === selectedLoan);
  const paidCount       = repayments.filter(r => r.status !== 'pending').length;
  const onTimeCount     = repayments.filter(r => r.status === 'paid_on_time').length;
  const earlyCount      = repayments.filter(r => r.status === 'paid_early').length;
  const lateCount       = repayments.filter(r => r.status === 'paid_late').length;
  const missedCount     = repayments.filter(r => r.status === 'missed').length;
  const totalScore      = repayments.reduce((sum, r) => sum + (r.score_impact || 0), 0);
  const totalPenalties  = repayments.reduce((sum, r) => sum + (r.penalty_amount || 0) + (r.fine_amount || 0), 0);

  // Chart data: cumulative score impact over months paid
  const scoreTrendData = repayments
    .filter(r => r.status !== 'pending')
    .map((r, idx, arr) => ({
      month: `M${r.month_number}`,
      impact: r.score_impact,
      cumulative: arr.slice(0, idx + 1).reduce((s, x) => s + (x.score_impact || 0), 0),
      status: r.status,
    }));

  // Payment status distribution chart
  const statusDistribution = [
    { name: 'On Time', count: onTimeCount, fill: '#10b981' },
    { name: 'Early',   count: earlyCount,  fill: '#059669' },
    { name: 'Late',    count: lateCount,   fill: '#f59e0b' },
    { name: 'Missed',  count: missedCount, fill: '#ef4444' },
  ].filter(d => d.count > 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading repayments...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Loan Repayment Tracker</h1>
      <p className="text-muted-foreground mb-8">Track your EMI payments and see how they impact your credit score</p>

      {loans.length === 0 ? (
        <Card className="p-12 text-center">
          <IndianRupee className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Active Loans</h2>
          <p className="text-muted-foreground mb-4">Complete a credit risk prediction to get a loan approved and start tracking repayments.</p>
          <Button onClick={() => window.location.href = '/predict'}>Make a Prediction</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* ── Loan Selector ── */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Your Loans</h3>
            {loans.map(loan => (
              <Card
                key={loan.id}
                className={`p-4 cursor-pointer transition-all ${selectedLoan === loan.id ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
                onClick={() => handleSelectLoan(loan.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="font-bold">₹{loan.loan_amount.toLocaleString()}</p>
                  <Badge variant={loan.status === 'completed' ? 'default' : 'outline'}>
                    {loan.status === 'completed' ? '✅ Paid' : 'Active'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{loan.loan_term_months} months @ {loan.interest_rate}%</p>
                <p className="text-xs text-muted-foreground">EMI: ₹{loan.monthly_emi.toLocaleString()}</p>
                {loan.credit_score_impact !== 0 && (
                  <p className={`text-xs font-semibold mt-1 ${loan.credit_score_impact > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Score impact: {loan.credit_score_impact > 0 ? '+' : ''}{loan.credit_score_impact}
                  </p>
                )}
              </Card>
            ))}
          </div>

          {/* ── Main Panel ── */}
          <div className="lg:col-span-3 space-y-6">
            {activeLoan && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <IndianRupee className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Remaining</span>
                    </div>
                    <p className="text-xl font-bold">₹{activeLoan.remaining_principal.toLocaleString()}</p>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">EMIs Paid</span>
                    </div>
                    <p className="text-xl font-bold">{paidCount}/{repayments.length}</p>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Score Impact</span>
                    </div>
                    <p className={`text-xl font-bold ${totalScore >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {totalScore > 0 ? '+' : ''}{totalScore}
                    </p>
                  </Card>
                  <Card className="p-4">
                    {activeLoan.status === 'active' && activeLoan.remaining_principal > 0 ? (
                      <Button className="w-full h-full py-2" onClick={() => handlePayoffRemaining(activeLoan)}>
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Pay Off Early
                      </Button>
                    ) : (
                      <div className="flex items-center justify-center h-full text-green-600 font-bold text-sm">
                        ✅ Loan Completed
                      </div>
                    )}
                  </Card>
                </div>

                {/* Risk Alerts for Late/Missed */}
                {(lateCount > 0 || missedCount > 0) && (
                  <div className="space-y-3">
                    {missedCount > 0 && (
                      <Card className="p-4 border-l-4 border-l-red-500 bg-red-50">
                        <div className="flex items-start gap-3">
                          <XCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-semibold text-red-800">🚨 {missedCount} Missed Payment{missedCount > 1 ? 's' : ''} Detected</p>
                            <p className="text-sm text-red-700 mt-1">
                              Each missed payment carries a <strong>-15 credit score impact</strong> and a <strong>5% penalty</strong> on the EMI amount. 
                              Total score lost from missed payments: <strong>{missedCount * -15}</strong>.
                            </p>
                            <p className="text-sm text-red-600 mt-1">
                              💡 Tip: Set up auto-pay to prevent future missed payments. Consistent on-time payments can recover your score over time.
                            </p>
                          </div>
                        </div>
                      </Card>
                    )}
                    {lateCount > 0 && (
                      <Card className="p-4 border-l-4 border-l-yellow-500 bg-yellow-50">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-semibold text-yellow-800">⚠️ {lateCount} Late Payment{lateCount > 1 ? 's' : ''} on Record</p>
                            <p className="text-sm text-yellow-700 mt-1">
                              Late payments carry a <strong>-5 credit score impact</strong> and a <strong>2% fine</strong> per EMI. 
                              Total score lost from late payments: <strong>{lateCount * -5}</strong>.
                              Total fines incurred: <strong>₹{totalPenalties.toFixed(0)}</strong>.
                            </p>
                            <p className="text-sm text-yellow-600 mt-1">
                              💡 Tip: Pay at least 1 day before the due date to avoid late fees and credit score deductions.
                            </p>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                )}

                {/* Early Payoff Incentive */}
                {activeLoan.status === 'active' && repayments.filter(r => r.status === 'pending').length > 0 && (
                  <Card className="p-4 border-l-4 border-l-emerald-500 bg-emerald-50/50">
                    <p className="text-sm font-medium text-emerald-800">
                      💡 Pay off your loan early to get a <strong>+{repayments.filter(r => r.status === 'pending').length * 8}</strong> credit score boost!
                      Early payoff users get significantly higher scores.
                    </p>
                  </Card>
                )}

                {/* View Toggle */}
                <div className="flex gap-1 border-b">
                  <button
                    onClick={() => setActiveView("schedule")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                      activeView === "schedule" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Repayment Schedule
                  </button>
                  <button
                    onClick={() => setActiveView("analytics")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px flex items-center gap-1 ${
                      activeView === "analytics" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <BarChart2 className="h-4 w-4" />
                    Payment Analytics
                  </button>
                </div>

                {/* ── Schedule Tab ── */}
                {activeView === "schedule" && (
                  <Card className="p-6">
                    <h3 className="text-xl font-semibold mb-4">Repayment Schedule</h3>

                    {/* Status Legend */}
                    <div className="flex flex-wrap gap-3 mb-4 text-xs">
                      <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-emerald-500"></span> Early</span>
                      <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-green-400"></span> On Time</span>
                      <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-yellow-400"></span> Late (−5 pts, 2% fine)</span>
                      <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-red-500"></span> Missed (−15 pts, 5% penalty)</span>
                      <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-gray-300"></span> Pending</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/30">
                            <th className="text-left py-3 px-2 font-medium text-muted-foreground">Month</th>
                            <th className="text-left py-3 px-2 font-medium text-muted-foreground">Due Date</th>
                            <th className="text-right py-3 px-2 font-medium text-muted-foreground">EMI</th>
                            <th className="text-right py-3 px-2 font-medium text-muted-foreground">Principal</th>
                            <th className="text-right py-3 px-2 font-medium text-muted-foreground">Interest</th>
                            <th className="text-right py-3 px-2 font-medium text-muted-foreground">Penalty/Fine</th>
                            <th className="text-center py-3 px-2 font-medium text-muted-foreground">Status</th>
                            <th className="text-center py-3 px-2 font-medium text-muted-foreground">Score Δ</th>
                            <th className="text-center py-3 px-2 font-medium text-muted-foreground">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {repayments.map((r) => (
                            <tr key={r.id} className={getRowClass(r.status)}>
                              <td className="py-3 px-2 font-medium">{r.month_number}</td>
                              <td className="py-3 px-2">
                                <div>{new Date(r.due_date).toLocaleDateString()}</div>
                                {r.paid_date && (
                                  <div className="text-xs text-muted-foreground">
                                    Paid: {new Date(r.paid_date).toLocaleDateString()}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-2 text-right">₹{r.emi_amount.toLocaleString()}</td>
                              <td className="py-3 px-2 text-right">₹{r.principal_portion.toLocaleString()}</td>
                              <td className="py-3 px-2 text-right">₹{r.interest_portion.toLocaleString()}</td>
                              <td className="py-3 px-2 text-right">
                                {r.penalty_amount > 0 && (
                                  <div className="text-red-600 font-medium">₹{r.penalty_amount.toFixed(0)} <span className="text-xs">(penalty)</span></div>
                                )}
                                {r.fine_amount > 0 && (
                                  <div className="text-yellow-600 font-medium">₹{r.fine_amount.toFixed(0)} <span className="text-xs">(fine)</span></div>
                                )}
                                {r.penalty_amount === 0 && r.fine_amount === 0 && <span className="text-muted-foreground">—</span>}
                              </td>
                              <td className="py-3 px-2 text-center">{getStatusBadge(r.status)}</td>
                              <td className="py-3 px-2 text-center">
                                {r.score_impact !== 0 ? (
                                  <span className={`font-bold ${r.score_impact > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {r.score_impact > 0 ? '+' : ''}{r.score_impact}
                                  </span>
                                ) : <span className="text-muted-foreground">—</span>}
                              </td>
                              <td className="py-3 px-2 text-center">
                                {r.status === 'pending' && (
                                  <Button size="sm" onClick={() => handlePayEMI(r)}>Pay</Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        {paidCount > 0 && (
                          <tfoot>
                            <tr className="border-t-2 bg-muted/20 font-semibold">
                              <td colSpan={5} className="py-3 px-2 text-right text-muted-foreground">Totals:</td>
                              <td className="py-3 px-2 text-right text-red-600">
                                {totalPenalties > 0 ? `₹${totalPenalties.toFixed(0)}` : '—'}
                              </td>
                              <td className="py-3 px-2 text-center text-muted-foreground">{paidCount} paid</td>
                              <td className={`py-3 px-2 text-center font-bold ${totalScore >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {totalScore > 0 ? '+' : ''}{totalScore}
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </Card>
                )}

                {/* ── Analytics Tab ── */}
                {activeView === "analytics" && (
                  <div className="space-y-6">

                    {/* Payment Health Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="p-4 border-l-4 border-l-emerald-500">
                        <p className="text-xs text-muted-foreground mb-1">Early Payments</p>
                        <p className="text-2xl font-bold text-emerald-600">{earlyCount}</p>
                        <p className="text-xs text-emerald-600">+{earlyCount * 10} score pts</p>
                      </Card>
                      <Card className="p-4 border-l-4 border-l-green-500">
                        <p className="text-xs text-muted-foreground mb-1">On-Time Payments</p>
                        <p className="text-2xl font-bold text-green-600">{onTimeCount}</p>
                        <p className="text-xs text-green-600">+{onTimeCount * 5} score pts</p>
                      </Card>
                      <Card className="p-4 border-l-4 border-l-yellow-500">
                        <p className="text-xs text-muted-foreground mb-1">Late Payments</p>
                        <p className="text-2xl font-bold text-yellow-600">{lateCount}</p>
                        <p className="text-xs text-yellow-600">{lateCount * -5} score pts</p>
                      </Card>
                      <Card className="p-4 border-l-4 border-l-red-500">
                        <p className="text-xs text-muted-foreground mb-1">Missed Payments</p>
                        <p className="text-2xl font-bold text-red-600">{missedCount}</p>
                        <p className="text-xs text-red-600">{missedCount * -15} score pts</p>
                      </Card>
                    </div>

                    {/* Cumulative Score Impact Chart */}
                    {scoreTrendData.length > 0 && (
                      <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Cumulative Credit Score Impact</h3>
                        <ResponsiveContainer width="100%" height={260}>
                          <LineChart data={scoreTrendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                            <YAxis />
                            <Tooltip
                              formatter={(val: any, name: string) => [
                                name === 'cumulative' ? `${val > 0 ? '+' : ''}${val} pts` : `${val > 0 ? '+' : ''}${val}`,
                                name === 'cumulative' ? 'Cumulative Impact' : 'Monthly Impact'
                              ]}
                            />
                            <Legend />
                            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 4" />
                            <Line
                              type="monotone"
                              dataKey="cumulative"
                              name="Cumulative Impact"
                              stroke="#6366f1"
                              strokeWidth={3}
                              dot={(props: any) => {
                                const { cx, cy, payload } = props;
                                const color =
                                  payload.status === 'paid_early'   ? '#059669' :
                                  payload.status === 'paid_on_time' ? '#10b981' :
                                  payload.status === 'paid_late'    ? '#f59e0b' :
                                  payload.status === 'missed'       ? '#ef4444' : '#6366f1';
                                return <circle key={cx} cx={cx} cy={cy} r={5} fill={color} stroke="#fff" strokeWidth={2} />;
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="impact"
                              name="Monthly Impact"
                              stroke="#94a3b8"
                              strokeWidth={1.5}
                              strokeDasharray="4 4"
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </Card>
                    )}

                    {/* Payment Status Distribution */}
                    {statusDistribution.length > 0 && (
                      <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Payment Status Breakdown</h3>
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={statusDistribution}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <Tooltip formatter={(val: any) => [`${val} payment(s)`, 'Count']} />
                            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                              {statusDistribution.map((entry, index) => (
                                <Cell key={index} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </Card>
                    )}

                    {/* Penalty Summary */}
                    {totalPenalties > 0 && (
                      <Card className="p-5 bg-red-50 border border-red-200">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-semibold text-red-800 mb-1">Total Extra Charges Due to Late/Missed Payments</p>
                            <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                              <div>
                                <p className="text-muted-foreground">Total Fines (late)</p>
                                <p className="font-bold text-yellow-700">
                                  ₹{repayments.reduce((s, r) => s + (r.fine_amount || 0), 0).toFixed(0)}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Total Penalties (missed)</p>
                                <p className="font-bold text-red-700">
                                  ₹{repayments.reduce((s, r) => s + (r.penalty_amount || 0), 0).toFixed(0)}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Score Points Lost</p>
                                <p className="font-bold text-red-700">
                                  {(lateCount * -5) + (missedCount * -15)}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Total Extra Paid</p>
                                <p className="font-bold text-red-700">₹{totalPenalties.toFixed(0)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* Good performance message */}
                    {lateCount === 0 && missedCount === 0 && paidCount > 0 && (
                      <Card className="p-5 bg-green-50 border border-green-200">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-6 w-6 text-green-600" />
                          <div>
                            <p className="font-semibold text-green-800">🎉 Perfect Repayment Record!</p>
                            <p className="text-sm text-green-700 mt-1">
                              All {paidCount} payments made on time or early. You've earned <strong>+{totalScore} credit score points</strong>. 
                              Keep it up!
                            </p>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
