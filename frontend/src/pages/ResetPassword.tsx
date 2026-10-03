import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../api'
import { supabase } from '../supabase'
import AuthShell from '../components/AuthShell'
import PasswordInput from '../components/PasswordInput'

export default function ResetPassword() {
  const [params] = useSearchParams()
  // Reached via a Supabase recovery link (?recovery=1 + hashed token in the URL)
  const viaRecovery = params.get('recovery') === '1'

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setPending(true)
    setError(null)
    try {
      if (viaRecovery) {
        // supabase-js already created a recovery session from the link hash
        const { data } = await supabase.auth.getSession()
        if (!data.session) {
          throw new Error('This reset link has expired. Please request a new one.')
        }
      }
      await resetPassword('', password)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password.')
    } finally {
      setPending(false)
    }
  }

  if (!viaRecovery) {
    return (
      <AuthShell>
        <h1 className="font-display text-2xl font-extrabold tracking-tight uppercase">
          Invalid link
        </h1>
        <p className="text-muted mt-2 text-sm">
          This reset link is missing its token. Request a new one to continue.
        </p>
        <p className="mt-6 text-center text-sm">
          <Link
            to="/forgot-password"
            className="text-accent font-semibold underline-offset-4 hover:underline"
          >
            Request new link
          </Link>
        </p>
      </AuthShell>
    )
  }

  if (done) {
    return (
      <AuthShell>
        <h1 className="font-display text-2xl font-extrabold tracking-tight uppercase">
          Password updated
        </h1>
        <p className="text-muted mt-2 text-sm">
          Your password has been reset — you&apos;re signed in with the new password.
        </p>
        <p className="mt-6 text-center text-sm">
          <Link
            to="/dashboard"
            className="text-accent font-display block rounded-xl py-3 text-center text-sm font-bold tracking-[0.18em] uppercase"
          >
            Go to dashboard
          </Link>
        </p>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <h1 className="font-display text-2xl font-extrabold tracking-tight uppercase">
        Set new password
      </h1>
      <p className="text-muted mt-2 text-sm">
        Choose a new password for your account.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
        <PasswordInput
          id="password"
          label="New password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={setPassword}
          placeholder="At least 8 characters"
        />
        <PasswordInput
          id="confirm-password"
          label="Confirm password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirm}
          onChange={setConfirm}
          placeholder="Repeat new password"
        />

        {error && (
          <p
            role="alert"
            className="border-accent-2/40 bg-accent-2/10 text-accent-2 rounded-lg border px-4 py-3 text-sm"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className={`font-display w-full rounded-xl py-3 text-sm font-bold tracking-[0.18em] uppercase transition-colors ${
            pending ? 'bg-card text-muted cursor-not-allowed' : 'beam-btn'
          }`}
        >
          {pending ? 'Resetting…' : 'Reset password'}
        </button>
      </form>

      <p className="text-muted mt-6 text-center text-sm">
        Changed your mind?{' '}
        <Link to="/login" className="text-accent font-semibold underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  )
}
