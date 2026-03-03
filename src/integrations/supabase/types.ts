export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      predictions: {
        Row: {
          age: number | null
          annual_income: number | null
          avg_probability_of_default: number | null
          avg_risk_weighted_assets: number | null
          bankruptcy_flag: boolean | null
          bankruptcy_trigger_flag: boolean | null
          batch_id: string | null
          cash_flow_volatility: number | null
          checking_account_balance: number | null
          collateral_type: string | null
          collateral_value: number | null
          created_at: string | null
          credit_history_length: number | null
          credit_mix: string | null
          credit_score: number | null
          credit_utilization_rate: number | null
          days_since_last_transaction: number | null
          debt_to_income_ratio: number | null
          dpd_trigger_count: number | null
          education_level: string | null
          employment_duration: number | null
          employment_status: string | null
          housing_status: string | null
          id: string
          industry_sector: string | null
          loan_amount_requested: number | null
          loan_purpose: string | null
          loan_term_months: number | null
          loan_to_income_ratio: number | null
          marital_status: string | null
          months_since_last_delinquency: number | null
          net_worth: number | null
          number_of_credit_inquiries: number | null
          number_of_dependents: number | null
          number_of_derogatory_records: number | null
          number_of_existing_loans: number | null
          number_of_late_payments: number | null
          number_of_open_credit_lines: number | null
          payment_to_income_ratio: number | null
          prediction_label: string | null
          prediction_score: number | null
          prediction_type: string | null
          risk_level: string | null
          savings_account_balance: number | null
          seasonal_spending_pattern: string | null
          total_assets: number | null
          total_credit_limit: number | null
          total_debt: number | null
          transaction_amount: number | null
          transaction_frequency: number | null
          user_id: string
          worst_delinquency_status: number | null
          years_at_residence: number | null
        }
        Insert: {
          age?: number | null
          annual_income?: number | null
          avg_probability_of_default?: number | null
          avg_risk_weighted_assets?: number | null
          bankruptcy_flag?: boolean | null
          bankruptcy_trigger_flag?: boolean | null
          batch_id?: string | null
          cash_flow_volatility?: number | null
          checking_account_balance?: number | null
          collateral_type?: string | null
          collateral_value?: number | null
          created_at?: string | null
          credit_history_length?: number | null
          credit_mix?: string | null
          credit_score?: number | null
          credit_utilization_rate?: number | null
          days_since_last_transaction?: number | null
          debt_to_income_ratio?: number | null
          dpd_trigger_count?: number | null
          education_level?: string | null
          employment_duration?: number | null
          employment_status?: string | null
          housing_status?: string | null
          id?: string
          industry_sector?: string | null
          loan_amount_requested?: number | null
          loan_purpose?: string | null
          loan_term_months?: number | null
          loan_to_income_ratio?: number | null
          marital_status?: string | null
          months_since_last_delinquency?: number | null
          net_worth?: number | null
          number_of_credit_inquiries?: number | null
          number_of_dependents?: number | null
          number_of_derogatory_records?: number | null
          number_of_existing_loans?: number | null
          number_of_late_payments?: number | null
          number_of_open_credit_lines?: number | null
          payment_to_income_ratio?: number | null
          prediction_label?: string | null
          prediction_score?: number | null
          prediction_type?: string | null
          risk_level?: string | null
          savings_account_balance?: number | null
          seasonal_spending_pattern?: string | null
          total_assets?: number | null
          total_credit_limit?: number | null
          total_debt?: number | null
          transaction_amount?: number | null
          transaction_frequency?: number | null
          user_id: string
          worst_delinquency_status?: number | null
          years_at_residence?: number | null
        }
        Update: {
          age?: number | null
          annual_income?: number | null
          avg_probability_of_default?: number | null
          avg_risk_weighted_assets?: number | null
          bankruptcy_flag?: boolean | null
          bankruptcy_trigger_flag?: boolean | null
          batch_id?: string | null
          cash_flow_volatility?: number | null
          checking_account_balance?: number | null
          collateral_type?: string | null
          collateral_value?: number | null
          created_at?: string | null
          credit_history_length?: number | null
          credit_mix?: string | null
          credit_score?: number | null
          credit_utilization_rate?: number | null
          days_since_last_transaction?: number | null
          debt_to_income_ratio?: number | null
          dpd_trigger_count?: number | null
          education_level?: string | null
          employment_duration?: number | null
          employment_status?: string | null
          housing_status?: string | null
          id?: string
          industry_sector?: string | null
          loan_amount_requested?: number | null
          loan_purpose?: string | null
          loan_term_months?: number | null
          loan_to_income_ratio?: number | null
          marital_status?: string | null
          months_since_last_delinquency?: number | null
          net_worth?: number | null
          number_of_credit_inquiries?: number | null
          number_of_dependents?: number | null
          number_of_derogatory_records?: number | null
          number_of_existing_loans?: number | null
          number_of_late_payments?: number | null
          number_of_open_credit_lines?: number | null
          payment_to_income_ratio?: number | null
          prediction_label?: string | null
          prediction_score?: number | null
          prediction_type?: string | null
          risk_level?: string | null
          savings_account_balance?: number | null
          seasonal_spending_pattern?: string | null
          total_assets?: number | null
          total_credit_limit?: number | null
          total_debt?: number | null
          transaction_amount?: number | null
          transaction_frequency?: number | null
          user_id?: string
          worst_delinquency_status?: number | null
          years_at_residence?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
