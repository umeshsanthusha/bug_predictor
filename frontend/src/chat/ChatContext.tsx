import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import * as api from '../api'
import { useAuth } from '../auth/AuthContext'
import type { ChatSummary, PredictResponse } from '../types'

/** Pinned first, then newest-first. */
function sortChats(chats: ChatSummary[]): ChatSummary[] {
  return [...chats].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    if (a.created_at !== b.created_at) return a.created_at < b.created_at ? 1 : -1
    return 0
  })
}

interface ChatContextValue {
  chats: ChatSummary[]
  refresh: () => Promise<void>
  togglePin: (chat: ChatSummary) => Promise<void>
  deleteChat: (chat: ChatSummary) => Promise<boolean>
  saveChat: (title: string, model: string, payload: PredictResponse) => Promise<ChatSummary | null>
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function useChats(): ChatContextValue {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChats must be used inside <ChatProvider>')
  return ctx
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const [chats, setChats] = useState<ChatSummary[]>([])

  const refresh = useCallback(async () => {
    try {
      setChats(sortChats(await api.fetchChats()))
    } catch {
      // list load failures are non-fatal; the sidebar just stays empty
    }
  }, [])

  // Load chats once signed in; clear them on sign out
  useEffect(() => {
    if (status === 'authed') {
      refresh()
    } else if (status === 'anon') {
      setChats([])
    }
  }, [status, refresh])

  const togglePin = useCallback(async (chat: ChatSummary) => {
    // Optimistic flip, then reconcile with the server's answer
    setChats((prev) =>
      sortChats(prev.map((c) => (c.id === chat.id ? { ...c, pinned: !c.pinned } : c))),
    )
    try {
      const updated = await api.setChatPinned(chat.id, !chat.pinned)
      setChats((prev) => sortChats(prev.map((c) => (c.id === updated.id ? updated : c))))
    } catch {
      refresh()
    }
  }, [refresh])

  const deleteChat = useCallback(
    async (chat: ChatSummary) => {
      // Optimistic removal; restore the previous list if the server rejects it
      let snapshot: ChatSummary[] = []
      setChats((prev) => {
        snapshot = prev
        return prev.filter((c) => c.id !== chat.id)
      })
      try {
        await api.deleteChat(chat.id)
        return true
      } catch {
        setChats(snapshot)
        return false
      }
    },
    [],
  )

  const saveChat = useCallback(
    async (title: string, model: string, payload: PredictResponse) => {
      try {
        const created = await api.createChat(title, model, payload)
        setChats((prev) => sortChats([created, ...prev]))
        return created
      } catch {
        // saving is best-effort; the prediction result itself is already shown
        return null
      }
    },
    [],
  )

  return (
    <ChatContext.Provider value={{ chats, refresh, togglePin, deleteChat, saveChat }}>
      {children}
    </ChatContext.Provider>
  )
}
