import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Brand from './Brand'
import ThemeToggle from './ThemeToggle'

/** Centered shell for the login / register screens. */
export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      <div className="border-line flex items-center justify-between border-b px-6 py-3">
        <Link to="/" aria-label="Back to home">
          <Brand />
        </Link>
        <ThemeToggle />
      </div>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="border-line bg-panel rise-in w-full max-w-sm rounded-2xl border p-7">
          {children}
        </div>
      </main>
    </div>
  )
}

/** Shared field styles for auth inputs. */
export const inputClass =
  'border-line bg-panel text-ink placeholder:text-muted focus:border-accent w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-all focus:shadow-[0_0_0_3px_var(--glow-accent)]'

export const labelClass =
  'font-mono text-muted mb-1.5 block text-[0.65rem] font-semibold tracking-[0.18em] uppercase'
