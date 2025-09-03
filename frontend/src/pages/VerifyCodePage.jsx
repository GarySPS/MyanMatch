import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

/* --- tiny toast --- */
function MMToast({ open, type = "error", text = "", onClose }) {
  if (!open) return null;
  const isErr = type === "error";
  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[80] bottom-[calc(env(safe-area-inset-bottom)+110px)]"
      role="status"
      aria-live="polite"
      onClick={onClose}
    >
      <div
        className={`px-4 py-3 rounded-2xl shadow-2xl border ${
          isErr
            ? "bg-gradient-to-tr from-red-500 to-red-700 text-white border-white/20"
            : "bg-gradient-to-tr from-emerald-500 to-emerald-600 text-white border-white/20"
        }`}
      >
        <div className="font-semibold text-sm">{text}</div>
      </div>
    </div>
  );
}

// REPLACE THIS ENTIRE FUNCTION

async function ensureProfileAndCache() {
  const { data: { user } } = await supabase.auth.getUser();
  const authId = user?.id;
  if (!authId) return null;

  await supabase
    .from("profiles")
    .upsert({ user_id: authId }, { onConflict: "user_id" });

  const { data: prof } = await supabase
    .from("profiles")
    .select("user_id, first_name, last_name, avatar_url, onboarding_complete, is_admin")
    .eq("user_id", authId)
    .single();

  const cache = {
    id: authId,
    user_id: authId,
    first_name: prof?.first_name || null,
    last_name: prof?.last_name || null,
    avatar_url: prof?.avatar_url || null,
    onboarding_complete: !!prof?.onboarding_complete,
    is_admin: !!prof?.is_admin,
    verified: !!user.email_confirmed_at, // [!FIX!] Add the user's verification status
  };
  localStorage.setItem("myanmatch_user", JSON.stringify(cache));

  return prof;
}

export default function VerifyCodePage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const email = state?.email || "";

  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(0);
  const [toast, setToast] = useState({ open: false, type: "success", text: "" });

useEffect(() => {
  let didNav = false;

// REPLACE THIS ENTIRE FUNCTION INSIDE YOUR useEffect HOOK

const routeFromProfile = async (uid) => {
  if (!uid || didNav) return;
  didNav = true;

  // First, ensure the profile row exists.
  await supabase.from("profiles").upsert({ user_id: uid }, { onConflict: "user_id" });

  // Second, fetch the full profile to get all necessary details.
  const { data: user } = await supabase.auth.getUser(); // Get user for verification status
  const { data: prof } = await supabase
    .from("profiles")
    .select("user_id, first_name, last_name, avatar_url, onboarding_complete, is_admin")
    .eq("user_id", uid)
    .single();

  // Third, create a complete cache object in localStorage. THIS IS THE CRITICAL FIX.
  const cache = {
    id: uid,
    user_id: uid,
    first_name: prof?.first_name || null,
    last_name: prof?.last_name || null,
    avatar_url: prof?.avatar_url || null,
    onboarding_complete: !!prof?.onboarding_complete,
    is_admin: !!prof?.is_admin,
    verified: !!user?.user?.email_confirmed_at, // Add the verification status
  };
  localStorage.setItem("myanmatch_user", JSON.stringify(cache));

  // Finally, navigate based on the fetched profile data.
  if (prof?.is_admin) { navigate("/admin", { replace: true }); return; }
  if (prof?.onboarding_complete) { navigate("/HomePage", { replace: true }); return; }
  navigate("/onboarding/terms", { replace: true });
};

  // If a session already exists (e.g., user came from the email link), route now.
  (async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) await routeFromProfile(session.user.id);
  })();

  // Also route on auth events after clicking the email link.
  const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (!session?.user?.id) return;
    if (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") {
      await routeFromProfile(session.user.id);
    }
  });

  return () => sub?.subscription?.unsubscribe?.();
}, [navigate]);

  // simple countdown for resend
  useEffect(() => {
    if (timer > 0) {
      const id = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(id);
    }
  }, [timer]);

  const resendLink = async () => {
    if (!email) return;
    setResending(true);
    setTimer(30);
    try {
      await supabase.auth.resend({ type: "signup", email });
      setToast({ open: true, type: "success", text: "Confirmation link sent again." });
    } catch (e) {
      setToast({ open: true, type: "error", text: e?.message || "Failed to resend." });
    } finally {
      setTimeout(() => setToast((t) => ({ ...t, open: false })), 2200);
      setResending(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col justify-center items-center relative"
      style={{
        background: `url('/images/myanmatch-bg.jpg') center center/cover no-repeat`,
        backgroundColor: "#21101e",
      }}
    >
      <div className="absolute inset-0 bg-black/40 z-0" />
      <div className="relative z-10 w-full max-w-sm mx-auto rounded-[2.2rem] bg-white/85 backdrop-blur px-9 py-12 flex flex-col items-center shadow-2xl border border-white/30">
        <h2 className="text-2xl font-extrabold text-[#893086] text-center mb-2">
          Check your email
        </h2>
        <p className="text-center text-gray-700 mb-6">
          We sent a <span className="font-semibold">confirmation link</span> to<br />
          <span className="font-bold">{email || "your email"}</span>
        </p>

        <div className="text-sm text-gray-600 space-y-2 mb-8 text-center">
          <p>Open the email and tap the link to confirm.</p>
          <p>After confirming, you’ll return here automatically.</p>
        </div>

        <button
          onClick={timer === 0 && !resending ? resendLink : undefined}
          className={`w-full py-3 rounded-full bg-[#893086] text-white text-lg font-bold transition ${
            timer === 0 && !resending ? "hover:bg-[#a16bbf]" : "opacity-50 cursor-not-allowed"
          }`}
        >
          {resending ? "Resending..." : timer > 0 ? `Resend link (${timer}s)` : "Resend link"}
        </button>

        <button
          onClick={() => navigate("/SignInPage")}
          className="mt-3 text-[#893086] underline font-medium"
        >
          Use a different email
        </button>
      </div>

      <MMToast
        open={toast.open}
        type={toast.type}
        text={toast.text}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </div>
  );
}
