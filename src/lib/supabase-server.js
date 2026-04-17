import { createClient } from '@supabase/supabase-js';

let _client = null;

export function getSupabaseServer() {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error(`Supabase env vars missing: url=${!!url} key=${!!key}`);
  _client = createClient(url, key);
  return _client;
}

export const supabaseServer = getSupabaseServer();
