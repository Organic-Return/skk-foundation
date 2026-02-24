import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _serverClient: SupabaseClient | null = null;

/**
 * Server-side Supabase client using service role key.
 * Bypasses RLS — use only in API routes / server components for trusted operations.
 */
export function getSupabaseServer(): SupabaseClient | null {
  if (_serverClient) return _serverClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.warn('Missing SUPABASE_SERVICE_ROLE_KEY — server-side lead operations unavailable.');
    return null;
  }

  _serverClient = createClient(url, serviceKey);
  return _serverClient;
}
