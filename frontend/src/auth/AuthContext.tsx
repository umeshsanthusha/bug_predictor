import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import * as api from '../api'
import { UNAUTHORIZED_EVENT } from '../api'
import { supabase } from '../supabase'
import type { User } from '../types'

type AuthStatus = 'loading' | 'authed' | 'anon'

interface AuthContextValue {
  user: User | null
  status: AuthStatus
  /** Signs in; throws with a friendly message on failure. */
  signIn: (email: string, password: string) => Promise<void>
  /** Signs up; throws on failure. Returns false if an email confirmation is pending. */
  signUp: (name: string, email: string, password: string) => Promise<boolean>
  signOut: () => void
  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  useEffect(() => {
    let active = true

    const applySession = async () => {
      try {
        const me = await api.fetchMe()
        if (!active) return
        setUser(me)
        setStatus(me ? 'authed' : 'anon')
      } catch {
        if (active) setStatus('anon')
      }
    }

    // Pick up the recovery code from a hashed password-reset link so
    // ResetPassword can exchange it for a session.
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    if (params.get('type') === 'recovery' && params.get('code')) {
      api.setRecoveryCode(params.get('code') as string)
    }

    void applySession()

    // INITIAL_SESSION fires once on boot; SIGNED IN/OUT and PASSWORD_RECOVERY
    // keep the state current afterwards.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setStatus('anon')
        return
      }
      if (event === 'PASSWORD_RECOVERY') {
        // Recovery without a hash code (session injected directly) — route handled by App
        void applySession()
        return
      }
      void applySession()
      void session
    })

    // Any protected Flask API call that comes back 401 signs the user out
    const onUnauthorized = () => {
      void supabase.auth.signOut()
      setUser(null)
      setStatus('anon')
    }
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)

    return () => {
      active = false
      sub.subscription.unsubscribe()
      window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    }
  }, [])

  const value: AuthContextValue = {
    user,
    status,
    signIn: async (email, password) => {
      const result = await api.login(email, password)
      if ('user' in result) {
        setUser(result.user)
        setStatus('authed')
      }
    },
    signUp: async (name, email, password) => {
      const result = await api.register(name, email, password)
      if ('user' in result) {
        setUser(result.user)
        setStatus('authed')
        return true
      }
      return false
    },
    signOut: () => {
      void supabase.auth.signOut()
      setUser(null)
      setStatus('anon')
    },
    updateUser: (u) => setUser(u),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
