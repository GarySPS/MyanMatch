import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useI18n } from "../../i18n";

const LANGS = [
  { key: "en", label: "English", flag: "🇺🇸", sub: "English" },
  { key: "my", label: "မြန်မာ",  flag: "🇲🇲", sub: "မြန်မာ" },
];

function getLocalUser() {
  try { return JSON.parse(localStorage.getItem("myanmatch_user") || "{}"); }
  catch { return {}; }
}

export default function LanguageOnboarding() {
  const navigate = useNavigate();
  const { setLang } = useI18n();
  const local = useMemo(() => getLocalUser(), []);
  const uid = local.user_id || local.id || null;

  const [current, setCurrent] = useState("en");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      if (!uid) return;
      const { data: prof } = await supabase
        .from("profiles")
        .select("language")
        .or(`user_id.eq."${uid}",id.eq."${uid}"`)
        .maybeSingle();
      setCurrent(prof?.language || localStorage.getItem("myanmatch_lang") || "en");
    })();
  }, [uid]);

  async function choose(lang) {
    if (busy) return;
    setBusy(true); setMsg("");
    try {
      if (uid) {
        const { error } = await supabase
          .from("profiles")
          .update({ language: lang })
          .or(`user_id.eq."${uid}",id.eq."${uid}"`);
        if (error) throw error;
      }
      localStorage.setItem("myanmatch_lang", lang);
      try {
        const u = getLocalUser(); u.language = lang;
        localStorage.setItem("myanmatch_user", JSON.stringify(u));
      } catch {}
      setLang(lang);
      setCurrent(lang);
      // continue onboarding
      navigate("/onboarding/name", { replace: true });
    } catch (e) {
      setMsg(e.message || "Failed to update language.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10 relative z-10">
      {/* Card (same style as NamePage) */}
      <div className="bg-white rounded-3xl shadow-lg max-w-md w-full p-8">

        {/* Progress dots — step 2 active (after Terms) */}
        <div className="flex items-center justify-center mb-7">
          <div className="w-2 h-2 mx-1 rounded-full bg-gray-300" />
          <div className="w-3 h-3 rounded-full border-2 border-gray-800" />
          <div className="w-2 h-2 mx-1 rounded-full bg-gray-300" />
          <div className="w-2 h-2 mx-1 rounded-full bg-gray-300" />
        </div>

        <h1 className="text-2xl font-bold mb-6 text-gray-900 text-center">
          Choose your language <br/>
          အသုံးပြုလိုသောဘာသာစကားရွေးချယ်ပါ
        </h1>

        <div className="grid gap-4">
          {LANGS.map((l) => {
            const active = current === l.key;
            return (
              <button
                key={l.key}
                type="button"
                disabled={busy}
                onClick={() => choose(l.key)}
                className={`flex items-center justify-between w-full rounded-2xl border px-4 py-4 transition
                  ${active ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:bg-gray-50"}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{l.flag}</span>
                  <div className="text-left">
                    <div className="text-[15px] font-semibold whitespace-nowrap leading-6">{l.label}</div>
                    <div className="text-[12px] text-gray-500 whitespace-nowrap">{l.sub}</div>
                  </div>
                </div>
                <span className="text-sm text-gray-600">{active ? "Selected" : "Choose"}</span>
              </button>
            );
          })}
        </div>

        {msg && (
          <div className="mt-4 text-sm text-red-600">{msg}</div>
        )}
      </div>
    </div>
  );
}
