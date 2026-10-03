import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchChat, setChatPinned } from '../api'
import { useChats } from '../chat/ChatContext'
import ConfirmDialog from '../components/ConfirmDialog'
import ResultCard from '../components/ResultCard'
import type { Chat } from '../types'

/** Postgres timestamptz arrives as ISO — render it in the viewer's locale. */
function formatDate(stamp: string): string {
  const d = new Date(stamp)
  return Number.isNaN(d.getTime()) ? stamp : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export default function ChatView() {
  const { chatId } = useParams()
  const { refresh, deleteChat } = useChats()
  const navigate = useNavigate()
  const [chat, setChat] = useState<Chat | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const id = chatId ?? ''

  useEffect(() => {
    if (!id) {
      setError('This chat link is invalid.')
      return
    }
    let active = true
    setError(null)
    setChat(null)
    fetchChat(id)
      .then((c) => active && setChat(c))
      .catch((err: Error) => active && setError(err.message || 'Failed to load chat.'))
    return () => {
      active = false
    }
  }, [id])

  // Close the delete dialog when switching chats
  useEffect(() => {
    setDeleteOpen(false)
  }, [id])

  const togglePin = async () => {
    if (!chat) return
    const next = !chat.pinned
    setChat({ ...chat, pinned: next })
    try {
      await setChatPinned(chat.id, next)
    } catch {
      // fall through to refresh, which restores the server truth
    }
    refresh()
  }

  const handleDelete = async () => {
    if (!chat) return
    setDeleteOpen(false)
    if (await deleteChat(chat)) navigate('/dashboard')
  }

  return (
    <div className="pb-16">
      {/* Page header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-accent mb-2 text-[0.65rem] tracking-[0.3em] uppercase">
            Saved analysis
          </p>
          <h1 className="font-display max-w-md text-2xl font-extrabold tracking-tight break-words uppercase sm:text-3xl">
            {chat?.title ?? 'Loading…'}
          </h1>
          {chat && (
            <p className="font-mono text-muted mt-2 text-[0.65rem]">{formatDate(chat.created_at)}</p>
          )}
        </div>
        {chat && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePin}
              className={`font-mono flex items-center gap-2 rounded-lg border px-3.5 py-2 text-[0.65rem] font-semibold tracking-[0.15em] uppercase transition-colors ${
                chat.pinned
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-line text-muted hover:border-accent/60 hover:text-ink'
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill={chat.pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 17v5M9 10.8V4h6v6.8l2.4 2.7H6.6L9 10.8z" />
              </svg>
              {chat.pinned ? 'Pinned' : 'Pin chat'}
            </button>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              aria-label="Delete this chat"
              className="font-mono border-line text-muted hover:border-accent-2/60 hover:text-accent-2 flex items-center gap-2 rounded-lg border px-3.5 py-2 text-[0.65rem] font-semibold tracking-[0.15em] uppercase transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 10v7M14 10v7" />
              </svg>
              Delete
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="border-accent-2/40 bg-accent-2/10 text-accent-2 rise-in rounded-xl border px-5 py-4 text-sm">
          {error}
        </div>
      )}

      {!chat && !error && (
        <p className="font-mono text-muted text-xs">
          Loading chat
          <span className="load-dot"> ·</span>
          <span className="load-dot"> ·</span>
          <span className="load-dot"> ·</span>
        </p>
      )}

      {chat && (
        <>
          <div className="text-muted mb-6 flex flex-wrap items-center justify-between gap-3 text-xs">
            <p>
              Model{' '}
              <span className="font-mono text-ink font-semibold">{chat.payload.model}</span> · test
              accuracy{' '}
              <span className="font-mono text-ink">{chat.payload.model_accuracy.toFixed(2)}%</span>
            </p>
            <p className="font-mono">
              <span className="text-accent-2 font-semibold">
                {chat.buggy_files}/{chat.total_files}
              </span>{' '}
              files flagged buggy
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {chat.payload.files.map((f) => (
              <ResultCard key={`${f.filename}-${f.language}`} result={f} />
            ))}
          </div>

          <div className="border-line mt-10 border-t pt-6">
            <Link
              to="/dashboard"
              className="font-mono text-accent text-xs font-semibold tracking-[0.15em] uppercase underline-offset-4 hover:underline"
            >
              + New chat
            </Link>
          </div>
        </>
      )}

      {/* Delete confirmation popup */}
      {chat && deleteOpen && (
        <ConfirmDialog
          title="Delete this chat?"
          message={
            <>
              The saved analysis{' '}
              <span className="text-ink font-semibold">&ldquo;{chat.title}&rdquo;</span> will be
              permanently removed. This can't be undone.
            </>
          }
          confirmLabel="Delete chat"
          onConfirm={handleDelete}
          onClose={() => setDeleteOpen(false)}
        />
      )}
    </div>
  )
}
