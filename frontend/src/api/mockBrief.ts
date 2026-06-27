// Canned analysis result for Phase 2 (no backend yet). Mirrors the shape and
// spirit of the real agent output verified in Phase 1 (Tanaka Seiko / titanium
// bolt scenario). Derives lightly from the user's profile so it feels live.

import type { Brief, BusinessProfile, ImpactItem } from '../lib/types'

export function mockBrief(profile: BusinessProfile): Brief {
  const items = profile.items ?? []
  // Prefer a titanium part if present, else fall back to the first item.
  const focus =
    items.find((i) => i.material.toLowerCase().includes('titanium')) ?? items[0]

  const impactItems: ImpactItem[] = []
  if (focus) {
    const exposure = Math.round(focus.qty_per_month * focus.unit_cost * 1.4)
    impactItems.push({
      part: focus.part,
      skus: focus.skus,
      cause: 'Weather (typhoon near supplier region) + commodity spike',
      delay_days: 10,
      jpy_exposure: exposure,
      risk_score: 4,
    })
  }
  const fxItem = items.find((i) => i.currency !== (profile.currency_home || 'JPY'))
  if (fxItem) {
    impactItems.push({
      part: fxItem.part,
      skus: fxItem.skus,
      cause: 'FX (JPY weakening vs ' + fxItem.currency + ')',
      delay_days: 0,
      jpy_exposure: Math.round(fxItem.qty_per_month * fxItem.unit_cost * 150 * 0.03),
      risk_score: 3,
    })
  }

  const overall = impactItems.reduce((m, i) => Math.max(m, i.risk_score), 1)

  return {
    impact: {
      items: impactItems,
      overall_risk: overall,
      summary: focus
        ? `${focus.part} from ${focus.supplier} (${focus.supplier_region}) is at risk from a regional typhoon and a material price spike; FX adds cost pressure on imported parts.`
        : 'No watch-list items yet — add parts on the Business profile page.',
    },
    response_plan: {
      priority_actions: focus
        ? [
            `Activate an alternate supplier for ${focus.part} to cover the disruption window.`,
            'Forward-buy 2 months of the affected material to hedge the price spike.',
            `Send an expedite request to ${focus.supplier} today.`,
          ]
        : ['Add your bill of materials to begin monitoring.'],
      chosen: focus ? ['resource', 'hedge'] : [],
      summary: focus
        ? 'Re-source the at-risk part with a feasibility-checked alternate, and hedge the material exposure.'
        : 'Nothing to plan yet.',
    },
    emails: focus
      ? [
          {
            to: focus.supplier,
            lang: 'JP',
            subject: `【至急】${focus.part}の納品状況のご確認`,
            body: `${focus.supplier} ご担当者様\n\n平素より大変お世話になっております。\n台風接近に伴い、${focus.part}の納品スケジュールにつきまして現状をご確認いただけますでしょうか。\n何卒よろしくお願い申し上げます。`,
          },
          {
            to: focus.supplier,
            lang: 'EN',
            subject: `Urgent: delivery status for ${focus.part}`,
            body: `Dear ${focus.supplier},\n\nGiven the approaching typhoon in your region, could you confirm the current delivery status and any expedite options for ${focus.part}?\n\nThank you for your support.`,
          },
          {
            to: 'Alternate supplier (candidate)',
            lang: 'JP',
            subject: `【お見積り依頼】${focus.part}の新規取引について`,
            body: `ご担当者様\n\n${focus.part}（材質: ${focus.material}）につきまして、単価・最短納期・最小発注数量のお見積りをお願いできますでしょうか。\n何卒よろしくお願い申し上げます。`,
          },
          {
            to: 'Alternate supplier (candidate)',
            lang: 'EN',
            subject: `RFQ: ${focus.part} (expedited lead time)`,
            body: `Hello,\n\nWe would like a quote for ${focus.part} (material: ${focus.material}) — unit price, shortest lead time, and MOQ. Speed is a priority.\n\nThank you.`,
          },
        ]
      : [],
    created_at: Date.now(),
  }
}
