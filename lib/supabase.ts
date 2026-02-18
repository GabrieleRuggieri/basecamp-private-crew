/**
 * Client Supabase con Service Role Key.
 * Usato lato server per operazioni che bypassano RLS (es. upload, signed URLs).
 */
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
