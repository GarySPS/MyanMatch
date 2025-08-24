// src/lib/swaps.js
import { supabase } from "../supabaseClient";

export function dailyLimitFor(plan) {
  const p = String(plan || "free").toLowerCase();
  if (p === "x") return Infinity;
  if (p === "plus") return 40;
  return 15; // free
}

/** Start + end of "today" in UTC */
export function todayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { from: start.toISOString(), to: end.toISOString() };
}

/**
 * Check if user can still swap today.
 * Returns { ok, used, limit, remaining }
 */
export async function canSwapToday(userId, plan) {
  const limit = dailyLimitFor(plan);
  if (!isFinite(limit)) {
    return { ok: true, used: 0, limit, remaining: Infinity };
  }

  const { from, to } = todayRange();
  const { count, error } = await supabase
    .from("swaps")
    .select("id", { count: "exact", head: true })
    .eq("from_user_id", userId)
    .gte("created_at", from)
    .lt("created_at", to);

  const used = error ? 0 : (count ?? 0);
  const remaining = Math.max(0, limit - used);
  return { ok: used < limit, used, limit, remaining };
}

/**
 * Log one swap into DB.
 * action = "like" | "pass" | "gift" | etc.
 */
export async function logSwap({ fromUserId, toUserId, action }) {
  return supabase.from("swaps").insert({
    from_user_id: fromUserId,
    to_user_id: toUserId,
    action: action || "like",
    created_at: new Date().toISOString(),
  });
}
