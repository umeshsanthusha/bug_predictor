import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import AuthShell, { inputClass, labelClass } from '../components/AuthShell'
import PasswordInput from '../components/PasswordInput'

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [confirmSent, setConfirmSent] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setPending(true)
    setError(null)
    try {
      const signedIn = await signUp(name, email, password)
      if (signedIn) {
        navigate('/dashboard', { replace: true })
      } else {
        setConfirmSent(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.')
    } finally {
      setPending(false)
    }
  }

  if (confirmSent) {
    return (
      <AuthShell>
        <h1 className="font-display text-2xl font-extrabold tracking-tight uppercase">
          Check your email
        </h1>
        <p className="text-muted mt-2 text-sm">
          We sent a confirmation link to{' '}
          <span className="text-ink font-semibold">{email}</span>. Click it to activate your
          account, then sign in.
        </p>
        <p className="text-muted mt-6 text-center text-sm">
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
        Create account
      </h1>
      <p className="text-muted mt-2 text-sm">
        One account, unlimited file scorings.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
        <div>
          <label htmlFor="name" className={labelClass}>
            Name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Your name"
          />
        </div>
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
        <PasswordInput
          id="password"
          label="Password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={setPassword}
          placeholder="At least 8 characters"
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
          {pending ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="text-muted mt-6 text-center text-sm">
        Already registered?{' '}
        <Link to="/login" className="text-accent font-semibold underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
