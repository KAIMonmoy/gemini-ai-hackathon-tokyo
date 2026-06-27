import { Link, NavLink } from 'react-router-dom'

import { useAuth } from '../auth/AuthContext'
import { Button } from './ui'

export default function PublicHeader() {
  const { user } = useAuth()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
      isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
    }`

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-sm font-bold tracking-tight text-slate-900">
          🛰️ Sourcing Sentinel
        </Link>
        <nav className="flex items-center gap-1">
          <NavLink to="/help" className={linkClass}>
            How it works
          </NavLink>
          <NavLink to="/demo" className={linkClass}>
            Demo
          </NavLink>
          {user ? (
            <Link to="/dashboard" className="ml-2">
              <Button>Open dashboard</Button>
            </Link>
          ) : (
            <>
              <Link to="/login" className="ml-2">
                <Button variant="secondary">Sign in</Button>
              </Link>
              <Link to="/signup">
                <Button>Get started</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
