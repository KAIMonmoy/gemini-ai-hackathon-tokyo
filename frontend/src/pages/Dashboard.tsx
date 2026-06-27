import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../auth/AuthContext'
import { runAnalysis, usingMock } from '../api/client'
import { loadLatestRun, loadProfile, saveRun } from '../lib/store'
import type { Brief, BusinessProfile, Email } from '../lib/types'
import { Button, Card, RiskBadge, jpy } from '../components/ui'

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

  const hasItems = (profile?.items?.length ?? 0) > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Risk dashboard</h1>
          <p className="text-sm text-slate-500">
            {usingMock ? 'Demo mode (mock analysis — no backend connected yet).' : 'Live analysis via backend.'}
          </p>
        </div>
        <Button onClick={handleRun} disabled={running || !hasItems}>
          {running ? 'Analyzing…' : 'Run analysis'}
        </Button>
      </div>

      {!hasItems && (
        <Card>
          <p className="text-sm text-slate-600">
            You have no parts to watch yet.{' '}
            <Link to="/profile" className="font-medium text-indigo-600 hover:underline">
              Set up your business profile
            </Link>{' '}
            first.
          </p>
        </Card>
      )}

      {error && <Card className="border-red-200 bg-red-50 text-sm text-red-700">{error}</Card>}

      {brief && (
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
                <span key={c} className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
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
      )}
    </div>
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
