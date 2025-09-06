// src/pages/SignUpPage.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

/* --- Pretty toast (optional) --- */
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

export default function SignUpPage() {
  const navigate = useNavigate();

  // [!MODIFIED!] - Changed from `email` to `username`
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

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
  
async function handleUsernameSignUp(e) {
  e.preventDefault();
  setErr("");

  // 1. Validate inputs for username and password
  if (!username || username.trim().length < 3) {
    const m = "Username must be at least 3 characters long.";
    setErr(m); showToast(m, "error"); return;
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    const m = "Username can only contain letters, numbers, and underscores.";
    setErr(m); showToast(m, "error"); return;
  }
  if (!password || password.length < 6) {
    const m = "Password must be at least 6 characters long.";
    setErr(m); showToast(m, "error"); return;
  }
  if (password !== confirm) {
    const m = "Passwords do not match.";
    setErr(m); showToast(m, "error"); return;
  }

  setLoading(true);

  // 2. Create a unique, dummy email address from the username.
  const cleanUsername = username.toLowerCase().trim();
  const dummyEmail = `${cleanUsername}@myanmatch.user`;

  try {
    // 3. Sign up the user with Supabase Auth.
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: dummyEmail,
      password: password,
    });

    if (authError) {
      throw authError;
    }
    if (!authData.user) {
      throw new Error("Sign up successful, but no user data returned.");
    }
    
    const userId = authData.user.id;

    // 4. UPDATE the existing profile row that the trigger created.
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        username: username,
        onboarding_complete: false,
      })
      .eq('user_id', userId);

    if (profileError) {
      throw profileError;
    }

    // 5. CRITICAL FIX: Cache the new user's session data locally.
    const cache = {
      id: userId,
      user_id: userId,
      username: username,
      onboarding_complete: false,
      is_admin: false,
    };
    localStorage.setItem("myanmatch_user", JSON.stringify(cache));

    // 6. SUCCESS! Navigate to the start of the onboarding flow.
    navigate("/onboarding/terms");

  } catch (error) {
    console.error("Sign-up failed:", error.message);
    if (error.message.includes("unique constraint") || error.message.includes("User already registered")) {
      const m = "This username is already taken. Please choose another one.";
      setErr(m);
      showToast(m, "error");
    } else {
      setErr(error.message);
      showToast(error.message, "error");
    }
  } finally {
    setLoading(false);
  }
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
        <h2 className="text-2xl font-bold text-[#893086] text-center">Create your account</h2>
        <p className="text-base font-medium text-gray-700 mb-6 text-center">အကောင့်အသစ်ဖောက်မည်</p>

        {/* [!MODIFIED!] - The form now calls `handleUsernameSignUp` */}
        <form onSubmit={handleUsernameSignUp} className="w-full">
          {/* [!MODIFIED!] - This is now the Username input field */}
          <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
          <input
            type="text"
            className="mb-4 w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#893086] text-lg"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password <span className="text-gray-400">(ပက်စဝေါ့)</span>
          </label>
          <input
            type="password"
            className="mb-4 w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#893086] text-lg"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Verify password <span className="text-gray-400">(အတည်ပြုပါ)</span>
          </label>
          <input
            type="password"
            className="mb-6 w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#893086] text-lg"
            placeholder="Re-enter password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />

          <button
            className={`w-full py-3 rounded-full bg-[#893086] text-white text-lg font-semibold transition ${
              loading ? "opacity-60" : "hover:bg-[#a16bbf]"
            } shadow-md`}
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create account (အကောင့်ဖောက်)"}
          </button>

          {err && <div className="text-red-500 text-center mt-3">{err}</div>}
        </form>

        <div className="mt-2 text-center text-base">
          <span className="text-gray-600">Already a member?</span>{" "}
          <span
            onClick={() => navigate("/SignInPage")}
            className="text-[#893086] font-medium underline hover:text-[#a16bbf] cursor-pointer"
          >
            Sign in ဝင်
          </span>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          By signing up, you agree to the{" "}
          <a href="/TermsPage" className="underline hover:text-[#893086]">Terms of Use</a>,{" "}
          <a href="/PrivacyPage" className="underline hover:text-[#893086]">Privacy Notice</a>, and{" "}
          <span className="underline">Cookie Notice</span>.
        </div>

        <MMToast open={toastOpen} type={toastType} text={toastText} onClose={() => setToastOpen(false)} />
      </div>
    </div>
  );
}