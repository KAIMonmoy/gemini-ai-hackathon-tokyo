import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../auth/AuthContext'
import { isFirebaseConfigured } from '../lib/firebase'
import { Button, Card, Input } from '../components/ui'

export default function Login() {
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  async function handleGoogle() {
    setError('')
    try {
      await loginWithGoogle()
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google login failed')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 text-xl font-semibold text-slate-900">Sourcing Sentinel</h1>
        <p className="mb-5 text-sm text-slate-500">Sign in to your risk desk.</p>

        {!isFirebaseConfigured && (
          <p className="mb-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
            Firebase isn't configured yet. Add VITE_FIREBASE_* values to frontend/.env.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200" /> or <span className="h-px flex-1 bg-slate-200" />
        </div>

        <Button variant="secondary" className="w-full" onClick={handleGoogle}>
          Continue with Google
        </Button>

        <p className="mt-5 text-center text-sm text-slate-500">
          No account?{' '}
          <Link to="/signup" className="font-medium text-indigo-600 hover:underline">
            Sign up
          </Link>
        </p>
      </Card>
    </div>
  )
}
