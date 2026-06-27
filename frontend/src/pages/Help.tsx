import { Link } from 'react-router-dom'

import PublicHeader from '../components/PublicHeader'
import { Button, Card } from '../components/ui'

const STEPS = [
  {
    n: 1,
    title: 'Create your account',
    body: 'Sign up with email or Google. Your data is private to you, secured by Firebase Auth and per-user database rules.',
  },
  {
    n: 2,
    title: 'Describe your business',
    body: 'Add your company details and your bill of materials (BOM) — each part, supplier, region, buying currency, quantity, unit cost, and lead time.',
  },
  {
    n: 3,
    title: 'Upload paperwork (optional)',
    body: 'Drop in a BOM or invoice as a PDF, spreadsheet, or even a photo. Gemini reads it and fills your watch list automatically — no manual typing.',
  },
  {
    n: 4,
    title: 'Run an analysis',
    body: 'A team of AI agents springs into action: they sense risks, quantify your ¥ exposure, plan a feasible response, and draft the emails to send.',
  },
  {
    n: 5,
    title: 'Act in minutes',
    body: 'Read a one-screen brief: which parts are at risk, how much money, a ranked plan, and ready-to-send emails in keigo (Japanese) + English.',
  },
]

const AGENTS = [
  { name: 'Document intake', desc: 'Reads your BOM/invoices (multimodal) into a structured watch list.' },
  { name: 'Sensing team (×4, parallel)', desc: 'News, weather/logistics, commodity prices, and FX — watched at the same time.' },
  { name: 'Impact fusion', desc: 'Matches every signal to your parts and computes days of delay + ¥ at risk.' },
  { name: 'Response coordinator', desc: 'Chooses re-source / hedge / renegotiate, with a plan ⇄ critic loop until the plan is feasible.' },
  { name: 'Comms', desc: 'Drafts a status email to your supplier and an RFQ to an alternate — JP + EN.' },
]

export default function Help() {
  return (
    <div className="min-h-screen">
      <PublicHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">How Sourcing Sentinel works</h1>
        <p className="mt-2 text-slate-600">
          An always-on supply-chain risk desk for small manufacturers — turning scattered, late,
          generic risk signals into early, specific, actionable decisions.
        </p>

        <h2 className="mt-10 mb-4 text-xl font-semibold text-slate-900">Five steps</h2>
        <ol className="space-y-4">
          {STEPS.map((s) => (
            <li key={s.n}>
              <Card className="flex gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                  {s.n}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{s.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{s.body}</p>
                </div>
              </Card>
            </li>
          ))}
        </ol>

        <h2 className="mt-12 mb-4 text-xl font-semibold text-slate-900">
          The agents behind one “Run analysis”
        </h2>
        <p className="mb-4 text-sm text-slate-600">
          It’s not one prompt — it’s a coordinated team of specialist agents (built on Google’s Agent
          Development Kit), each focused on one job:
        </p>
        <div className="space-y-3">
          {AGENTS.map((a, i) => (
            <Card key={i} className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                {i + 1}
              </span>
              <div>
                <div className="text-sm font-semibold text-slate-900">{a.name}</div>
                <div className="text-sm text-slate-600">{a.desc}</div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50 p-5">
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">See it in action</h3>
            <p className="text-sm text-slate-600">Try the live demo with sample data — no sign-up needed.</p>
          </div>
          <Link to="/demo">
            <Button>Open demo</Button>
          </Link>
          <Link to="/signup">
            <Button variant="secondary">Create account</Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
