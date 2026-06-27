// Story-accurate demo dataset (matches data/sample_bom.json + data/demo_trigger.json).
// Used by the public Demo page so the emulated run always tells the same clear story.

import type { Brief, BusinessProfile } from './types'
import { SAMPLE_ITEMS } from './sample'

export const DEMO_PROFILE: BusinessProfile = {
  company_name: 'Tanaka Seiko (sample)',
  contact_name: 'Owner',
  contact_email: 'owner@example.co.jp',
  currency_home: 'JPY',
  items: SAMPLE_ITEMS,
}

export interface DemoSignal {
  icon: string
  stream: string
  label: string
  detail: string
  severity: number
}

// The scripted disruption: typhoon near Kagoshima (4) · USD/JPY +3% (3) · titanium +8% (3).
export const DEMO_SIGNALS: DemoSignal[] = [
  {
    icon: '🌀',
    stream: 'Weather',
    label: 'Typhoon approaching Kagoshima',
    detail: 'Tanaka Seiko region · landfall ~36h · port/logistics delays likely',
    severity: 4,
  },
  {
    icon: '⛏️',
    stream: 'Commodity',
    label: 'Titanium +8%',
    detail: 'Raises the cost of titanium parts (M3 bolt)',
    severity: 3,
  },
  {
    icon: '💱',
    stream: 'FX',
    label: 'USD/JPY +3%',
    detail: 'Weaker yen raises the cost of USD-priced parts (control IC)',
    severity: 3,
  },
]

export const DEMO_BRIEF: Brief = {
  impact: {
    overall_risk: 4,
    summary:
      'A typhoon approaching Kagoshima plus an 8% titanium spike put your M3 titanium bolt ' +
      '(Tanaka Seiko) at risk across SKUs A-100/A-110/B-200/B-210, while a 3% weaker yen raises ' +
      'the cost of your USD-priced control IC.',
    items: [
      {
        part: 'M3 titanium bolt',
        skus: ['A-100', 'A-110', 'B-200', 'B-210'],
        cause: 'Typhoon near Kagoshima (sev 4) + titanium +8% (sev 3)',
        delay_days: 10,
        jpy_exposure: 302400,
        risk_score: 4,
      },
      {
        part: 'control IC',
        skus: ['A-100', 'B-200'],
        cause: 'USD/JPY +3% raises the yen cost of this USD-priced part',
        delay_days: 0,
        jpy_exposure: 30600,
        risk_score: 3,
      },
    ],
  },
  response_plan: {
    chosen: ['resource', 'hedge'],
    summary:
      'Re-source the titanium bolt with a feasibility-checked alternate, and hedge the ' +
      'titanium / FX cost exposure.',
    priority_actions: [
      'Activate Kyushu Precision Fasteners (Fukuoka, 12-day lead) as an alternate for the M3 titanium bolt.',
      'Forward-buy ~2 months of titanium to blunt the 8% price spike.',
      'Send an expedite / status request to Tanaka Seiko today, ahead of the typhoon.',
    ],
  },
  emails: [
    {
      to: 'Tanaka Seiko',
      lang: 'JP',
      subject: '【至急】M3チタンボルトの納品状況のご確認（台風接近に伴い）',
      body:
        '田中精工株式会社\nご担当者様\n\n平素より大変お世話になっております。\n' +
        '鹿児島へ台風が接近しているとの報に接し、M3チタンボルトの納品スケジュールにつきまして、' +
        '現状と前倒し出荷の可否をご確認いただけますでしょうか。\n' +
        '弊社の複数製品（A-100, A-110, B-200, B-210）に影響するため、早急なご回答をいただけますと幸いです。\n\n' +
        '何卒よろしくお願い申し上げます。',
    },
    {
      to: 'Tanaka Seiko',
      lang: 'EN',
      subject: 'Urgent: delivery status for M3 titanium bolts (incoming typhoon)',
      body:
        'Dear Tanaka Seiko,\n\nWith a typhoon approaching Kagoshima, could you confirm the current ' +
        'delivery status and any expedite options for the M3 titanium bolts? These feed four of our ' +
        'product lines (A-100, A-110, B-200, B-210), so an early reply would help us a great deal.\n\n' +
        'Thank you for your continued support.',
    },
    {
      to: 'Kyushu Precision Fasteners',
      lang: 'JP',
      subject: '【お見積り依頼】M3チタンボルトの新規取引について',
      body:
        '九州精密ファスナー株式会社\nご担当者様\n\n突然のご連絡失礼いたします。\n' +
        'M3チタンボルト（材質：チタン、月間約12,000本）につきまして、単価・最短納期・最小発注数量の' +
        'お見積りをお願いできますでしょうか。\n短納期での対応を優先しております。\n\n' +
        '何卒よろしくお願い申し上げます。',
    },
    {
      to: 'Kyushu Precision Fasteners',
      lang: 'EN',
      subject: 'RFQ: M3 titanium bolts (expedited lead time)',
      body:
        'Hello,\n\nWe would like a quote for M3 titanium bolts (material: titanium, ~12,000/month): ' +
        'unit price, shortest lead time, and minimum order quantity. A short lead time is our priority.\n\n' +
        'Thank you.',
    },
  ],
  created_at: Date.now(),
}
