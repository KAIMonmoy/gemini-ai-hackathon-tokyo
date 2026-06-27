import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../auth/AuthContext'
import { runAnalysis, usingMock } from '../api/client'
import { loadLatestRun, loadProfile, saveRun } from '../lib/store'
import type { Brief, BusinessProfile } from '../lib/types'
import Calendar, { type CalendarMarker } from '../components/Calendar'
import AgentProgress from '../components/AgentProgress'
import BriefView from '../components/BriefView'
import { Button, Card, jpy } from '../components/ui'

function toDate(value: unknown): Date | null {
  if (!value) return null
  if (typeof value === 'number') return new Date(value)
  const v = value as { toDate?: () => Date; seconds?: number }
  if (typeof v.toDate === 'function') return v.toDate()
  if (typeof v.seconds === 'number') return new Date(v.seconds * 1000)
  return null
}

export default function Dashboard() {
  const { user, getIdToken } = useAuth()
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [brief, setBrief] = useState<Brief | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    loadProfile(user.uid).then(setProfile)
    loadLatestRun(user.uid).then((b) => b && setBrief(b))
  }, [user])

  const items = profile?.items ?? []
  const hasItems = items.length > 0

  const stats = useMemo(() => {
    const suppliers = new Set(items.map((i) => i.supplier).filter(Boolean))
    const regions = new Set(items.map((i) => i.supplier_region).filter(Boolean))
    const monthlySpend = items.reduce(
      (sum, i) => sum + i.qty_per_month * i.unit_cost * (i.currency === 'JPY' ? 1 : 150),
      0,
    )
    return { parts: items.length, suppliers: suppliers.size, regions: regions.size, monthlySpend }
  }, [items])

  const lastScan = toDate(brief?.created_at)

  async function handleRun() {
    if (!user || !profile) return
    setRunning(true)
    setError('')
    try {
      const result = await runAnalysis(profile, getIdToken)
      setBrief(result)
      await saveRun(user.uid, result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {profile?.company_name ? `${profile.company_name} — risk desk` : 'Risk dashboard'}
          </h1>
          <p className="text-sm text-slate-500">
            {usingMock ? 'Demo mode (mock analysis).' : 'Live analysis via backend.'}
            {lastScan && ` · Last scan ${lastScan.toLocaleDateString()}`}
          </p>
        </div>
        <Button onClick={handleRun} disabled={running || !hasItems}>
          {running ? 'Analyzing…' : brief ? 'Re-run analysis' : 'Run analysis'}
        </Button>
      </div>

      {error && <Card className="border-red-200 bg-red-50 text-sm text-red-700">{error}</Card>}

      <StatsRow stats={stats} brief={brief} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {running ? (
            <AgentProgress running={running} />
          ) : brief ? (
            <BriefView brief={brief} />
          ) : (
            <CompanyOverview profile={profile} hasItems={hasItems} />
          )}
        </div>

        <aside className="space-y-6">
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Schedule</h2>
            <Calendar markers={buildMarkers(lastScan)} />
          </Card>
          <NoticesCard brief={brief} hasItems={hasItems} />
          <TodoCard uid={user?.uid} brief={brief} hasItems={hasItems} />
        </aside>
      </div>
    </div>
  )
}

function buildMarkers(lastScan: Date | null): CalendarMarker[] {
  const markers: CalendarMarker[] = []
  const now = new Date()
  if (lastScan && lastScan.getMonth() === now.getMonth() && lastScan.getFullYear() === now.getFullYear()) {
    markers.push({ day: lastScan.getDate(), label: 'Last risk scan', tone: 'indigo' })
  }
  const next = new Date(now)
  next.setDate(now.getDate() + 7)
  if (next.getMonth() === now.getMonth()) {
    markers.push({ day: next.getDate(), label: 'Next scan due', tone: 'emerald' })
  }
  return markers
}

function StatsRow({
  stats,
  brief,
}: {
  stats: { parts: number; suppliers: number; regions: number; monthlySpend: number }
  brief: Brief | null
}) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Stat label="Parts watched" value={String(stats.parts)} />
      <Stat label="Suppliers" value={String(stats.suppliers)} />
      <Stat label="Supplier regions" value={String(stats.regions)} />
      {brief ? (
        <Stat label="Overall risk" value={`${brief.impact.overall_risk} / 5`} accent />
      ) : (
        <Stat label="Est. monthly spend" value={jpy(stats.monthlySpend)} />
      )}
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card className="p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${accent ? 'text-red-600' : 'text-slate-900'}`}>
        {value}
      </div>
    </Card>
  )
}

function CompanyOverview({
  profile,
  hasItems,
}: {
  profile: BusinessProfile | null
  hasItems: boolean
}) {
  if (!profile?.company_name && !hasItems) {
    return (
      <Card>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Welcome to your risk desk</h2>
        <p className="mb-4 text-sm text-slate-600">
          Tell us about your business so we can start watching your supply chain.
        </p>
        <Link to="/profile">
          <Button>Set up business profile</Button>
        </Link>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {profile?.company_name || 'Your company'}
          </h2>
          <Link to="/profile" className="text-sm font-medium text-indigo-600 hover:underline">
            Edit profile
          </Link>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <Field label="Contact" value={profile?.contact_name || '—'} />
          <Field label="Email" value={profile?.contact_email || '—'} />
          <Field label="Home currency" value={profile?.currency_home || 'JPY'} />
        </dl>
        <p className="mt-4 rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-700">
          {hasItems
            ? 'Your watch list is ready. Hit “Run analysis” to scan for current risks.'
            : 'No parts yet — add your bill of materials on the profile page.'}
        </p>
      </Card>

      {hasItems && (
        <Card>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Watch list</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
                  <th className="py-2 pr-3">Part</th>
                  <th className="py-2 pr-3">Supplier</th>
                  <th className="py-2 pr-3">Region</th>
                  <th className="py-2 pr-3">Lead time</th>
                  <th className="py-2">SKUs</th>
                </tr>
              </thead>
              <tbody>
                {(profile?.items ?? []).map((it, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 pr-3 font-medium text-slate-800">{it.part}</td>
                    <td className="py-2 pr-3 text-slate-600">{it.supplier}</td>
                    <td className="py-2 pr-3 text-slate-600">{it.supplier_region}</td>
                    <td className="py-2 pr-3 text-slate-600">{it.lead_time_days}d</td>
                    <td className="py-2 text-slate-500">{it.skus.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="truncate text-slate-800" title={value}>
        {value}
      </dd>
    </div>
  )
}

function NoticesCard({ brief, hasItems }: { brief: Brief | null; hasItems: boolean }) {
  const notices: { tone: string; text: string }[] = []
  if (brief) {
    if (brief.impact.summary) notices.push({ tone: 'amber', text: brief.impact.summary })
    for (const item of brief.impact.items) {
      const tone = item.risk_score >= 4 ? 'red' : item.risk_score === 3 ? 'amber' : 'emerald'
      notices.push({ tone, text: `${item.part}: ${jpy(item.jpy_exposure)} at risk — ${item.cause}` })
    }
  } else if (hasItems) {
    notices.push({ tone: 'indigo', text: 'No risk scan yet. Run an analysis to see live notices.' })
    notices.push({ tone: 'slate', text: 'Tip: keep your BOM current for accurate exposure.' })
  } else {
    notices.push({ tone: 'slate', text: 'Add your parts to start monitoring.' })
  }

  const dot: Record<string, string> = {
    red: 'bg-red-500',
    amber: 'bg-amber-500',
    emerald: 'bg-emerald-500',
    indigo: 'bg-indigo-500',
    slate: 'bg-slate-300',
  }

  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold text-slate-900">Notices</h2>
      <ul className="space-y-3">
        {notices.map((n, i) => (
          <li key={i} className="flex gap-2 text-sm text-slate-700">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot[n.tone]}`} />
            <span>{n.text}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function TodoCard({
  uid,
  brief,
  hasItems,
}: {
  uid: string | undefined
  brief: Brief | null
  hasItems: boolean
}) {
  const todos = useMemo(() => {
    const list: string[] = []
    if (!hasItems) list.push('Add your bill of materials')
    else if (!brief) list.push('Run your first risk analysis')
    if (brief) list.push(...brief.response_plan.priority_actions)
    list.push('Review supplier contact details')
    list.push('Upload your latest invoices')
    return Array.from(new Set(list))
  }, [brief, hasItems])

  const storageKey = uid ? `ss-todos-${uid}` : 'ss-todos'
  const [done, setDone] = useState<Record<string, boolean>>({})

  useEffect(() => {
    try {
      setDone(JSON.parse(localStorage.getItem(storageKey) || '{}'))
    } catch {
      setDone({})
    }
  }, [storageKey])

  function toggle(text: string) {
    setDone((prev) => {
      const next = { ...prev, [text]: !prev[text] }
      localStorage.setItem(storageKey, JSON.stringify(next))
      return next
    })
  }

  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold text-slate-900">To-do</h2>
      <ul className="space-y-2">
        {todos.map((text, i) => (
          <li key={i}>
            <label className="flex cursor-pointer items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!done[text]}
                onChange={() => toggle(text)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className={done[text] ? 'text-slate-400 line-through' : 'text-slate-700'}>
                {text}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </Card>
  )
}

