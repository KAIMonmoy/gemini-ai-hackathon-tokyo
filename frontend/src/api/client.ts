// API client. In Phase 2 there is no backend, so when VITE_API_BASE is empty we
// return a mock brief. In Phase 4, set VITE_API_BASE to the deployed Cloud Run
// URL and this same call hits the real FastAPI /analyze endpoint — no UI changes.

import type { Brief, BusinessProfile, WatchList } from '../lib/types'
import { SAMPLE_ITEMS } from '../lib/sample'
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

export async function uploadBom(
  files: File[],
  getIdToken: () => Promise<string>,
): Promise<WatchList> {
  if (!API_BASE) {
    // Mock mode: pretend to parse and return the sample BOM.
    await new Promise((r) => setTimeout(r, 1000))
    return { items: SAMPLE_ITEMS, currency_home: 'JPY' }
  }

  const token = await getIdToken()
  const form = new FormData()
  files.forEach((f) => form.append('files', f))
  const res = await fetch(`${API_BASE}/upload-bom`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  if (!res.ok) {
    throw new Error(`Upload failed (${res.status}): ${await res.text()}`)
  }
  const data = (await res.json()) as { watch_list: WatchList }
  return data.watch_list
}
