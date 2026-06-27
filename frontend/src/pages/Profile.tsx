import { useEffect, useState } from 'react'

import { useAuth } from '../auth/AuthContext'
import { loadProfile, saveProfile } from '../lib/store'
import { EMPTY_WATCH_ITEM, type BusinessProfile, type WatchListItem } from '../lib/types'
import { Button, Card, Input } from '../components/ui'

const SAMPLE_ITEMS: WatchListItem[] = [
  { part: 'M3 titanium bolt', supplier: 'Tanaka Seiko', supplier_region: 'Kagoshima', country: 'Japan', currency: 'JPY', qty_per_month: 12000, unit_cost: 18, lead_time_days: 14, skus: ['A-100', 'A-110', 'B-200', 'B-210'], material: 'titanium' },
  { part: 'ABS housing', supplier: 'Maruyama Plastics', supplier_region: 'Osaka', country: 'Japan', currency: 'JPY', qty_per_month: 3000, unit_cost: 120, lead_time_days: 21, skus: ['A-100'], material: 'ABS resin' },
  { part: 'control IC', supplier: 'Shenzhen MicroTech', supplier_region: 'Shenzhen', country: 'China', currency: 'USD', qty_per_month: 2000, unit_cost: 3.4, lead_time_days: 35, skus: ['A-100', 'B-200'], material: 'semiconductor' },
]

const EMPTY_PROFILE: BusinessProfile = {
  company_name: '',
  contact_name: '',
  contact_email: '',
  currency_home: 'JPY',
  items: [],
}

export default function Profile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<BusinessProfile>(EMPTY_PROFILE)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    loadProfile(user.uid)
      .then((p) => {
        if (p) setProfile({ ...EMPTY_PROFILE, ...p })
        else setProfile({ ...EMPTY_PROFILE, contact_email: user.email ?? '', company_name: user.displayName ?? '' })
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load profile'))
      .finally(() => setLoading(false))
  }, [user])

  function setField<K extends keyof BusinessProfile>(key: K, value: BusinessProfile[K]) {
    setProfile((p) => ({ ...p, [key]: value }))
    setSaved(false)
  }

  function setItem(index: number, patch: Partial<WatchListItem>) {
    setProfile((p) => ({
      ...p,
      items: p.items.map((it, i) => (i === index ? { ...it, ...patch } : it)),
    }))
    setSaved(false)
  }

  function addItem() {
    setProfile((p) => ({ ...p, items: [...p.items, { ...EMPTY_WATCH_ITEM }] }))
  }

  function removeItem(index: number) {
    setProfile((p) => ({ ...p, items: p.items.filter((_, i) => i !== index) }))
  }

  async function handleSave() {
    if (!user) return
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      await saveProfile(user.uid, profile)
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-slate-500">Loading profile…</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Business profile</h1>
          <p className="text-sm text-slate-500">Describe your company and the parts we should watch.</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-emerald-600">Saved ✓</span>}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save profile'}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 text-sm text-red-700">{error}</Card>
      )}

      <Card className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Company name" value={profile.company_name} onChange={(e) => setField('company_name', e.target.value)} />
        <Input label="Home currency" value={profile.currency_home} onChange={(e) => setField('currency_home', e.target.value)} />
        <Input label="Contact name" value={profile.contact_name} onChange={(e) => setField('contact_name', e.target.value)} />
        <Input label="Contact email" type="email" value={profile.contact_email} onChange={(e) => setField('contact_email', e.target.value)} />
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Bill of materials (watch list)</h2>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setProfile((p) => ({ ...p, items: SAMPLE_ITEMS }))}>
              Load sample BOM
            </Button>
            <Button variant="secondary" onClick={addItem}>
              + Add part
            </Button>
          </div>
        </div>

        {/* BOM upload — wired to the real multimodal parser in Phase 4. */}
        <label className="mb-4 flex cursor-not-allowed items-center justify-between rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          <span>📄 Upload a BOM / invoice (PDF, Excel, photo) — auto-extract coming in Phase 4</span>
          <input type="file" disabled className="hidden" />
          <span className="rounded-md border border-slate-300 px-2 py-1 text-xs">Choose file</span>
        </label>

        {profile.items.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            No parts yet. Add one, or load the sample BOM to try the demo.
          </p>
        ) : (
          <div className="space-y-4">
            {profile.items.map((item, i) => (
              <div key={i} className="rounded-lg border border-slate-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">Part #{i + 1}</span>
                  <Button variant="ghost" className="text-red-600" onClick={() => removeItem(i)}>
                    Remove
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Input label="Part" value={item.part} onChange={(e) => setItem(i, { part: e.target.value })} />
                  <Input label="Supplier" value={item.supplier} onChange={(e) => setItem(i, { supplier: e.target.value })} />
                  <Input label="Supplier region" value={item.supplier_region} onChange={(e) => setItem(i, { supplier_region: e.target.value })} />
                  <Input label="Country" value={item.country} onChange={(e) => setItem(i, { country: e.target.value })} />
                  <Input label="Currency" value={item.currency} onChange={(e) => setItem(i, { currency: e.target.value })} />
                  <Input label="Material" value={item.material} onChange={(e) => setItem(i, { material: e.target.value })} />
                  <Input label="Qty / month" type="number" value={item.qty_per_month} onChange={(e) => setItem(i, { qty_per_month: Number(e.target.value) })} />
                  <Input label="Unit cost" type="number" value={item.unit_cost} onChange={(e) => setItem(i, { unit_cost: Number(e.target.value) })} />
                  <Input label="Lead time (days)" type="number" value={item.lead_time_days} onChange={(e) => setItem(i, { lead_time_days: Number(e.target.value) })} />
                  <Input
                    label="SKUs (comma-separated)"
                    className="sm:col-span-3"
                    value={item.skus.join(', ')}
                    onChange={(e) => setItem(i, { skus: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
