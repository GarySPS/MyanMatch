// src/pages/Language.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useI18n } from "../i18n";

/** ----- UI options ----- */
const LANGS = [
  { key: "en", label: "English", flag: "🇺🇸" },
  { key: "my", label: "Myanmar", flag: "🇲🇲" },
];

/** ----- Helpers ----- */
function getLocalUser() {
  try { return JSON.parse(localStorage.getItem("myanmatch_user") || "{}"); }
  catch { return {}; }
}

/**
 * Get the authenticated user id from your backend sign-up auth.
 * Adjust the URL if your backend exposes a different endpoint.
 * This assumes a session cookie / token is already set.
 */
async function getAuthUserIdFromBackend() {
  try {
    // Try common endpoints — change to your own if different:
    let resp = await fetch("/api/me", { credentials: "include" });
    if (!resp.ok) {
      // fallback shape
      resp = await fetch("/api/auth/me", { credentials: "include" });
    }
    if (resp.ok) {
      const data = await resp.json();
      // accept id or user_id fields
      return data?.user_id || data?.id || null;
    }
  } catch {}
  return null;
}

export default function Language() {
  const navigate = useNavigate();
  const { setLang } = useI18n();

  // state
  const [uid, setUid] = useState(null);
  const [current, setCurrent] = useState("en");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  // get uid from backend auth (primary), fallback to local cache
  useEffect(() => {
    (async () => {
      const backendUid = await getAuthUserIdFromBackend();
      if (backendUid) {
        setUid(backendUid);
      } else {
        const local = getLocalUser();
        const fallback = local.user_id || local.id || null;
        setUid(fallback);
      }
    })();
  }, []);

  // load current language from DB (or from localStorage if no uid)
  useEffect(() => {
    (async () => {
      try {
        if (uid) {
          const { data: prof, error } = await supabase
            .from("profiles")
            .select("language")
            .or(`user_id.eq."${uid}",id.eq."${uid}"`)
            .maybeSingle();
          if (error) throw error;
          setCurrent(prof?.language || localStorage.getItem("myanmatch_lang") || "en");
        } else {
          // no uid: fall back to local preference
          setCurrent(localStorage.getItem("myanmatch_lang") || "en");
        }
      } catch {
        setCurrent(localStorage.getItem("myanmatch_lang") || "en");
      } finally {
        setLoading(false);
      }
    })();
  }, [uid]);

  async function choose(lang) {
    if (busy) return;
    setBusy(true); setMsg("");

    try {
      // If we have a real uid from backend auth, persist to DB
      if (uid) {
        const { error } = await supabase
          .from("profiles")
          .update({ language: lang })
          .or(`user_id.eq."${uid}",id.eq."${uid}"`);
        if (error) throw error;
      }

      // keep local caches + live i18n in sync
      localStorage.setItem("myanmatch_lang", lang);
      try {
        const l = getLocalUser();
        l.language = lang;
        localStorage.setItem("myanmatch_user", JSON.stringify(l));
      } catch {}
      setLang(lang);
      setCurrent(lang);

      setMsg("✅ Language updated.");
    } catch (e) {
      setMsg(e.message || "Failed to update language.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-dvh w-full text-white">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#201033] via-[#120f1f] to-[#0a0a12]" />
        <div className="absolute -top-24 -left-28 w-[22rem] h-[22rem] rounded-full bg-fuchsia-500/25 blur-[110px]" />
        <div className="absolute -bottom-32 -right-24 w-[24rem] h-[24rem] rounded-full bg-violet-500/25 blur-[120px]" />
      </div>

      <header className="sticky top-0 z-20 bg-white/5 backdrop-blur border-b border-white/10">
        <div className="px-4 h-[56px] flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="px-3 py-1.5 rounded-full hover:bg-white/10" type="button">←</button>
          <h1 className="text-lg font-extrabold tracking-tight">Language</h1>
        </div>
      </header>

      <main className="px-4 py-6">
        <div className="max-w-md mx-auto grid gap-4">
          {loading ? (
            <div className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-sm">
              Loading…
            </div>
          ) : (
            LANGS.map(l => {
              const active = current === l.key;
              return (
                <button
                  key={l.key}
                  type="button"
                  disabled={busy}
                  onClick={() => choose(l.key)}
                  className={`w-full flex items-center gap-3 rounded-2xl px-4 py-4 border transition
                    ${active ? "border-[#FFD84D] bg-[#FFD84D]/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                >
                  <span className="text-2xl">{l.flag}</span>
                  <div className="flex-1 text-left">
                    <div className="text-[15px] font-bold">{l.label}</div>
                    <div className="text-[12px] text-white/60">
                      {l.key === "en" ? "English" : "မြန်မာ"}
                    </div>
                  </div>
                  <span className="text-sm text-white/70">{active ? "Selected" : "Choose"}</span>
                </button>
              );
            })
          )}

          {msg && (
            <div className="mt-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-sm">
              {msg}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
