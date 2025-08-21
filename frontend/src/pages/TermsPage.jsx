// src/pages/TermsPage.jsx
 import { useNavigate } from "react-router-dom";
 import { useOnboarding } from "../context/OnboardingContext";
 import { useState, useMemo } from "react";
 import { supabase } from "../supabaseClient";

function getLocalUser() {
  try { return JSON.parse(localStorage.getItem("myanmatch_user") || "{}"); }
  catch { return {}; }
}

export default function TermsPage() {
  const navigate = useNavigate();
  const { setProfileData } = useOnboarding();
  const local = useMemo(() => getLocalUser(), []);
  const uid = local.user_id || local.id || null;
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onAgree() {
    if (!uid) return navigate("/login");
    setBusy(true); setErr("");

    // save acceptance in profiles table
    const { error } = await supabase
      .from("profiles")
      .upsert({
        user_id: uid,
        onboarding_accepted_at: new Date().toISOString(),
      }, { onConflict: "user_id" })
      .select("user_id")
      .single();

    if (error) {
      setErr(error.message);
      setBusy(false);
      return;
    }

    navigate("/onboarding/language");
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center px-6 py-10">
      {/* background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#3a0224] via-[#2a0018] to-[#190011]" />

      <div className="relative w-full max-w-md text-white">
        <h1 className="text-3xl font-extrabold tracking-tight mb-6">
          Terms of Service
        </h1>

        <ul className="list-disc list-inside space-y-2 mb-8 text-white/90">
          <li>You must be at least 18 years old to use MyanMatch.</li>
          <li>Do not use MyanMatch for any illegal activity.</li>
          <li>Respect other users and do not harass or spam.</li>
          <li>We may remove accounts that break the rules.</li>
        </ul>

        <p className="text-white/70 mb-10">
          We may update these terms at any time. Please check back regularly.
        </p>

        {err && (
          <div className="mb-4 text-red-400 text-sm">{err}</div>
        )}

        <button
          onClick={onAgree}
          disabled={busy}
          className="w-full rounded-full py-4 text-lg font-semibold
                     bg-gradient-to-r from-pink-500 to-purple-500 shadow disabled:opacity-50"
        >
          {busy ? "Saving…" : "Agree"}
        </button>
      </div>
    </div>
  );
}
