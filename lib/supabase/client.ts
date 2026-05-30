import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabaseKey = supabaseAnonKey ?? supabasePublishableKey;
let browserClient: SupabaseClient | null = null;

export const hasSupabaseEnv =
  Boolean(supabaseUrl) && Boolean(supabaseAnonKey || supabasePublishableKey);

export function assertSupabaseEnv() {
  if (!hasSupabaseEnv) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and either NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }
}

export function getSupabaseClient() {
  assertSupabaseEnv();
  browserClient ??= createClient(supabaseUrl!, supabaseKey!);
  return browserClient;
}
