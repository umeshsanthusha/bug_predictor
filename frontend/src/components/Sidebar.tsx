import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useChats } from '../chat/ChatContext'
import type { ChatSummary } from '../types'
import Brand from './Brand'
import ConfirmDialog from './ConfirmDialog'

const NAV_ITEMS = [
  {
    to: '/dashboard',
    end: true,
    label: 'New Chat',
    icon: (
      // scan / crosshair
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="7" />
        <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
      </svg>
    ),
  },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

function PinIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 17v5M9 10.8V4h6v6.8l2.4 2.7H6.6L9 10.8z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 10v7M14 10v7" />
    </svg>
  )
}

function GroupLabel({ children }: { children: string }) {
  return (
    <p className="font-mono text-muted px-3 pt-5 pb-1.5 text-[0.6rem] font-semibold tracking-[0.22em] uppercase">
      {children}
    </p>
  )
}

function ChatRow({
  chat,
  onOpen,
  onRequestDelete,
}: {
  chat: ChatSummary
  onOpen: () => void
  onRequestDelete: (chat: ChatSummary) => void
}) {
  const { togglePin } = useChats()
  return (
    <div className="group relative">
      <NavLink
        to={`/dashboard/chat/${chat.id}`}
        onClick={onOpen}
        title={`${chat.buggy_files}/${chat.total_files} files flagged buggy`}
        className={({ isActive }) =>
          `block truncate rounded-lg py-2 pr-16 pl-3 text-sm transition-colors ${
            isActive
              ? 'bg-accent/10 text-accent shadow-[inset_2px_0_0_var(--accent)]'
              : 'text-muted hover:text-ink hover:bg-card'
          }`
        }
      >
        {chat.title}
      </NavLink>
      <button
        type="button"
        onClick={() => onRequestDelete(chat)}
        aria-label={`Delete ${chat.title}`}
        className="text-muted hover:text-accent-2 absolute top-1/2 right-8 -translate-y-1/2 rounded-md p-1.5 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
      >
        <TrashIcon />
      </button>
      <button
        type="button"
        onClick={() => togglePin(chat)}
        aria-label={chat.pinned ? `Unpin ${chat.title}` : `Pin ${chat.title}`}
        className={`absolute top-1/2 right-1 -translate-y-1/2 rounded-md p-1.5 transition-opacity focus-visible:opacity-100 ${
          chat.pinned
            ? 'text-accent opacity-100'
            : 'text-muted hover:text-ink opacity-0 group-hover:opacity-100'
        }`}
      >
        <PinIcon filled={chat.pinned} />
      </button>
    </div>
  )
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { chats, deleteChat } = useChats()
  const navigate = useNavigate()
  const location = useLocation()
  const [pendingDelete, setPendingDelete] = useState<ChatSummary | null>(null)
  const pinned = chats.filter((c) => c.pinned)
  const recent = chats.filter((c) => !c.pinned)

  const confirmDelete = async () => {
    const chat = pendingDelete
    setPendingDelete(null)
    if (!chat) return
    const deleted = await deleteChat(chat)
    // If we're viewing the chat that just got deleted, go back to the predictor
    if (deleted && location.pathname === `/dashboard/chat/${chat.id}`) {
      navigate('/dashboard')
    }
  }

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="bg-ink/40 fixed inset-0 z-30 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        className={`border-line bg-panel fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r shadow-[var(--slab-shadow)] transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-line flex h-14 items-center border-b px-5">
          <Brand />
        </div>

        <nav className="px-3 pt-4" aria-label="Dashboard">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-accent/10 text-accent shadow-[inset_2px_0_0_var(--accent)]'
                    : 'text-muted hover:text-ink hover:bg-card'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Saved analysis chats */}
        <div className="mt-1 min-h-0 flex-1 overflow-y-auto px-3 pb-4">
          {pinned.length > 0 && (
            <>
              <GroupLabel>Pinned</GroupLabel>
              <div className="space-y-0.5">
                {pinned.map((chat) => (
                  <ChatRow key={chat.id} chat={chat} onOpen={onClose} onRequestDelete={setPendingDelete} />
                ))}
              </div>
            </>
          )}
          <GroupLabel>{pinned.length > 0 ? 'Recent' : 'Chats'}</GroupLabel>
          {chats.length === 0 ? (
            <p className="text-muted px-3 text-xs leading-relaxed">
              Your analyses will appear here once you run the predictor.
            </p>
          ) : (
            <div className="space-y-0.5">
              {recent.map((chat) => (
                <ChatRow key={chat.id} chat={chat} onOpen={onClose} onRequestDelete={setPendingDelete} />
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Delete confirmation popup */}
      {pendingDelete && (
        <ConfirmDialog
          title="Delete this chat?"
          message={
            <>
              The saved analysis{' '}
              <span className="text-ink font-semibold">&ldquo;{pendingDelete.title}&rdquo;</span> will be
              permanently removed. This can't be undone.
            </>
          }
          confirmLabel="Delete chat"
          onConfirm={confirmDelete}
          onClose={() => setPendingDelete(null)}
        />
      )}
    </>
  )
}
