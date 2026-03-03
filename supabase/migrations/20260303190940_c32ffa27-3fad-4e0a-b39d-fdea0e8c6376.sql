
-- Create loans table to track approved loans after prediction
CREATE TABLE public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  prediction_id UUID REFERENCES public.predictions(id) ON DELETE SET NULL,
  loan_amount NUMERIC NOT NULL,
  loan_term_months INTEGER NOT NULL,
  interest_rate NUMERIC NOT NULL DEFAULT 12.0,
  monthly_emi NUMERIC NOT NULL,
  total_payable NUMERIC NOT NULL,
  remaining_principal NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  credit_score_impact INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own loans" ON public.loans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own loans" ON public.loans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own loans" ON public.loans FOR UPDATE USING (auth.uid() = user_id);

-- Create repayments table to track monthly payments
CREATE TABLE public.repayments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  month_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  emi_amount NUMERIC NOT NULL,
  principal_portion NUMERIC NOT NULL,
  interest_portion NUMERIC NOT NULL,
  amount_paid NUMERIC DEFAULT 0,
  paid_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  penalty_amount NUMERIC DEFAULT 0,
  fine_amount NUMERIC DEFAULT 0,
  score_impact INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.repayments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own repayments" ON public.repayments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own repayments" ON public.repayments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own repayments" ON public.repayments FOR UPDATE USING (auth.uid() = user_id);

-- Trigger for loans updated_at
CREATE TRIGGER update_loans_updated_at
BEFORE UPDATE ON public.loans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
