// src/pages/Onboarding/LanguageOnboarding.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useI18n } from "../../i18n";
import { useAuth } from "../../context/AuthContext";

const LANGS = [
  { key: "en", label: "English", flag: "🇺🇸", sub: "English" },
  { key: "my", label: "မြန်မာ",  flag: "🇲🇲", sub: "မြန်မာ" },
];

export default function LanguageOnboarding() {
  const navigate = useNavigate();
  const { setLang } = useI18n();
  const { user, profile, refreshProfile } = useAuth();
  const uid = user?.id;

  const [current, setCurrent] = useState("en");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    // Set the current language from the loaded profile, or fall back to localStorage/default
    const initialLang = profile?.language || localStorage.getItem("myanmatch_lang") || "en";
    setCurrent(initialLang);
  }, [profile]);

  async function choose(lang) {
    if (busy || !uid) return;
    setBusy(true); 
    setMsg("");
    try {
        const { error } = await supabase
          .from("profiles")
          .update({ language: lang })
          .eq("user_id", uid);

        if (error) throw error;
      
      // Update local state and context
      localStorage.setItem("myanmatch_lang", lang);
      setLang(lang);
      setCurrent(lang);
      
      // Refresh the central profile state to include the new language
      await refreshProfile();

      // Continue onboarding
      navigate("/onboarding/name", { replace: true });

    } catch (e) {
      console.error("Language update failed:", e);
      setMsg(e.message || "Failed to update language.");
    } finally {
      setBusy(false);
    }
  }
  
  // ----- SOLUTION: ADD THIS LOADING STATE -----
  // If the user or profile data is not yet loaded, show a loading screen.
  // This prevents the user from clicking buttons before `uid` is available.
  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10 relative z-10">
      {/* Card */}
      <div className="bg-white rounded-3xl shadow-lg max-w-md w-full p-8">

        {/* Progress dots */}
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