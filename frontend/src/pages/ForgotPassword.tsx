import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api'
import AuthShell, { inputClass, labelClass } from '../components/AuthShell'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState<{ message: string; demoResetUrl: string | null } | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setPending(true)
    setError(null)
    try {
      setSent(await forgotPassword(email))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start password reset.')
    } finally {
      setPending(false)
    }
  }

  if (sent) {
    return (
      <AuthShell>
        <h1 className="font-display text-2xl font-extrabold tracking-tight uppercase">
          Check your email
        </h1>
        <p className="text-muted mt-2 text-sm">{sent.message}</p>

        {sent.demoResetUrl && (
          <div className="border-line bg-card mt-6 rounded-lg border p-4">
            <p className="font-mono text-muted text-[0.65rem] font-semibold tracking-[0.18em] uppercase">
              Demo link (no email service configured)
            </p>
            <Link
              to={sent.demoResetUrl}
              className="text-accent mt-2 inline-block text-sm font-semibold underline-offset-4 hover:underline"
            >
              Reset your password →
            </Link>
          </div>
        )}

        <p className="text-muted mt-6 text-center text-sm">
          Remembered it?{' '}
          <Link to="/login" className="text-accent font-semibold underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <h1 className="font-display text-2xl font-extrabold tracking-tight uppercase">
        Forgot password
      </h1>
      <p className="text-muted mt-2 text-sm">
        Enter your account email and we&apos;ll generate a reset link.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="you@studio.dev"
          />
        </div>

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
          {pending ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <p className="text-muted mt-6 text-center text-sm">
        Remembered it?{' '}
        <Link to="/login" className="text-accent font-semibold underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  )
}
