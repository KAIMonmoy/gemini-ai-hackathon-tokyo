// Seed BOM used by the "Load sample BOM" button and the mock upload fallback.
// Mirrors data/sample_bom.json so the Tanaka Seiko demo reproduces deterministically.

import type { WatchListItem } from './types'

export const SAMPLE_ITEMS: WatchListItem[] = [
  { part: 'M3 titanium bolt', supplier: 'Tanaka Seiko', supplier_region: 'Kagoshima', country: 'Japan', currency: 'JPY', qty_per_month: 12000, unit_cost: 18, lead_time_days: 14, skus: ['A-100', 'A-110', 'B-200', 'B-210'], material: 'titanium' },
  { part: 'ABS housing', supplier: 'Maruyama Plastics', supplier_region: 'Osaka', country: 'Japan', currency: 'JPY', qty_per_month: 3000, unit_cost: 120, lead_time_days: 21, skus: ['A-100'], material: 'ABS resin' },
  { part: 'control IC', supplier: 'Shenzhen MicroTech', supplier_region: 'Shenzhen', country: 'China', currency: 'USD', qty_per_month: 2000, unit_cost: 3.4, lead_time_days: 35, skus: ['A-100', 'B-200'], material: 'semiconductor' },
]
