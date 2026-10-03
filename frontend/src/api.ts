import type {
  Chat,
  ChatSummary,
  ModelsResponse,
  PredictResponse,
  User,
} from './types'
import { supabase } from './supabase'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

/** Fired whenever the Flask API rejects our access token — the auth layer signs out. */
export const UNAUTHORIZED_EVENT = 'cbs-unauthorized'

/** True while a password-recovery session (link with type=recovery) is being processed. */
export const isRecoveryLink = window.location.hash.includes('type=recovery')

/** Recovery code picked up from a hashed invite link, consumed by exchangeRecoveryCode(). */
let pendingRecoveryCode: string | null = null
export function setRecoveryCode(code: string) {
  pendingRecoveryCode = code
}
export function hasRecoveryCode(): boolean {
  return pendingRecoveryCode !== null
}

async function errorFrom(res: Response, fallback: string): Promise<Error> {
  if (res.status === 401) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
  const body = await res.json().catch(() => ({}))
  return new Error(body.error ?? `${fallback} (${res.status})`)
}

/** Authorization header carrying the current Supabase access token (client auto-refreshes). */
async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Your session has expired. Please sign in again.')
  return { Authorization: `Bearer ${token}` }
}

function messageOf(err: { message?: string }, fallback: string): string {
  const msg = (err.message ?? '').toLowerCase()
  if (msg.includes('invalid login credentials')) return 'Incorrect email or password.'
  if (msg.includes('already registered') || msg.includes('already exists'))
    return 'An account with this email already exists.'
  return err.message ?? fallback
}

/* ── Session helpers ─────────────────────────────────────────── */

async function buildUser(): Promise<User | null> {
  const { data: sessionData } = await supabase.auth.getSession()
  const authUser = sessionData.session?.user
  if (!authUser) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, created_at')
    .eq('id', authUser.id)
    .maybeSingle()
  return {
    id: authUser.id,
    name: (authUser.user_metadata?.name as string | undefined) ?? profile?.name ?? splitPart(authUser.email ?? ''),
    email: authUser.email ?? '',
    created_at: profile?.created_at,
  }
}

function splitPart(email: string): string {
  return email.split('@')[0] || 'Anonymous'
}

/** The signed-in user's profile, or null when anonymous. */
export async function fetchMe(): Promise<User | null> {
  return buildUser()
}

/* ── Sign in / up / out ──────────────────────────────────────── */

export type AuthResult = { user: User } | { pendingEmailConfirm: true }

/** Sign in with email + password. */
export async function login(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(messageOf(error, 'Sign in failed'))
  const user = await buildUser()
  if (!user) throw new Error('Signed in but no session was returned.')
  void data
  return { user }
}

/** Create an account. Auto sign-in unless the project requires email confirmation. */
export async function register(name: string, email: string, password: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  })
  if (error) throw new Error(messageOf(error, 'Registration failed'))
  if (!data.session) return { pendingEmailConfirm: true }
  const user = await buildUser()
  if (!user) throw new Error('Signed up but no session was returned.')
  return { user }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}

/* ── Profile & security ──────────────────────────────────────── */

/** Update the signed-in user's name (profile row + metadata) and/or email (re-auth). */
export async function updateProfile(patch: { name?: string; email?: string }): Promise<User> {
  const { data: sessionData } = await supabase.auth.getSession()
  const authUser = sessionData.session?.user
  if (!authUser?.id) throw new Error('You are not signed in.')

  let email = authUser.email ?? ''
  if (patch.email && patch.email !== email) {
    const { data, error } = await supabase.auth.updateUser({ email: patch.email })
    if (error) throw new Error(messageOf(error, 'Failed to change email'))
    email = data.user?.email ?? email
  }

  const name = patch.name?.trim()
  const { error } = await supabase
    .from('profiles')
    .update({ name: name ?? undefined, email })
    .eq('id', authUser.id)
  if (error) throw new Error(error.message || 'Failed to save profile')

  if (name) {
    // Keep auth metadata in sync so buildUser() sees the new name immediately.
    await supabase.auth.updateUser({ data: { name } })
  }
  const user = await buildUser()
  if (!user) throw new Error('You are not signed in.')
  return user
}

/**
 * Change the password. Note: Supabase does not re-verify the current password
 * here — the UI still asks for it, but the server-side check is the re-auth
 * recency window built into Supabase.
 */
export async function changePassword(_current: string, next: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: next })
  if (error) throw new Error(messageOf(error, 'Failed to update password'))
}

/**
 * Send a password-reset email. The link lands on the app root with a hashed
 * recovery token (type=recovery); AuthContext picks it up automatically.
 */
export async function forgotPassword(
  email: string,
): Promise<{ message: string; demoResetUrl: string | null }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (error) throw new Error(messageOf(error, 'Failed to start password reset'))
  return {
    message: 'If an account exists for that email, a reset link has been sent. Check your inbox.',
    demoResetUrl: null,
  }
}

/** Complete a password reset using the recovery session created from the link. */
export async function resetPassword(_token: string, newPassword: string): Promise<void> {
  if (pendingRecoveryCode) {
    const { error } = await supabase.auth.exchangeCodeForSession(pendingRecoveryCode)
    if (error) throw new Error('This reset link is invalid or has expired. Please request a new one.')
    pendingRecoveryCode = null
  }
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) {
    throw new Error('This reset link is invalid or has expired. Please request a new one.')
  }
}

/** Permanently delete the signed-in user's account and all saved analyses. */
export async function deleteAccount(): Promise<void> {
  const { error } = await supabase.rpc('delete_account')
  if (error) throw new Error(error.message || 'Failed to delete account')
}

/* ── Flask ML API (protected with the Supabase access token) ─── */

/** Fetch the list of available ML models from the backend. */
export async function fetchModels(): Promise<ModelsResponse> {
  const res = await fetch(`${API_BASE}/api/models`, { headers: await authHeader() })
  if (!res.ok) throw await errorFrom(res, 'Failed to load models')
  return res.json()
}

/** Upload two source files plus the selected model and get predictions. */
export async function predict(
  file1: File,
  file2: File,
  modelKey: string,
): Promise<PredictResponse> {
  const form = new FormData()
  form.append('file1', file1)
  form.append('file2', file2)
  form.append('model', modelKey)

  const res = await fetch(`${API_BASE}/api/predict`, {
    method: 'POST',
    headers: await authHeader(),
    body: form,
  })
  if (!res.ok) throw await errorFrom(res, 'Prediction failed')
  return res.json()
}

/* ── Chats (Supabase Postgres via PostgREST, RLS-scoped) ─────── */

interface ChatRow {
  id: number
  title: string
  model: string
  pinned: boolean
  created_at: string
  payload?: unknown
}

function toSummary(row: ChatRow): ChatSummary {
  const files =
    row.payload && typeof row.payload === 'object' && 'files' in row.payload
      ? ((row.payload as { files?: unknown[] }).files ?? [])
      : []
  return {
    id: String(row.id),
    title: row.title,
    model: row.model,
    pinned: row.pinned,
    created_at: row.created_at,
    buggy_files: files.filter((f) => (f as { prediction?: number }).prediction === 1).length,
    total_files: files.length,
  }
}

const CHAT_COLUMNS = 'id, title, model, pinned, created_at'

/** List the signed-in user's saved analysis chats. */
export async function fetchChats(): Promise<ChatSummary[]> {
  const { data, error } = await supabase
    .from('chats')
    .select(CHAT_COLUMNS)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message || 'Failed to load chats')
  return (data ?? []).map((r) => toSummary(r as ChatRow))
}

/** Save a new chat (analysis session) for the signed-in user. */
export async function createChat(
  title: string,
  model: string,
  payload: PredictResponse,
): Promise<ChatSummary> {
  const { data, error } = await supabase
    .from('chats')
    .insert({ title: title.slice(0, 120), model, payload })
    .select(CHAT_COLUMNS)
    .single()
  if (error) throw new Error(error.message || 'Failed to save chat')
  return toSummary({ ...(data as ChatRow), payload })
}

/** Fetch one chat with its full stored prediction payload. */
export async function fetchChat(id: string): Promise<Chat> {
  const { data, error } = await supabase
    .from('chats')
    .select(`${CHAT_COLUMNS}, payload`)
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message || 'Failed to load chat')
  if (!data) throw new Error('Chat not found.')
  const summary = toSummary(data as ChatRow)
  return { ...summary, payload: (data as ChatRow).payload as Chat['payload'] }
}

/** Permanently delete one of the user's saved chats. */
export async function deleteChat(id: string): Promise<void> {
  const { error } = await supabase.from('chats').delete().eq('id', id)
  if (error) throw new Error(error.message || 'Failed to delete chat')
}

/** Pin or unpin a chat. */
export async function setChatPinned(id: string, pinned: boolean): Promise<ChatSummary> {
  const { data, error } = await supabase
    .from('chats')
    .update({ pinned })
    .eq('id', id)
    .select(CHAT_COLUMNS)
    .single()
  if (error) throw new Error(error.message || 'Failed to update chat')
  return toSummary(data as ChatRow)
}
