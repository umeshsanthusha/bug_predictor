import { createClient } from '@supabase/supabase-js'

/**
 * Single Supabase client for auth + PostgREST (profiles, chats).
 * The publishable anon key is safe in the browser — every table is guarded
 * by row level security, and the Flask API verifies the same access tokens.
 */
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)
