import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarCheck, AlertTriangle, Clock, IndianRupee, TrendingUp, TrendingDown,
  CheckCircle2, XCircle, AlertCircle, BarChart2, ShieldAlert
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

// ─── Credit Scoring Engine ──────────────────────────────────────────────────
function calculatePaymentScoring(
  daysDiff: number, // positive = late, negative = early
  emiAmount: number,
  consecutiveOnTime: number,
  consecutiveLate: number,
  totalOnTimeStreak: number,
  utilization: number,
  isLastEMI: boolean,
  allPaidCount: number,
  totalEMIs: number,
) {
  let scoreImpact = 0;
  let penalty = 0;
  let fine = 0;
  let status = 'paid_on_time';
  let pdChange = 0;

  // 1️⃣ Payment Timing Rules
  if (daysDiff <= 0) {
    // Early or on-time
    if (daysDiff < 0) {
      status = 'paid_early';
      scoreImpact = 10;
      pdChange = -1;
    } else {
      status = 'paid_on_time';
      scoreImpact = 8;
      pdChange = -0.5;
    }
  } else if (daysDiff <= 30) {
    status = 'paid_late';
    scoreImpact = -15;
    pdChange = 2;
    fine = emiAmount * 0.02;
  } else if (daysDiff <= 60) {
    status = 'paid_late';
    scoreImpact = -50;
    pdChange = 5;
    fine = emiAmount * 0.03;
  } else if (daysDiff <= 90) {
    status = 'paid_late';
    scoreImpact = -75;
    pdChange = 8;
    penalty = emiAmount * 0.05;
  } else {
    status = 'missed';
    scoreImpact = -100;
    pdChange = 12;
    penalty = emiAmount * 0.05;
  }

  // 3️⃣ Consecutive Behavior Bonus / Penalty
  if (status === 'paid_on_time' || status === 'paid_early') {
    const newStreak = consecutiveOnTime + 1;
    if (newStreak === 6) scoreImpact += 15;
    if (newStreak === 12) scoreImpact += 20; // risk category upgrade bonus
  }
  if (status === 'paid_late' || status === 'missed') {
    const newLateStreak = consecutiveLate + 1;
    if (newLateStreak >= 3) scoreImpact -= 30; // additional penalty
  }

  // 4️⃣ Utilization Impact
  if (utilization < 0.3) {
    scoreImpact += 5;
  } else if (utilization > 0.7) {
    scoreImpact -= 20;
  }

  // 5️⃣ Full Repayment Case
  if (isLastEMI && (status === 'paid_on_time' || status === 'paid_early')) {
    scoreImpact += 25;
    pdChange -= 5;
  }

  const totalPaid = emiAmount + penalty + fine;

  return { scoreImpact, penalty, fine, status, pdChange, totalPaid };
}

function getRiskCategory(pd: number) {
  if (pd < 10) return { label: 'Low Risk', color: 'text-green-600' };
  if (pd <= 25) return { label: 'Medium Risk', color: 'text-yellow-600' };
  return { label: 'High Risk', color: 'text-red-600' };
}

function clampScore(score: number) {
  return Math.max(300, Math.min(900, score));
}

export default function Repayments() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [repayments, setRepayments] = useState<Repayment[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"schedule" | "analytics">("schedule");
  const [currentPD, setCurrentPD] = useState(10); // default PD
  const [currentScore, setCurrentScore] = useState(650);
  const [paymentMode, setPaymentMode] = useState<Record<string, string>>({});

  useEffect(() => {
    loadLoans();
  }, []);

  const loadLoans = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [loansRes, profileRes] = await Promise.all([
      (supabase as any).from('loans').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      (supabase as any).from('profiles').select('latest_credit_score').eq('user_id', user.id).single(),
    ]);

    if (profileRes.data) {
      setCurrentScore(profileRes.data.latest_credit_score || 650);
    }

    if (loansRes.data) {
      setLoans(loansRes.data);
      if (loansRes.data.length > 0 && !selectedLoan) {
        setSelectedLoan(loansRes.data[0].id);
        loadRepayments(loansRes.data[0].id);
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

  // Check if previous EMIs are paid
  const canPayEMI = (repayment: Repayment) => {
    const previousUnpaid = repayments.find(
      r => r.month_number < repayment.month_number && r.status === 'pending'
    );
    return !previousUnpaid;
  };

  // Get consecutive streaks from paid repayments
  const getStreaks = () => {
    const paid = repayments.filter(r => r.status !== 'pending');
    let consecutiveOnTime = 0;
    let consecutiveLate = 0;
    
    for (let i = paid.length - 1; i >= 0; i--) {
      if (paid[i].status === 'paid_on_time' || paid[i].status === 'paid_early') {
        if (consecutiveLate === 0) consecutiveOnTime++;
        else break;
      } else {
        if (consecutiveOnTime === 0) consecutiveLate++;
        else break;
      }
    }
    return { consecutiveOnTime, consecutiveLate };
  };

  const handlePayEMI = async (repayment: Repayment, mode?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (!canPayEMI(repayment)) {
      toast.error("Please pay previous EMIs first before paying this one.");
      return;
    }

    const today = new Date();
    const dueDate = new Date(repayment.due_date);
    let daysDiff: number;

    // Determine payment timing based on mode
    if (mode === 'late_1_30') {
      daysDiff = 15; // simulate 1-30 days late
    } else if (mode === 'late_31_60') {
      daysDiff = 45;
    } else if (mode === 'late_61_90') {
      daysDiff = 75;
    } else if (mode === 'missed') {
      daysDiff = 95; // 90+ days
    } else {
      daysDiff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    const loan = loans.find(l => l.id === repayment.loan_id);
    if (!loan) return;

    const { consecutiveOnTime, consecutiveLate } = getStreaks();
    const utilization = loan.remaining_principal / loan.loan_amount;
    const pendingCount = repayments.filter(r => r.status === 'pending').length;
    const isLastEMI = pendingCount === 1;
    const paidCount = repayments.filter(r => r.status !== 'pending').length;

    const result = calculatePaymentScoring(
      daysDiff, repayment.emi_amount,
      consecutiveOnTime, consecutiveLate,
      consecutiveOnTime, utilization,
      isLastEMI, paidCount, repayments.length
    );

    // Calculate DPD count
    const currentDPD = repayments.filter(r => 
      r.status === 'missed' || (r.status === 'paid_late' && r.penalty_amount > 0)
    ).length + (result.status === 'missed' ? 1 : 0);

    // Check if 3 consecutive missed → downgrade
    let extraPenalty = 0;
    if (result.status === 'missed' && consecutiveLate >= 2) {
      extraPenalty = -30; // 3 consecutive missed = risk downgrade
    }

    const finalScoreImpact = result.scoreImpact + extraPenalty;

    await (supabase as any)
      .from('repayments')
      .update({
        amount_paid: result.totalPaid,
        paid_date: today.toISOString().split('T')[0],
        status: result.status,
        penalty_amount: result.penalty,
        fine_amount: result.fine,
        score_impact: finalScoreImpact,
      })
      .eq('id', repayment.id);

    const newRemaining = Math.max(0, loan.remaining_principal - repayment.principal_portion);
    const newImpact = loan.credit_score_impact + finalScoreImpact;
    const isCompleted = isLastEMI || newRemaining <= 0;

    await (supabase as any)
      .from('loans')
      .update({
        remaining_principal: newRemaining,
        credit_score_impact: newImpact,
        status: isCompleted ? 'completed' : 'active',
      })
      .eq('id', loan.id);

    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('latest_credit_score')
      .eq('user_id', user.id)
      .single();

    if (profile) {
      const newScore = clampScore((profile.latest_credit_score || 650) + finalScoreImpact);
      setCurrentScore(newScore);
      
      // Update PD
      const newPD = Math.max(0, Math.min(100, currentPD + result.pdChange));
      setCurrentPD(newPD);
      const riskCat = getRiskCategory(newPD);

      await (supabase as any)
        .from('profiles')
        .update({ 
          latest_credit_score: newScore,
          latest_risk_level: riskCat.label,
        })
        .eq('user_id', user.id);
    }

    const statusMessages: Record<string, string> = {
      paid_early: `🌟 Paid early! Score: +${finalScoreImpact}`,
      paid_on_time: `✅ Paid on time! Score: +${finalScoreImpact}`,
      paid_late: `⚠️ Late payment. Fine: ₹${result.fine.toFixed(0)}. Score: ${finalScoreImpact}`,
      missed: `🚨 Default-level late (90+ days). Penalty: ₹${result.penalty.toFixed(0)}. Score: ${finalScoreImpact}`,
    };

    toast(statusMessages[result.status] || 'Payment recorded');
    loadLoans();
    loadRepayments(repayment.loan_id);
  };

  const handlePayoffRemaining = async (loan: Loan) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const pendingRepayments = repayments.filter(r => r.status === 'pending');
    // Early payoff: +25 completion bonus + per-month bonus
    const perMonthBonus = 8;
    const completionBonus = 25;
    const earlyPayoffBonus = (pendingRepayments.length * perMonthBonus) + completionBonus;

    for (const r of pendingRepayments) {
      await (supabase as any)
        .from('repayments')
        .update({
          amount_paid: r.principal_portion,
          paid_date: new Date().toISOString().split('T')[0],
          status: 'paid_early',
          score_impact: perMonthBonus,
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
      const newScore = clampScore((profile.latest_credit_score || 650) + earlyPayoffBonus);
      setCurrentScore(newScore);
      const newPD = Math.max(0, currentPD - 5);
      setCurrentPD(newPD);
      
      await (supabase as any)
        .from('profiles')
        .update({ 
          latest_credit_score: newScore,
          latest_risk_level: getRiskCategory(newPD).label,
        })
        .eq('user_id', user.id);
    }

    toast(`🎉 Loan paid off early! Credit score boosted by +${earlyPayoffBonus} points! Loan marked as Successfully Closed.`);
    loadLoans();
    loadRepayments(loan.id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid_on_time': return <Badge className="bg-green-500 text-white">On Time ✓</Badge>;
      case 'paid_early':   return <Badge className="bg-emerald-600 text-white">Early ✨</Badge>;
      case 'paid_late':    return <Badge className="bg-yellow-500 text-white">Late ⚠️</Badge>;
      case 'missed':       return <Badge variant="destructive">Default 🚨</Badge>;
      default:             return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getRowClass = (status: string) => {
    switch (status) {
      case 'paid_late':  return 'bg-yellow-50 dark:bg-yellow-950/20 border-b border-yellow-100 dark:border-yellow-900/30';
      case 'missed':     return 'bg-red-50 dark:bg-red-950/20 border-b border-red-100 dark:border-red-900/30';
      case 'paid_early': return 'bg-emerald-50 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900/30';
      case 'paid_on_time': return 'bg-green-50/40 dark:bg-green-950/10 border-b';
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
  const dpdCount        = repayments.filter(r => r.status === 'missed').length;
  const riskCategory    = getRiskCategory(currentPD);

  // Chart data
  const scoreTrendData = repayments
    .filter(r => r.status !== 'pending')
    .map((r, idx, arr) => ({
      month: `M${r.month_number}`,
      impact: r.score_impact,
      cumulative: arr.slice(0, idx + 1).reduce((s, x) => s + (x.score_impact || 0), 0),
      status: r.status,
    }));

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
                    {loan.status === 'completed' ? '✅ Closed' : 'Active'}
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
                {/* Summary Cards with Score, PD, Risk, DPD */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <IndianRupee className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Remaining</span>
                    </div>
                    <p className="text-xl font-bold">₹{activeLoan.remaining_principal.toLocaleString()}</p>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Credit Score</span>
                    </div>
                    <p className={`text-xl font-bold ${currentScore >= 660 ? 'text-green-600' : currentScore >= 540 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {currentScore}
                    </p>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">PD</span>
                    </div>
                    <p className="text-xl font-bold">{currentPD.toFixed(1)}%</p>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Risk / DPD</span>
                    </div>
                    <p className={`text-sm font-bold ${riskCategory.color}`}>{riskCategory.label}</p>
                    <p className="text-xs text-muted-foreground">DPD: {dpdCount}</p>
                  </Card>
                  <Card className="p-4">
                    {activeLoan.status === 'active' && activeLoan.remaining_principal > 0 ? (
                      <Button className="w-full h-full py-2" onClick={() => handlePayoffRemaining(activeLoan)}>
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Pay Off Early
                      </Button>
                    ) : (
                      <div className="flex items-center justify-center h-full text-green-600 font-bold text-sm">
                        ✅ Loan Closed
                      </div>
                    )}
                  </Card>
                </div>

                {/* Score Change Indicator */}
                {totalScore !== 0 && (
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                    totalScore > 0 
                      ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400' 
                      : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400'
                  }`}>
                    {totalScore > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    Total Score Impact: {totalScore > 0 ? '+' : ''}{totalScore} points from {paidCount} payments
                  </div>
                )}

                {/* Risk Alerts */}
                {(lateCount > 0 || missedCount > 0) && (
                  <div className="space-y-3">
                    {missedCount > 0 && (
                      <Card className="p-4 border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/20">
                        <div className="flex items-start gap-3">
                          <XCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-semibold text-red-800 dark:text-red-400">🚨 {missedCount} Default-Level Payment{missedCount > 1 ? 's' : ''}</p>
                            <p className="text-sm text-red-700 dark:text-red-500 mt-1">
                              Each default carries <strong>-100 score</strong> and <strong>+12% PD increase</strong>.
                              {missedCount >= 3 && " ⚠️ Risk category downgraded due to 3+ defaults."}
                            </p>
                          </div>
                        </div>
                      </Card>
                    )}
                    {lateCount > 0 && (
                      <Card className="p-4 border-l-4 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-semibold text-yellow-800 dark:text-yellow-400">⚠️ {lateCount} Late Payment{lateCount > 1 ? 's' : ''}</p>
                            <p className="text-sm text-yellow-700 dark:text-yellow-500 mt-1">
                              Late payments carry -15 to -75 score impact depending on days late. Total fines: ₹{totalPenalties.toFixed(0)}.
                            </p>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                )}

                {/* Early Payoff Incentive */}
                {activeLoan.status === 'active' && repayments.filter(r => r.status === 'pending').length > 0 && (
                  <Card className="p-4 border-l-4 border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20">
                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-400">
                      💡 Pay off early for <strong>+{(repayments.filter(r => r.status === 'pending').length * 8) + 25}</strong> score boost (includes +25 completion bonus + -5% PD)!
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

                    {/* Legend */}
                    <div className="flex flex-wrap gap-3 mb-4 text-xs">
                      <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-emerald-500"></span> Early (+10)</span>
                      <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-green-400"></span> On Time (+8)</span>
                      <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-yellow-400"></span> 1-30d Late (-15)</span>
                      <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-orange-400"></span> 31-60d (-50)</span>
                      <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-red-400"></span> 61-90d (-75)</span>
                      <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-red-600"></span> 90+d Default (-100)</span>
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
                                  <div className="flex flex-col gap-1 items-center">
                                    {!canPayEMI(r) ? (
                                      <span className="text-xs text-muted-foreground">Pay previous first</span>
                                    ) : (
                                      <>
                                        <Button size="sm" onClick={() => handlePayEMI(r)} className="w-full text-xs">
                                          Pay Now
                                        </Button>
                                        <Select
                                          value={paymentMode[r.id] || ''}
                                          onValueChange={(val) => {
                                            setPaymentMode(prev => ({ ...prev, [r.id]: val }));
                                            handlePayEMI(r, val);
                                          }}
                                        >
                                          <SelectTrigger className="h-7 text-xs w-full">
                                            <SelectValue placeholder="Simulate..." />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="late_1_30">Late (1-30d)</SelectItem>
                                            <SelectItem value="late_31_60">Late (31-60d)</SelectItem>
                                            <SelectItem value="late_61_90">Late (61-90d)</SelectItem>
                                            <SelectItem value="missed">Missed (90+d)</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </>
                                    )}
                                  </div>
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
                        <p className="text-xs text-green-600">+{onTimeCount * 8} score pts</p>
                      </Card>
                      <Card className="p-4 border-l-4 border-l-yellow-500">
                        <p className="text-xs text-muted-foreground mb-1">Late Payments</p>
                        <p className="text-2xl font-bold text-yellow-600">{lateCount}</p>
                        <p className="text-xs text-yellow-600">Score deducted</p>
                      </Card>
                      <Card className="p-4 border-l-4 border-l-red-500">
                        <p className="text-xs text-muted-foreground mb-1">Defaults (90+d)</p>
                        <p className="text-2xl font-bold text-red-600">{missedCount}</p>
                        <p className="text-xs text-red-600">{missedCount * -100} score pts</p>
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
                              stroke="hsl(221, 83%, 53%)"
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
                      <Card className="p-5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-semibold text-red-800 dark:text-red-400 mb-1">Total Extra Charges</p>
                            <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                              <div>
                                <p className="text-muted-foreground">Total Fines</p>
                                <p className="font-bold text-yellow-700">
                                  ₹{repayments.reduce((s, r) => s + (r.fine_amount || 0), 0).toFixed(0)}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Total Penalties</p>
                                <p className="font-bold text-red-700">
                                  ₹{repayments.reduce((s, r) => s + (r.penalty_amount || 0), 0).toFixed(0)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* Good performance */}
                    {lateCount === 0 && missedCount === 0 && paidCount > 0 && (
                      <Card className="p-5 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-6 w-6 text-green-600" />
                          <div>
                            <p className="font-semibold text-green-800 dark:text-green-400">🎉 Perfect Repayment Record!</p>
                            <p className="text-sm text-green-700 dark:text-green-500 mt-1">
                              All {paidCount} payments made on time or early. You've earned <strong>+{totalScore} credit score points</strong>.
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