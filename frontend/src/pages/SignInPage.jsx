import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

async function ensureProfileAndCache() {
  const { data: { user } } = await supabase.auth.getUser();
  const authId = user?.id;
  if (!authId) return null;

  await supabase.from("profiles").upsert({ user_id: authId }, { onConflict: "user_id" });

  const { data: prof } = await supabase
    .from("profiles")
    .select("user_id, username, first_name, last_name, avatar_url, onboarding_complete, is_admin")
    .eq("user_id", authId)
    .single();

  const cache = {
    id: authId,
    user_id: authId,
    username: prof?.username || null,
    first_name: prof?.first_name || null,
    last_name: prof?.last_name || null,
    avatar_url: prof?.avatar_url || null,
    onboarding_complete: !!prof?.onboarding_complete,
    is_admin: !!prof?.is_admin,
    verified: !!user?.email_confirmed_at || !user?.email?.endsWith('@myanmatch.user'),
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

  const [loginInput, setLoginInput] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

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

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, session) => {
      if (session?.user) {
        const prof = await ensureProfileAndCache();
        if (prof?.is_admin) return navigate("/admin", { replace: true });
        if (prof?.onboarding_complete) return navigate("/HomePage", { replace: true });
        return navigate("/onboarding/terms", { replace: true });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);


  async function handleSignIn(e) {
    e.preventDefault();
    setErr("");
    
    const trimmedInput = loginInput.trim();

    if (!trimmedInput) {
      const m = "Please enter your username or email.\nကျေးဇူးပြု၍ သင်၏ Username (သို့) Email ကိုထည့်ပါ။";
      setErr(m); showToast(m, "error"); return;
    }
    if (!password) {
      const m = "Please enter your password.\nကျေးဇူးပြု၍ သင်၏ စကားဝှက်ကိုထည့်ပါ။";
      setErr(m); showToast(m, "error"); return;
    }

    setLoading(true);

    let loginEmail;

    if (trimmedInput.includes('@')) {
      loginEmail = trimmedInput.toLowerCase();
    } else {
      loginEmail = `${trimmedInput.toLowerCase()}@myanmatch.user`;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: password,
    });

    if (error) {
      const m = "Invalid credentials. Please try again.\nအချက်အလက်မှားယွင်းနေသည်။ ထပ်မံကြိုးစားပါ။";
      setErr(m);
      showToast(m, "error");
      setLoading(false);
      return;
    }
    
    setLoading(false);
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col justify-center items-center relative"
      style={{
        background: `url('/images/myanmatch-bg.jpg') center/cover no-repeat`,
        backgroundColor: "#21101e",
      }}
    >
      <div className="absolute inset-0 bg-black/40 z-0" />
      <div className="relative z-10 w-full max-w-sm mx-auto rounded-3xl bg-white/95 px-7 py-10 flex flex-col items-center shadow-2xl">
        <h2 className="text-2xl font-extrabold text-[#893086] text-center">Sign in to MyanMatch</h2>
        <p className="text-base font-medium text-gray-700 mb-6 text-center">အကောင့်ဝင်မည်</p>

        <form onSubmit={handleSignIn} className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username or Email
            <span className="block text-xs text-gray-500 font-normal">Username (သို့) Email</span>
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#893086] text-lg bg-white"
            placeholder="Username or Email / အကောင့်နာမည် (သို့) Email"
            value={loginInput}
            onChange={(e) => setLoginInput(e.target.value)}
          />

          <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
            Password
            <span className="block text-xs text-gray-500 font-normal">စကားဝှက်</span>
          </label>
          <input
            type="password"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#893086] text-lg bg-white"
            placeholder="Password / စကားဝှက်"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            className={`w-full mt-6 py-3 rounded-full bg-black text-white transition ${
              loading ? "opacity-60" : "hover:bg-gray-800"
            } shadow-md flex flex-col items-center justify-center`}
            disabled={loading}
          >
            <span className="text-lg font-semibold">{loading ? "Signing in..." : "Sign In"}</span>
            <span className="text-sm font-normal">{loading ? "ဝင်ရောက်နေသည်..." : "အကောင့်ဝင်မည်"}</span>
          </button>
        </form>

        {err && <div className="text-red-500 text-center mt-3 text-sm whitespace-pre-line">{err}</div>}

        <div className="mt-4 text-center text-sm">
          <span className="text-gray-600">New to MyanMatch? / အကောင့်သစ်လား?</span>{" "}
          <span
            onClick={() => navigate("/SignUpPage")}
            className="text-[#893086] font-medium underline hover:text-[#a16bbf] cursor-pointer"
          >
            Create Account / အကောင့်ဖွင့်မည်
          </span>
        </div>

        <MMToast open={toastOpen} type={toastType} text={toastText} onClose={() => setToastOpen(false)} />
      </div>
    </div>
  );
}