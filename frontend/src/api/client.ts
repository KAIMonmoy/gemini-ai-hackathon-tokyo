// API client. In Phase 2 there is no backend, so when VITE_API_BASE is empty we
// return a mock brief. In Phase 4, set VITE_API_BASE to the deployed Cloud Run
// URL and this same call hits the real FastAPI /analyze endpoint — no UI changes.

import type { Brief, BusinessProfile } from '../lib/types'
import { mockBrief } from './mockBrief'

const API_BASE = import.meta.env.VITE_API_BASE

export const usingMock = !API_BASE

export async function runAnalysis(
  profile: BusinessProfile,
  getIdToken: () => Promise<string>,
): Promise<Brief> {
  if (!API_BASE) {
    // Simulate backend latency so the loading state is visible.
    await new Promise((r) => setTimeout(r, 1200))
    return mockBrief(profile)
  }

  const token = await getIdToken()
  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ profile }),
  })
  if (!res.ok) {
    throw new Error(`Analyze failed (${res.status}): ${await res.text()}`)
  }
  return (await res.json()) as Brief
}
