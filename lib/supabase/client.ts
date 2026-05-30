import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
let browserClient: SupabaseClient | null = null;

export const hasSupabaseEnv =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export function assertSupabaseEnv() {
  if (!hasSupabaseEnv) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
}

export function getSupabaseClient() {
  assertSupabaseEnv();
  if (!browserClient) {
    browserClient = createClient(supabaseUrl!, supabaseAnonKey!);
  }
  return browserClient;
}
