
-- Migration: 20251031053018
-- Create predictions table to store all prediction results
CREATE TABLE public.predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  
  -- Input features (all the parameters sent to model)
  age integer,
  employment_status text,
  employment_duration integer,
  industry_sector text,
  education_level text,
  marital_status text,
  housing_status text,
  years_at_residence integer,
  number_of_dependents integer,
  annual_income numeric,
  total_debt numeric,
  debt_to_income_ratio numeric,
  loan_to_income_ratio numeric,
  credit_score integer,
  credit_history_length integer,
  number_of_existing_loans integer,
  total_credit_limit numeric,
  credit_utilization_rate numeric,
  savings_account_balance numeric,
  checking_account_balance numeric,
  total_assets numeric,
  net_worth numeric,
  number_of_late_payments integer,
  worst_delinquency_status integer,
  months_since_last_delinquency integer,
  number_of_credit_inquiries integer,
  number_of_open_credit_lines integer,
  number_of_derogatory_records integer,
  bankruptcy_flag boolean,
  credit_mix text,
  loan_amount_requested numeric,
  loan_term_months integer,
  loan_purpose text,
  payment_to_income_ratio numeric,
  collateral_type text,
  collateral_value numeric,
  transaction_amount numeric,
  transaction_frequency integer,
  days_since_last_transaction integer,
  avg_probability_of_default numeric,
  avg_risk_weighted_assets numeric,
  dpd_trigger_count integer,
  bankruptcy_trigger_flag boolean,
  cash_flow_volatility numeric,
  seasonal_spending_pattern text,
  
  -- Prediction results
  prediction_score numeric,
  risk_level text,
  prediction_label text,
  
  -- Metadata
  batch_id uuid,
  prediction_type text DEFAULT 'single',
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own predictions"
ON public.predictions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own predictions"
ON public.predictions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own predictions"
ON public.predictions
FOR DELETE
USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_predictions_user_id ON public.predictions(user_id);
CREATE INDEX idx_predictions_created_at ON public.predictions(created_at DESC);
CREATE INDEX idx_predictions_batch_id ON public.predictions(batch_id);
