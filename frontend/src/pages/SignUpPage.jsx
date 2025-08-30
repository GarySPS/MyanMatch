import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

// Ensure profile row exists + cache small user object
async function ensureProfileAndCache() {
  const { data: { user } } = await supabase.auth.getUser();
  const authId = user?.id;
  if (!authId) return null;

  // only create row if missing – don’t touch onboarding_complete
  await supabase.from("profiles").upsert({ user_id: authId }, { onConflict: "user_id" });

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
  };
  localStorage.setItem("myanmatch_user", JSON.stringify(cache));

  return prof;
}

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

  const [email, setEmail] = useState("");
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

async function handleSignUp(e) {
  e.preventDefault();
  setErr("");

  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    const m = "Please enter a valid email.";
    setErr(m); showToast(m, "error"); return;
  }
  if (!password || password.length < 6) {
    const m = "Password must be at least 6 characters.";
    setErr(m); showToast(m, "error"); return;
  }
  if (password !== confirm) {
    const m = "Passwords do not match.";
    setErr(m); showToast(m, "error"); return;
  }

  setLoading(true);

  // Create the account; Supabase will email a CONFIRMATION LINK (no 6-digit code).
// send the confirm email to the right page for each env
const redirectTo =
  import.meta.env.MODE === "development"
    ? "http://localhost:3000/VerifyCodePage"
    : "https://www.myanmatch.com/VerifyCodePage";

const { error: signUpErr } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/VerifyCodePage`,
  },
});

  if (signUpErr) {
    setErr(signUpErr.message);
    showToast(signUpErr.message, "error");
    setLoading(false);
    return;
  }

  setLoading(false);
  // Go to the “check your email” screen
  navigate("/VerifyCodePage", { state: { email } });
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

        <form onSubmit={handleSignUp} className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            className="mb-4 w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#893086] text-lg"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value.trim())}
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
