import { useState } from 'react'
import { getTheme, setTheme, type Theme } from '../settings'

export default function ThemeToggle() {
  const [theme, setThemeState] = useState<Theme>(getTheme)

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setThemeState(next)
    setTheme(next)
  }

  const seg = (active: boolean) =>
    `flex h-7 w-8 items-center justify-center rounded-full transition-all duration-200 ${
      active ? 'beam-chip' : 'text-muted hover:text-ink'
    }`

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="bg-card border-line hover:border-accent/60 flex items-center rounded-full border p-1 transition-colors"
    >
      <span className={seg(theme === 'light')} role="presentation">
        {/* Sun */}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      </span>
      <span className={seg(theme === 'dark')} role="presentation">
        {/* Moon */}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </svg>
      </span>
    </button>
  )
}
