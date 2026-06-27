import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'

import { auth } from '../lib/firebase'

interface AuthContextValue {
  user: User | null
  loading: boolean
  signup: (email: string, password: string, displayName?: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  getIdToken: () => Promise<string>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async signup(email, password, displayName) {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        if (displayName) await updateProfile(cred.user, { displayName })
      },
      async login(email, password) {
        await signInWithEmailAndPassword(auth, email, password)
      },
      async loginWithGoogle() {
        await signInWithPopup(auth, new GoogleAuthProvider())
      },
      async logout() {
        await signOut(auth)
      },
      async getIdToken() {
        if (!auth.currentUser) throw new Error('Not authenticated')
        return auth.currentUser.getIdToken()
      },
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
