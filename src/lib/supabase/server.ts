import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

// Check if we're on the server side
function isServer() {
  return typeof window === 'undefined';
}

// Server-only client creation function
function createSupabaseServerClient() {
  if (!isServer()) {
    throw new Error('supabaseServer can only be used in server-side code (API routes, server components, etc.)');
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
  }
  
  if (!supabaseAnonKey) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Lazy initialization with proxy to avoid immediate execution
let _supabaseServer: ReturnType<typeof createSupabaseServerClient> | null = null;

export const supabaseServer = new Proxy({} as ReturnType<typeof createSupabaseServerClient>, {
  get(target, prop) {
    if (!_supabaseServer) {
      _supabaseServer = createSupabaseServerClient();
    }
    return (_supabaseServer as any)[prop];
  }
});

// Helper function to create a Supabase client with a user token
export const createServerClient = (accessToken: string) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
};

export default supabaseServer;
