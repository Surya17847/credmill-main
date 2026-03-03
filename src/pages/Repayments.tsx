import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarCheck, AlertTriangle, Clock, IndianRupee, TrendingUp, CheckCircle2, XCircle } from "lucide-react";

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
    let scoreImpact = 5; // Base positive impact for on-time payment

    if (daysDiff > 30) {
      // Missed (more than 30 days late)
      status = 'missed';
      penalty = repayment.emi_amount * 0.05; // 5% penalty
      scoreImpact = -15;
    } else if (daysDiff > 0) {
      // Late payment
      status = 'paid_late';
      fine = repayment.emi_amount * 0.02; // 2% fine
      scoreImpact = -5;
    } else if (daysDiff < -15) {
      // Very early payment (more than 15 days early)
      scoreImpact = 10; // Bonus for early payment
      status = 'paid_early';
    }

    const totalPaid = repayment.emi_amount + penalty + fine;

    // Update repayment
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

    // Update loan remaining principal and credit score impact
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

      // Update profile credit score
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

    toast.success(`Payment recorded! Score impact: ${scoreImpact > 0 ? '+' : ''}${scoreImpact}`);
    loadLoans();
    loadRepayments(repayment.loan_id);
  };

  const handlePayoffRemaining = async (loan: Loan) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Mark all pending repayments as paid early
    const pendingRepayments = repayments.filter(r => r.status === 'pending');
    const earlyPayoffBonus = pendingRepayments.length * 8; // Big bonus for early payoff

    for (const r of pendingRepayments) {
      await (supabase as any)
        .from('repayments')
        .update({
          amount_paid: r.principal_portion, // Only principal, save on interest
          paid_date: new Date().toISOString().split('T')[0],
          status: 'paid_early',
          score_impact: 8,
        })
        .eq('id', r.id);
    }

    // Update loan
    await (supabase as any)
      .from('loans')
      .update({
        remaining_principal: 0,
        credit_score_impact: loan.credit_score_impact + earlyPayoffBonus,
        status: 'completed',
      })
      .eq('id', loan.id);

    // Update profile credit score with big bonus
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

    toast.success(`Loan paid off early! Credit score boosted by +${earlyPayoffBonus} points!`);
    loadLoans();
    loadRepayments(loan.id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid_on_time': return <Badge className="bg-green-500">On Time</Badge>;
      case 'paid_early': return <Badge className="bg-emerald-600">Early ✨</Badge>;
      case 'paid_late': return <Badge className="bg-yellow-500">Late</Badge>;
      case 'missed': return <Badge variant="destructive">Missed</Badge>;
      default: return <Badge variant="outline">Pending</Badge>;
    }
  };

  const activeLoan = loans.find(l => l.id === selectedLoan);
  const paidCount = repayments.filter(r => r.status !== 'pending').length;
  const totalScore = repayments.reduce((sum, r) => sum + r.score_impact, 0);

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
          {/* Loan Selector */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase">Your Loans</h3>
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
              </Card>
            ))}
          </div>

          {/* Repayment Details */}
          <div className="lg:col-span-3 space-y-6">
            {activeLoan && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <IndianRupee className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Remaining</span>
                    </div>
                    <p className="text-2xl font-bold">₹{activeLoan.remaining_principal.toLocaleString()}</p>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">EMIs Paid</span>
                    </div>
                    <p className="text-2xl font-bold">{paidCount}/{repayments.length}</p>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Score Impact</span>
                    </div>
                    <p className={`text-2xl font-bold ${totalScore >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {totalScore > 0 ? '+' : ''}{totalScore}
                    </p>
                  </Card>
                  <Card className="p-4">
                    {activeLoan.status === 'active' && activeLoan.remaining_principal > 0 && (
                      <Button
                        className="w-full h-full"
                        variant="default"
                        onClick={() => handlePayoffRemaining(activeLoan)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Pay Off Early
                      </Button>
                    )}
                    {activeLoan.status === 'completed' && (
                      <div className="flex items-center justify-center h-full text-green-600 font-bold">
                        ✅ Loan Completed
                      </div>
                    )}
                  </Card>
                </div>

                {/* Early Payoff Info */}
                {activeLoan.status === 'active' && (
                  <Card className="p-4 border-l-4 border-l-emerald-500 bg-emerald-50/50">
                    <p className="text-sm font-medium text-emerald-800">
                      💡 Pay off your loan early to get a <strong>+{repayments.filter(r => r.status === 'pending').length * 8}</strong> credit score boost! 
                      Early payoff users get significantly higher scores than those who take full term.
                    </p>
                  </Card>
                )}

                {/* Repayment Schedule Table */}
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Repayment Schedule</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Month</th>
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Due Date</th>
                          <th className="text-right py-3 px-2 font-medium text-muted-foreground">EMI</th>
                          <th className="text-right py-3 px-2 font-medium text-muted-foreground">Principal</th>
                          <th className="text-right py-3 px-2 font-medium text-muted-foreground">Interest</th>
                          <th className="text-right py-3 px-2 font-medium text-muted-foreground">Penalty/Fine</th>
                          <th className="text-center py-3 px-2 font-medium text-muted-foreground">Status</th>
                          <th className="text-center py-3 px-2 font-medium text-muted-foreground">Score</th>
                          <th className="text-center py-3 px-2 font-medium text-muted-foreground">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {repayments.map((r) => (
                          <tr key={r.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-2">{r.month_number}</td>
                            <td className="py-3 px-2">{new Date(r.due_date).toLocaleDateString()}</td>
                            <td className="py-3 px-2 text-right">₹{r.emi_amount.toLocaleString()}</td>
                            <td className="py-3 px-2 text-right">₹{r.principal_portion.toLocaleString()}</td>
                            <td className="py-3 px-2 text-right">₹{r.interest_portion.toLocaleString()}</td>
                            <td className="py-3 px-2 text-right">
                              {r.penalty_amount > 0 && <span className="text-red-600">₹{r.penalty_amount.toLocaleString()}</span>}
                              {r.fine_amount > 0 && <span className="text-yellow-600">₹{r.fine_amount.toLocaleString()}</span>}
                              {r.penalty_amount === 0 && r.fine_amount === 0 && '—'}
                            </td>
                            <td className="py-3 px-2 text-center">{getStatusBadge(r.status)}</td>
                            <td className="py-3 px-2 text-center">
                              {r.score_impact !== 0 && (
                                <span className={r.score_impact > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                  {r.score_impact > 0 ? '+' : ''}{r.score_impact}
                                </span>
                              )}
                              {r.score_impact === 0 && '—'}
                            </td>
                            <td className="py-3 px-2 text-center">
                              {r.status === 'pending' && (
                                <Button size="sm" onClick={() => handlePayEMI(r)}>
                                  Pay
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
