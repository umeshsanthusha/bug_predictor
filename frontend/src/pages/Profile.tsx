import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useChats } from '../chat/ChatContext'
import { inputClass, labelClass } from '../components/AuthShell'
import SectionHeading from '../components/SectionHeading'
import * as api from '../api'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function formatMemberSince(raw?: string): string {
  if (!raw) return ''
  // SQLite stores "YYYY-MM-DD HH:MM:SS" in UTC
  const iso = raw.includes('T') ? raw : `${raw.replace(' ', 'T')}Z`
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-line bg-card rounded-xl border px-4 py-3.5">
      <p className="font-display text-2xl font-extrabold tracking-tight tabular-nums">{value}</p>
      <p className="font-mono text-muted mt-0.5 text-[0.6rem] font-semibold tracking-[0.16em] uppercase">
        {label}
      </p>
    </div>
  )
}

export default function Profile() {
  const { user, updateUser } = useAuth()
  const { chats } = useChats()

  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  if (!user) return null

  const trimmedName = name.trim()
  const trimmedEmail = email.trim().toLowerCase()
  const dirty = trimmedName !== user.name || trimmedEmail !== user.email
  const canSave = dirty && trimmedName.length > 0 && trimmedEmail.length > 0 && !saving

  const stats = {
    analyses: chats.length,
    pinned: chats.filter((c) => c.pinned).length,
    scanned: chats.reduce((sum, c) => sum + c.total_files, 0),
    buggy: chats.reduce((sum, c) => sum + c.buggy_files, 0),
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const updated = await api.updateProfile({ name: trimmedName, email: trimmedEmail })
      updateUser(updated)
      setName(updated.name)
      setEmail(updated.email)
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  const memberSince = formatMemberSince(user.created_at)

  return (
    <div className="pb-16">
      {/* Page header */}
      <div className="mb-10">
        <p className="font-mono text-accent mb-2 text-[0.65rem] tracking-[0.3em] uppercase">
          Dashboard
        </p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight uppercase sm:text-4xl">
          Your profile
        </h1>
        <p className="text-muted mt-3 max-w-xl text-sm leading-relaxed">
          Manage how you appear across CrossBugSense and keep your sign-in details current.
        </p>
      </div>

      {/* Identity card */}
      <div className="border-line bg-panel rise-in flex flex-wrap items-center gap-5 rounded-2xl border p-6">
        <div className="beam-chip font-display flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-extrabold tracking-tight">
          {initials(user.name)}
        </div>
        <div className="min-w-0">
          <h2 className="font-display truncate text-xl font-extrabold tracking-tight">
            {user.name}
          </h2>
          <p className="font-mono text-muted truncate text-xs">{user.email}</p>
          {memberSince && (
            <p className="text-muted mt-1.5 text-xs">Member since {memberSince}</p>
          )}
        </div>
      </div>

      {/* Activity */}
      <section className="mt-12">
        <SectionHeading index="01" title="Analysis activity" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Analyses" value={stats.analyses} />
          <Stat label="Pinned" value={stats.pinned} />
          <Stat label="Files scanned" value={stats.scanned} />
          <Stat label="Flagged buggy" value={stats.buggy} />
        </div>
      </section>

      {/* Edit details */}
      <section className="mt-12">
        <SectionHeading index="02" title="Account details" />
        <form
          onSubmit={handleSave}
          className="border-line bg-panel space-y-5 rounded-2xl border p-6"
          noValidate
        >
          <div>
            <label htmlFor="profile-name" className={labelClass}>
              Display name
            </label>
            <input
              id="profile-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setSaved(false)
              }}
              className={inputClass}
              placeholder="Your name"
            />
          </div>
          <div>
            <label htmlFor="profile-email" className={labelClass}>
              Email address
            </label>
            <input
              id="profile-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setSaved(false)
              }}
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
          {saved && !error && (
            <p
              role="status"
              className="border-good/40 bg-good/10 text-good rounded-lg border px-4 py-3 text-sm"
            >
              Profile updated.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 pt-1">
            <button
              type="submit"
              disabled={!canSave}
              className={`font-display rounded-xl px-8 py-3 text-sm font-bold tracking-[0.18em] uppercase transition-colors ${
                canSave ? 'beam-btn' : 'bg-card text-muted cursor-not-allowed'
              }`}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            {dirty && !saving && (
              <span className="font-mono text-muted text-[0.65rem] tracking-[0.15em] uppercase">
                Unsaved changes
              </span>
            )}
          </div>
        </form>
      </section>

      <p className="text-muted mt-10 text-sm">
        Want to change your password or appearance?{' '}
        <Link
          to="/dashboard/settings"
          className="text-accent font-semibold underline-offset-4 hover:underline"
        >
          Open settings
        </Link>
      </p>
    </div>
  )
}
