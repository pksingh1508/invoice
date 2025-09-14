import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

// Check if we're on the server side
function isServer() {
  return typeof window === 'undefined';
}

// Admin client creation function
function createSupabaseAdminClient() {
  if (!isServer()) {
    throw new Error('supabaseAdmin can only be used in server-side code (API routes, server components, etc.)');
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
  }
  
  if (!supabaseServiceRoleKey) {
    throw new Error('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Lazy initialization with proxy to avoid immediate execution
let _supabaseAdmin: ReturnType<typeof createSupabaseAdminClient> | null = null;

export const supabaseAdmin = new Proxy({} as ReturnType<typeof createSupabaseAdminClient>, {
  get(target, prop) {
    if (!_supabaseAdmin) {
      _supabaseAdmin = createSupabaseAdminClient();
    }
    return (_supabaseAdmin as any)[prop];
  }
});

// Export as default for convenience
export default supabaseAdmin;