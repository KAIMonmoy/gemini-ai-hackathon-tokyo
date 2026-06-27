// A topology-aware view of the multi-agent pipeline while an analysis runs.
// Not a flat checklist: the sensing stage fans out into 4 parallel streams and the
// response stage shows the plan ⇄ critic loop. Purely visual — it steps through the
// real pipeline stages on a timer; the last stage keeps active until `running` ends.

import { useEffect, useState } from 'react'

import { Card } from './ui'

type Status = 'done' | 'active' | 'pending'

interface Stage {
  n: number
  title: string
  sub: string
  parallel?: string[]
  loop?: boolean
}

const STAGES: Stage[] = [
  { n: 1, title: 'Document intake', sub: 'Reads BOM / invoices → watch list' },
  {
    n: 2,
    title: 'Sensing team',
    sub: 'Four specialists — run in parallel',
    parallel: ['News', 'Weather', 'Commodity', 'FX'],
  },
  { n: 3, title: 'Impact fusion', sub: 'Match signals to your parts → ¥ exposure' },
  { n: 4, title: 'Response coordinator', sub: 'Re-source · hedge · renegotiate', loop: true },
  { n: 5, title: 'Comms', sub: 'Draft keigo (JP) + English emails' },
]

const STEP_MS = 1500

function Spinner({ className = 'h-4 w-4 text-indigo-600' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
    </svg>
  )
}

function NodeDot({ status, n }: { status: Status; n: number }) {
  if (status === 'done') {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white ring-4 ring-emerald-100">
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 111.4-1.4l3 3 6.8-6.8a1 1 0 011.4 0z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    )
  }
  if (status === 'active') {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white ring-4 ring-indigo-100">
        <Spinner className="h-4 w-4 text-white" />
      </div>
    )
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-300 bg-white text-sm font-semibold text-slate-400">
      {n}
    </div>
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
      <div className="mb-5 flex items-center gap-2">
        <Spinner className="h-5 w-5 text-indigo-600" />
        <h2 className="text-lg font-semibold text-slate-900">Agent team at work…</h2>
        <span className="ml-auto text-xs text-slate-400">Sequential pipeline · parallel sensing · review loop</span>
      </div>

      <div className="relative">
        {/* vertical rail */}
        <div className="absolute bottom-4 left-4 top-4 w-px bg-slate-200" />

        <div className="space-y-3">
          {STAGES.map((stage, i) => {
            const status: Status = i < active ? 'done' : i === active ? 'active' : 'pending'
            return (
              <div key={stage.n} className="relative flex gap-4">
                <div className="z-10">
                  <NodeDot status={status} n={stage.n} />
                </div>
                <div
                  className={`flex-1 rounded-xl border p-3 transition ${
                    status === 'active'
                      ? 'border-indigo-300 bg-indigo-50/50 shadow-sm'
                      : status === 'done'
                        ? 'border-slate-200 bg-white'
                        : 'border-slate-200 bg-white opacity-60'
                  }`}
                >
                  <div
                    className={`text-sm font-semibold ${
                      status === 'pending' ? 'text-slate-400' : 'text-slate-900'
                    }`}
                  >
                    {stage.title}
                  </div>
                  <div className="text-xs text-slate-500">{stage.sub}</div>

                  {/* Parallel fan-out for the sensing stage */}
                  {stage.parallel && status !== 'pending' && (
                    <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                      {stage.parallel.map((p) => (
                        <span
                          key={p}
                          className={`flex items-center justify-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${
                            status === 'active'
                              ? 'animate-pulse bg-indigo-100 text-indigo-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Review loop for the response stage */}
                  {stage.loop && status !== 'pending' && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-700">
                        Planner
                        <span className={status === 'active' ? 'inline-block animate-spin' : ''}>↻</span>
                        Critic
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-600">
                        hedge
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-600">
                        renegotiate
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
