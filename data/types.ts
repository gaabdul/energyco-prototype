export interface BillInput {
  prev_kwh: number;
  curr_kwh: number;
  prev_rate: number;
  curr_rate: number;
  days_prev: number;
  days_curr: number;
  weather_idx_prev: number;
  weather_idx_curr: number;
  plan_type: string;
  tenure_months: number;
  digital_activity_score: number;
}

export interface Offer {
  partner: string;
  category: string;
  persona: string[];
  est_savings_per_month: number;
  blurb: string;
}

export interface Rule {
  plan_type: string;
  risk_level: string;
  description: string;
  tier_multiplier: number;
}

export interface Concept {
  name: string;
  score: number;
  description: string;
  category: string;
}
