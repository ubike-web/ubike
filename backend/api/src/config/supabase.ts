import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as ws from 'ws';
import { env } from './env';

let _client: SupabaseClient;

export function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema: 'public' },
      realtime: { transport: ws as any },
    });
  }
  return _client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabaseClient() as any)[prop];
  },
});
