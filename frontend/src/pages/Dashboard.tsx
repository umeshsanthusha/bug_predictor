import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import ThemeToggle from '../components/ThemeToggle'
import UserMenu from '../components/UserMenu'

export default function Dashboard() {
  const [navOpen, setNavOpen] = useState(false)
  const location = useLocation()

  // Close the mobile drawer after navigating
  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  return (
    <div className="relative z-10 min-h-screen">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />

      <div className="flex min-h-screen flex-col lg:pl-64">
        {/* Slim top bar — mobile menu + theme */}
        <div className="border-line bg-panel/95 sticky top-0 z-20 flex h-14 items-center border-b px-4 backdrop-blur-md sm:px-6">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="Open navigation"
            className="border-line text-muted hover:border-accent/60 hover:text-ink flex h-9 w-9 items-center justify-center rounded-lg border transition-colors lg:hidden"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>

        <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 sm:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
