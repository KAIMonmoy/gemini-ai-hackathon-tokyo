// Renders a decision Brief (situation, impacted parts, response, draft emails).
// Shared by the authenticated Dashboard and the public Demo page.

import type { Brief, Email } from '../lib/types'
import { Button, Card, RiskBadge, jpy } from './ui'

export default function BriefView({ brief }: { brief: Brief }) {
  return (
    <>
      <Card>
        <div className="mb-2 flex items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Situation</h2>
          <RiskBadge score={brief.impact.overall_risk} />
        </div>
        <p className="text-sm text-slate-700">{brief.impact.summary}</p>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Impacted parts</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {brief.impact.items.map((item, i) => (
            <Card key={i}>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold text-slate-900">{item.part}</span>
                <RiskBadge score={item.risk_score} />
              </div>
              <dl className="space-y-1 text-sm text-slate-600">
                <div className="flex justify-between">
                  <dt>¥ exposure</dt>
                  <dd className="font-semibold text-slate-900">{jpy(item.jpy_exposure)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Delay</dt>
                  <dd>{item.delay_days} days</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Cause</dt>
                  <dd>{item.cause}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Affected SKUs</dt>
                  <dd>{item.skus.join(', ') || '—'}</dd>
                </div>
              </dl>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <div className="mb-2 flex items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Recommended response</h2>
          {brief.response_plan.chosen.map((c) => (
            <span
              key={c}
              className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700"
            >
              {c}
            </span>
          ))}
        </div>
        <p className="mb-3 text-sm text-slate-700">{brief.response_plan.summary}</p>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
          {brief.response_plan.priority_actions.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ol>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Draft emails</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {brief.emails.map((email, i) => (
            <EmailCard key={i} email={email} />
          ))}
        </div>
      </div>
    </>
  )
}

function EmailCard({ email }: { email: Email }) {
  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-900">To: {email.to}</span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
          {email.lang}
        </span>
      </div>
      <p className="mb-2 text-sm font-medium text-slate-800">{email.subject}</p>
      <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
        {email.body}
      </pre>
      <Button
        variant="secondary"
        className="mt-3"
        onClick={() => navigator.clipboard?.writeText(`${email.subject}\n\n${email.body}`)}
      >
        Copy
      </Button>
    </Card>
  )
}
