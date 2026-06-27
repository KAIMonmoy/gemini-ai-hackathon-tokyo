// Shared types mirroring the agent State Contract (sourcing_sentinel/schemas.py §7).
// The mock client (Phase 2) and the real backend (Phase 4) both return a `Brief`.

export interface WatchListItem {
  part: string
  supplier: string
  supplier_region: string
  country: string
  currency: string
  qty_per_month: number
  unit_cost: number
  lead_time_days: number
  skus: string[]
  material: string
}

export interface WatchList {
  items: WatchListItem[]
  currency_home: string
}

export interface BusinessProfile {
  company_name: string
  contact_name: string
  contact_email: string
  currency_home: string
  items: WatchListItem[]
  updated_at?: number
}

export interface ImpactItem {
  part: string
  skus: string[]
  cause: string
  delay_days: number
  jpy_exposure: number
  risk_score: number
}

export interface Impact {
  items: ImpactItem[]
  overall_risk: number
  summary: string
}

export interface ResponsePlan {
  priority_actions: string[]
  chosen: string[]
  summary: string
}

export interface Email {
  to: string
  lang: 'JP' | 'EN'
  subject: string
  body: string
}

export interface Brief {
  impact: Impact
  response_plan: ResponsePlan
  emails: Email[]
  created_at: number
}

export const EMPTY_WATCH_ITEM: WatchListItem = {
  part: '',
  supplier: '',
  supplier_region: '',
  country: 'Japan',
  currency: 'JPY',
  qty_per_month: 0,
  unit_cost: 0,
  lead_time_days: 0,
  skus: [],
  material: '',
}
