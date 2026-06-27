// Animated view of the multi-agent pipeline while an analysis runs.
// Purely visual: it steps through the real pipeline stages on a timer. The actual
// result is driven by the backend call in the parent; the last stage keeps spinning
// until `running` flips false.

import { useEffect, useState } from 'react'

import { Card } from './ui'

interface Stage {
  key: string
  label: string
  detail: string
  streams?: string[]
}

const STAGES: Stage[] = [
  { key: 'intake', label: 'Reading the watch list', detail: 'Structuring parts, suppliers, regions' },
  {
    key: 'sensing',
    label: 'Sensing risk signals',
    detail: 'Four specialist agents — in parallel',
    streams: ['News', 'Weather', 'Commodity', 'FX'],
  },
  { key: 'impact', label: 'Fusing impact & ¥ exposure', detail: 'Matching signals to your parts' },
  { key: 'response', label: 'Planning the response', detail: 'Plan ⇄ critic loop until feasible' },
  { key: 'comms', label: 'Drafting emails', detail: 'Keigo (Japanese) + English' },
]

const STEP_MS = 1500

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-indigo-600" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
    </svg>
  )
}

function Check() {
  return (
    <svg className="h-5 w-5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 111.4-1.4l3 3 6.8-6.8a1 1 0 011.4 0z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export default function AgentProgress({ running }: { running: boolean }) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (!running) return
    setActive(0)
    const id = setInterval(() => setActive((a) => Math.min(a + 1, STAGES.length - 1)), STEP_MS)
    return () => clearInterval(id)
  }, [running])

  return (
    <Card>
      <div className="mb-4 flex items-center gap-2">
        <Spinner />
        <h2 className="text-lg font-semibold text-slate-900">Agents at work…</h2>
      </div>
      <ol className="space-y-4">
        {STAGES.map((stage, i) => {
          const status = i < active ? 'done' : i === active ? 'active' : 'pending'
          return (
            <li key={stage.key} className="flex gap-3">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                {status === 'done' ? (
                  <Check />
                ) : status === 'active' ? (
                  <Spinner />
                ) : (
                  <span className="h-3 w-3 rounded-full border-2 border-slate-300" />
                )}
              </div>
              <div className="flex-1">
                <div
                  className={`text-sm font-medium ${
                    status === 'pending' ? 'text-slate-400' : 'text-slate-800'
                  }`}
                >
                  {i + 1}. {stage.label}
                </div>
                <div className="text-xs text-slate-400">{stage.detail}</div>
                {stage.streams && status !== 'pending' && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {stage.streams.map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </Card>
  )
}
