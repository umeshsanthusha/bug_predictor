import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../api'
import { useAuth } from '../auth/AuthContext'
import ConfirmDialog from '../components/ConfirmDialog'
import PasswordInput from '../components/PasswordInput'
import SectionHeading from '../components/SectionHeading'
import { getDefaultModel, getTheme, setDefaultModel, setTheme, type Theme } from '../settings'
import type { ModelInfo } from '../types'

/* ── Appearance ─────────────────────────────────────────────── */
function AppearanceCard() {
  const [theme, setThemeState] = useState<Theme>(getTheme)

  const choose = (next: Theme) => {
    setThemeState(next)
    setTheme(next)
  }

  const seg = (value: Theme) =>
    `font-mono flex-1 rounded-lg px-4 py-2.5 text-[0.7rem] font-semibold tracking-[0.15em] uppercase transition-colors ${
      theme === value ? 'beam-chip' : 'text-muted hover:text-ink hover:bg-card'
    }`

  return (
    <div className="border-line bg-panel rounded-2xl border p-6">
      <p className="text-ink text-sm font-semibold">Theme</p>
      <p className="text-muted mt-1 text-xs leading-relaxed">
        Pick the light or dark instrument panel. Applies on this device.
      </p>
      <div className="border-line bg-card mt-4 flex gap-1 rounded-xl border p-1">
        <button type="button" onClick={() => choose('light')} className={seg('light')}>
          Light
        </button>
        <button type="button" onClick={() => choose('dark')} className={seg('dark')}>
          Dark
        </button>
      </div>
    </div>
  )
}

/* ── Default model ──────────────────────────────────────────── */
function DefaultModelCard() {
  const [models, setModels] = useState<ModelInfo[]>([])
  const [selected, setSelected] = useState<string>(getDefaultModel)

  useEffect(() => {
    api
      .fetchModels()
      .then((data) => setModels(data.models))
      .catch(() => setModels([]))
  }, [])

  const choose = (key: string) => {
    setSelected(key)
    setDefaultModel(key)
  }

  const option = (active: boolean) =>
    `w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
      active
        ? 'border-accent bg-accent/10 text-ink shadow-[inset_2px_0_0_var(--accent)]'
        : 'border-line bg-panel text-muted hover:border-accent/50 hover:text-ink'
    }`

  return (
    <div className="border-line bg-panel rounded-2xl border p-6">
      <p className="text-ink text-sm font-semibold">Default prediction model</p>
      <p className="text-muted mt-1 text-xs leading-relaxed">
        Pre-selected every time you open the Bug Predictor.
      </p>
      <div className="mt-4 space-y-2">
        <button
          type="button"
          onClick={() => choose('')}
          className={option(selected === '')}
        >
          No preference
          <span className="text-muted mt-0.5 block text-xs">Use the first available model</span>
        </button>
        {models.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => choose(m.key)}
            className={option(selected === m.key)}
          >
            <span className="flex items-center justify-between gap-3">
              <span className="font-semibold">{m.name}</span>
              <span className="font-mono text-muted text-xs">{m.accuracy.toFixed(2)}%</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Change password ────────────────────────────────────────── */
function PasswordCard() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const matches = next.length >= 8 && next === confirm
  const canSave = current.length > 0 && matches && !saving

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setDone(false)
    try {
      await api.changePassword(current, next)
      setCurrent('')
      setNext('')
      setConfirm('')
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-line bg-panel space-y-4 rounded-2xl border p-6"
      noValidate
    >
      <PasswordInput
        id="pw-current"
        label="Current password"
        autoComplete="current-password"
        value={current}
        onChange={(v) => {
          setCurrent(v)
          setDone(false)
        }}
        placeholder="••••••••"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <PasswordInput
          id="pw-new"
          label="New password"
          autoComplete="new-password"
          value={next}
          onChange={(v) => {
            setNext(v)
            setDone(false)
          }}
          placeholder="At least 8 characters"
        />
        <div>
          <PasswordInput
            id="pw-confirm"
            label="Confirm new"
            autoComplete="new-password"
            value={confirm}
            onChange={(v) => {
              setConfirm(v)
              setDone(false)
            }}
            placeholder="Repeat new password"
          />
          {confirm.length > 0 && !matches && (
            <p className="text-accent-2 mt-1.5 text-xs">Passwords don&apos;t match.</p>
          )}
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="border-accent-2/40 bg-accent-2/10 text-accent-2 rounded-lg border px-4 py-3 text-sm"
        >
          {error}
        </p>
      )}
      {done && !error && (
        <p role="status" className="border-good/40 bg-good/10 text-good rounded-lg border px-4 py-3 text-sm">
          Password changed.
        </p>
      )}

      <button
        type="submit"
        disabled={!canSave}
        className={`font-display rounded-xl px-8 py-3 text-sm font-bold tracking-[0.18em] uppercase transition-colors ${
          canSave ? 'beam-btn' : 'bg-card text-muted cursor-not-allowed'
        }`}
      >
        {saving ? 'Updating…' : 'Update password'}
      </button>
    </form>
  )
}

/* ── Danger zone ────────────────────────────────────────────── */
function DangerCard({ onDeleted }: { onDeleted: () => void }) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setConfirming(false)
    setBusy(true)
    setError(null)
    try {
      await api.deleteAccount()
      onDeleted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account.')
      setBusy(false)
    }
  }

  return (
    <div className="border-accent-2/40 bg-accent-2/5 rounded-2xl border p-6">
      <p className="text-accent-2 font-mono text-[0.65rem] font-semibold tracking-[0.2em] uppercase">
        Danger zone
      </p>
      <p className="text-ink mt-2 text-sm font-semibold">Delete this account</p>
      <p className="text-muted mt-1 text-xs leading-relaxed">
        Permanently removes your account and every saved analysis. This can&apos;t be undone.
      </p>

      {error && (
        <p role="alert" className="text-accent-2 mt-3 text-sm">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={busy}
        onClick={() => setConfirming(true)}
        className="font-mono mt-4 rounded-lg bg-accent-2 px-5 py-2.5 text-[0.65rem] font-semibold tracking-[0.15em] text-white uppercase transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? 'Deleting…' : 'Delete account'}
      </button>

      {confirming && (
        <ConfirmDialog
          title="Delete your account?"
          message={
            <>
              Your account, and{' '}
              <span className="text-ink font-semibold">all saved analyses</span>, will be
              permanently removed. This can&apos;t be undone.
            </>
          }
          confirmLabel="Yes, delete everything"
          onConfirm={handleDelete}
          onClose={() => setConfirming(false)}
        />
      )}
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────────── */
export default function Settings() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const leaveApp = () => {
    signOut()
    navigate('/')
  }

  return (
    <div className="pb-16">
      {/* Page header */}
      <div className="mb-10">
        <p className="font-mono text-accent mb-2 text-[0.65rem] tracking-[0.3em] uppercase">
          Dashboard
        </p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight uppercase sm:text-4xl">
          Settings
        </h1>
        <p className="text-muted mt-3 max-w-xl text-sm leading-relaxed">
          Tune the workspace appearance, your default model, and secure your account.
        </p>
      </div>

      <section>
        <SectionHeading index="01" title="Appearance" />
        <AppearanceCard />
      </section>

      <section className="mt-12">
        <SectionHeading index="02" title="Prediction defaults" />
        <DefaultModelCard />
      </section>

      <section className="mt-12">
        <SectionHeading index="03" title="Security" />
        <PasswordCard />
      </section>

      <section className="mt-12">
        <SectionHeading index="04" title="Session" />
        <div className="border-line bg-panel flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-6">
          <div>
            <p className="text-ink text-sm font-semibold">Sign out</p>
            <p className="text-muted mt-1 text-xs leading-relaxed">
              End your session on this device.
            </p>
          </div>
          <button
            type="button"
            onClick={leaveApp}
            className="border-line font-mono text-muted hover:border-accent/60 hover:text-ink rounded-lg border px-5 py-2.5 text-[0.65rem] font-semibold tracking-[0.15em] uppercase transition-colors"
          >
            Sign out
          </button>
        </div>
      </section>

      <section className="mt-12">
        <SectionHeading index="05" title="Data & account" />
        <DangerCard onDeleted={leaveApp} />
      </section>
    </div>
  )
}

