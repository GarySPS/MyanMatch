// src/lib/api.js
import { supabase } from "../supabaseClient";

export async function api(path, { method = "GET", headers = {}, body } = {}) {
  // get current Supabase session
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || "";

  return fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body
      ? { body: typeof body === "string" ? body : JSON.stringify(body) }
      : {}),
  });
}
