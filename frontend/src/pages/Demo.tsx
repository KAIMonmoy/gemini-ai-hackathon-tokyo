import { useState } from 'react'
import { Link } from 'react-router-dom'

import PublicHeader from '../components/PublicHeader'
import AgentProgress from '../components/AgentProgress'
import BriefView from '../components/BriefView'
import { SAMPLE_ITEMS } from '../lib/sample'
import { mockBrief } from '../api/mockBrief'
import type { Brief, BusinessProfile } from '../lib/types'
import { Button, Card } from '../components/ui'

const DEMO_PROFILE: BusinessProfile = {
  company_name: 'Tanaka Seiko (sample)',
  contact_name: 'Owner',
  contact_email: 'owner@example.co.jp',
  currency_home: 'JPY',
  items: SAMPLE_ITEMS,
}

// Let the agent animation play fully before revealing the (mock) brief.
const DEMO_RUN_MS = 8200

export default function Demo() {
  const [running, setRunning] = useState(false)
  const [brief, setBrief] = useState<Brief | null>(null)

  function run() {
    setBrief(null)
    setRunning(true)
    setTimeout(() => {
      setBrief(mockBrief(DEMO_PROFILE))
      setRunning(false)
    }, DEMO_RUN_MS)
  }

  return (
    <div className="min-h-screen">
      <PublicHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Live demo</h1>
            <p className="mt-1 text-slate-600">
              Sample data for <strong>{DEMO_PROFILE.company_name}</strong> — a Kagoshima maker of
              titanium bolts. No sign-up needed.
            </p>
          </div>
          <Button onClick={run} disabled={running}>
            {running ? 'Analyzing…' : brief ? 'Run again' : 'Run analysis'}
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {running ? (
              <AgentProgress running={running} />
            ) : brief ? (
              <BriefView brief={brief} />
            ) : (
              <Card>
                <h2 className="mb-2 text-lg font-semibold text-slate-900">What happens next</h2>
                <p className="text-sm text-slate-600">
                  Press <strong>Run analysis</strong> to watch the agent team sense risks, quantify the
                  ¥ exposure, plan a feasible response, and draft supplier emails — using the sample
                  bill of materials on the right.
                </p>
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  Demo mode uses canned signals (typhoon near Kagoshima · titanium +8% · USD/JPY +3%)
                  so the result is the same every time.
                </p>
              </Card>
            )}
          </div>

          <aside className="space-y-6">
            <Card>
              <h2 className="mb-3 text-sm font-semibold text-slate-900">Sample watch list</h2>
              <ul className="space-y-3">
                {DEMO_PROFILE.items.map((it, i) => (
                  <li key={i} className="text-sm">
                    <div className="font-medium text-slate-800">{it.part}</div>
                    <div className="text-slate-500">
                      {it.supplier} · {it.supplier_region} · {it.currency} · {it.lead_time_days}d lead
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="bg-indigo-50">
              <h2 className="text-sm font-semibold text-slate-900">Like what you see?</h2>
              <p className="mt-1 mb-3 text-sm text-slate-600">
                Run it on your own bill of materials.
              </p>
              <Link to="/signup">
                <Button className="w-full">Create your account</Button>
              </Link>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  )
}
