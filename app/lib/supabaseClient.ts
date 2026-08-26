import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
type AccessTokenProvider = () => Promise<string | null>;

let accessTokenProvider: AccessTokenProvider = async () => null;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes("your-project")
);

export function setSupabaseAccessTokenProvider(provider: AccessTokenProvider) {
  accessTokenProvider = provider;

  return () => {
    accessTokenProvider = async () => null;
  };
}

export function createSupabaseClient(provider: AccessTokenProvider) {
  if (!isSupabaseConfigured) return null;

  return createClient(supabaseUrl, supabaseAnonKey, {
    accessToken: provider,
  });
}

export const supabase = createSupabaseClient(() => accessTokenProvider());
