import { useState } from 'react'
import { Link } from 'react-router-dom'

import PublicHeader from '../components/PublicHeader'
import AgentProgress from '../components/AgentProgress'
import BriefView from '../components/BriefView'
import { DEMO_BRIEF, DEMO_PROFILE, DEMO_SIGNALS } from '../lib/demoData'
import type { Brief } from '../lib/types'
import { Button, Card } from '../components/ui'

// Let the agent animation play fully before revealing the (scripted) brief.
const DEMO_RUN_MS = 8200

export default function Demo() {
  const [running, setRunning] = useState(false)
  const [brief, setBrief] = useState<Brief | null>(null)

  function run() {
    setBrief(null)
    setRunning(true)
    setTimeout(() => {
      setBrief(DEMO_BRIEF)
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
              <>
                <SignalsCard />
                <BriefView brief={brief} />
              </>
            ) : (
              <Card>
                <h2 className="mb-2 text-lg font-semibold text-slate-900">No analysis yet</h2>
                <p className="text-sm text-slate-600">
                  Press <strong>Run analysis</strong> to watch the agent team sense risks, quantify the
                  ¥ exposure, plan a feasible response, and draft supplier emails — using the sample
                  bill of materials on the right.
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

            {!brief && !running && (
              <Card className="bg-amber-50">
                <h2 className="mb-1 text-sm font-semibold text-slate-900">Scripted scenario</h2>
                <p className="text-xs text-amber-700">
                  Typhoon near Kagoshima · titanium +8% · USD/JPY +3% — so the result is the same every
                  time.
                </p>
              </Card>
            )}

            <Card className="bg-indigo-50">
              <h2 className="text-sm font-semibold text-slate-900">Like what you see?</h2>
              <p className="mt-1 mb-3 text-sm text-slate-600">Run it on your own bill of materials.</p>
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

function SignalsCard() {
  return (
    <Card>
      <h2 className="mb-3 text-lg font-semibold text-slate-900">Signals detected</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {DEMO_SIGNALS.map((s, i) => (
          <div key={i} className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xl">{s.icon}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  s.severity >= 4 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                }`}
              >
                sev {s.severity}
              </span>
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-900">{s.label}</div>
            <div className="text-xs text-slate-500">{s.detail}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}
