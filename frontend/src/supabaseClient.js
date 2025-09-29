// src/supabaseClient.js

import { createClient } from "@supabase/supabase-js";
import "cross-fetch/polyfill";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// This custom fetch function is the fix for the network error.
const customFetch = (input, init) => {
    return fetch(input, { ...init, cache: "no-store" });
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
  },
  // This tells Supabase to use our more stable network method.
  global: {
    fetch: customFetch,
  },
});