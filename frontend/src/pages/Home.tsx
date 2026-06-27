import { Link } from 'react-router-dom'

import PublicHeader from '../components/PublicHeader'
import { useAuth } from '../auth/AuthContext'
import { Button, Card } from '../components/ui'

const STEPS = [
  { icon: '📄', title: 'Upload your BOM', body: 'A PDF, spreadsheet, or photo — Gemini reads it into a watch list.' },
  { icon: '📡', title: 'Agents sense risk', body: 'News, weather, commodity & FX — watched in parallel for your parts.' },
  { icon: '✉️', title: 'Get an action plan', body: '¥ exposure, a feasible mitigation, and ready-to-send keigo + EN emails.' },
]

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen">
      <PublicHeader />

      {/* Hero */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-indigo-50/60 to-transparent">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center">
          <span className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
            Multi-agent · Gemini · Google Cloud
          </span>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            A 24/7 supply-chain risk desk for small manufacturers
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Sourcing Sentinel reads your paperwork, watches the world for threats to <em>your</em>{' '}
            parts, quantifies the ¥ exposure, and drafts the emails to send — in minutes.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/demo">
              <Button className="px-6 py-3 text-base">▶ Run the live demo</Button>
            </Link>
            <Link to="/help">
              <Button variant="secondary" className="px-6 py-3 text-base">
                See how it works
              </Button>
            </Link>
          </div>
          <p className="mt-3 text-xs text-slate-400">No sign-up needed to try the demo.</p>
        </div>
      </section>

      {/* How it works — 3 steps */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900">How it works</h2>
          <p className="mt-1 text-slate-600">Three steps from messy paperwork to a decision.</p>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Card key={i} className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-2xl">
                {s.icon}
              </div>
              <div className="mb-1 text-xs font-semibold text-indigo-600">STEP {i + 1}</div>
              <h3 className="font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{s.body}</p>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link to="/help" className="text-sm font-medium text-indigo-600 hover:underline">
            Read the full walkthrough →
          </Link>
        </div>
      </section>

      {/* Demo highlight band */}
      <section className="border-t border-slate-200 bg-slate-900">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-12 text-center">
          <h2 className="text-2xl font-bold text-white">Watch the agents work</h2>
          <p className="max-w-2xl text-slate-300">
            Press one button and see five specialist agents sense risk in parallel, run a plan ⇄
            critic loop, and produce a ready-to-send brief — on a real sample scenario.
          </p>
          <Link to="/demo">
            <Button className="px-6 py-3 text-base">▶ Try the interactive demo</Button>
          </Link>
        </div>
      </section>

      <footer className="mx-auto max-w-5xl px-4 py-8 text-center text-sm text-slate-500">
        {user ? (
          <Link to="/dashboard" className="font-medium text-indigo-600 hover:underline">
            Go to your dashboard →
          </Link>
        ) : (
          <>
            Ready to use it on your own data?{' '}
            <Link to="/signup" className="font-medium text-indigo-600 hover:underline">
              Create a free account
            </Link>
          </>
        )}
      </footer>
    </div>
  )
}
