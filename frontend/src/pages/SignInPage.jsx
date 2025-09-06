// src/pages/SignInPage.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

// [!MODIFIED!] - Updated to also fetch and cache the username
async function ensureProfileAndCache() {
  const { data: { user } } = await supabase.auth.getUser();
  const authId = user?.id;
  if (!authId) return null;

  // This part is fine, it ensures a profile exists
  await supabase.from("profiles").upsert({ user_id: authId }, { onConflict: "user_id" });

  const { data: prof } = await supabase
    .from("profiles")
    // Added 'username' to the selection
    .select("user_id, username, first_name, last_name, avatar_url, onboarding_complete, is_admin")
    .eq("user_id", authId)
    .single();

  const cache = {
    id: authId,
    user_id: authId,
    username: prof?.username || null, // Added username to the cache
    first_name: prof?.first_name || null,
    last_name: prof?.last_name || null,
    avatar_url: prof?.avatar_url || null,
    onboarding_complete: !!prof?.onboarding_complete,
    is_admin: !!prof?.is_admin,
  };
  localStorage.setItem("myanmatch_user", JSON.stringify(cache));

  return prof;
}

/* --- Pretty toast (kept) --- */
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

export default function SignInPage() {
  const navigate = useNavigate();

  // [!MODIFIED!] - Changed from `email` to `username`
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // toast
  const [toastOpen, setToastOpen] = useState(false);
  const [toastType, setToastType] = useState("error");
  const [toastText, setToastText] = useState("");
  function showToast(text, type = "error") {
    setToastText(text);
    setToastType(type);
    setToastOpen(true);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToastOpen(false), 2200);
  }

  // This useEffect correctly routes the user after a session is established. No changes needed here.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, session) => {
      if (session?.user) {
        try {
          const { data: prof } = await supabase
            .from("profiles")
            .select("onboarding_complete, is_admin")
            .eq("user_id", session.user.id)
            .single();

          if (prof?.is_admin) return navigate("/admin", { replace: true });
          if (prof?.onboarding_complete) return navigate("/HomePage", { replace: true });
          return navigate("/onboarding/terms", { replace: true });
        } catch {
          return navigate("/onboarding/terms", { replace: true });
        }
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  // [!REPLACED!] - The entire sign-in function is updated for the username flow.
  async function handleUsernameSignIn(e) {
    e.preventDefault();
    setErr("");

    // 1. Validate inputs
    if (!username || username.trim() === "") {
      const m = "Please enter your username.";
      setErr(m); showToast(m, "error"); return;
    }
    if (!password) {
      const m = "Please enter your password.";
      setErr(m); showToast(m, "error"); return;
    }

    setLoading(true);

    // 2. Convert the entered username into the dummy email format
    const dummyEmail = `${username.toLowerCase().trim()}@myanmatch.user`;

    // 3. Sign in using the dummy email and password
    const { error } = await supabase.auth.signInWithPassword({
      email: dummyEmail,
      password: password,
    });

    if (error) {
      // Use a generic error to prevent telling attackers if a username is valid or not
      const m = "Invalid username or password.";
      setErr(m);
      showToast(m, "error");
      setLoading(false);
      return;
    }

    // 4. On success, create the local user cache and navigate
    const prof = await ensureProfileAndCache();

    if (prof?.is_admin) navigate("/admin", { replace: true });
    else if (prof?.onboarding_complete) navigate("/HomePage", { replace: true });
    else navigate("/onboarding/terms", { replace: true });

    setLoading(false);
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col justify-center items-center relative"
      style={{
        background: `url('/images/myanmatch-bg.jpg') center center/cover no-repeat`,
        backgroundColor: "#21101e",
      }}
    >
      <div className="absolute inset-0 bg-black/40 z-0" />
      <div className="relative z-10 w-full max-w-sm mx-auto rounded-3xl bg-white/90 px-7 py-10 flex flex-col items-center shadow-2xl">
        <h2 className="text-2xl font-extrabold text-[#893086] text-center">Sign in to MyanMatch</h2>
        <p className="text-base font-medium text-gray-700 mb-6 text-center">အကောင့်ဝင်မည်</p>

        {/* [!MODIFIED!] - Form now calls `handleUsernameSignIn` */}
        <form onSubmit={handleUsernameSignIn} className="w-full">
          {/* [!MODIFIED!] - This is now the Username input */}
          <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
          <input
            type="text"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#893086] text-lg bg-white"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <label className="block text-sm font-medium text-gray-700 mt-4 mb-2">
            Password <span className="text-gray-400">(ပက်စဝေါ့)</span>
          </label>
          <input
            type="password"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#893086] text-lg bg-white"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            className={`w-full mt-5 py-3 rounded-full bg-black text-white text-lg font-semibold ${
              loading ? "opacity-60" : "hover:bg-gray-900"
            }`}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in (အကောင့်ဝင်)"}
          </button>
        </form>

        {err && <div className="text-red-500 text-center mt-3">{err}</div>}

        <div className="mt-3 text-center text-base">
          <span className="text-gray-600">New to MyanMatch?</span>{" "}
          <span
            onClick={() => navigate("/SignUpPage")}
            className="text-[#893086] font-medium underline hover:text-[#a16bbf] cursor-pointer"
          >
            Create account
          </span>
        </div>

        <MMToast open={toastOpen} type={toastType} text={toastText} onClose={() => setToastOpen(false)} />
      </div>
    </div>
  );
}