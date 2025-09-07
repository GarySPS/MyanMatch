import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

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
  const { user, profile, loading: authLoading } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [toastOpen, setToastOpen] = useState(false);
  const [toastType, setToastType] = useState("error");
  const [toastText, setToastText] = useState("");

  // [!ADD!] Add redirection logic for users who are already logged in.
  useEffect(() => {
    if (!authLoading && user && profile) {
      if (profile.onboarding_complete) {
        navigate("/HomePage", { replace: true });
      } else {
        navigate("/onboarding/terms", { replace: true });
      }
    }
  }, [user, profile, authLoading, navigate]);

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

    if (!username || username.trim().length < 3) {
      const m = "Username must be at least 3 characters long.\nUsername သည် အနည်းဆုံး စာလုံး ၃ လုံးရှိရပါမည်။";
      setErr(m); showToast(m, "error"); return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      const m = "Username can only contain letters, numbers, and underscores.\nUsername တွင် စာလုံးများ၊ နံပါတ်များနှင့် (_) သာ ပါဝင်နိုင်သည်။ ဥပမာ: aungaung25";
      setErr(m); showToast(m, "error"); return;
    }
    if (!password || password.length < 6) {
      const m = "Password must be at least 6 characters long.\nစကားဝှက်သည် အနည်းဆုံး စာလုံး ၆ လုံးရှိရပါမည်။";
      setErr(m); showToast(m, "error"); return;
    }
    if (password !== confirm) {
      const m = "Passwords do not match.\nစကားဝှက်များ မကိုက်ညီပါ။";
      setErr(m); showToast(m, "error"); return;
    }

    setLoading(true);

    const cleanUsername = username.toLowerCase().trim();
    const dummyEmail = `${cleanUsername}@myanmatch.user`;

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: dummyEmail,
        password: password,
      });

      if (authError) throw authError;
      if (!authData.user || !authData.session) {
        throw new Error("Sign up did not return a user or session.");
      }
      
      await supabase.auth.setSession(authData.session);
      
      const userId = authData.user.id;

      await supabase
        .from('profiles')
        .upsert({ user_id: userId, username: username }, { onConflict: 'user_id' });

      // The AuthContext will now detect the new user and the useEffect will redirect.
      // A manual navigate is still good for speed.
      navigate("/onboarding/terms");

    } catch (error) {
      console.error("Sign-up failed:", error.message);
      if (error.message.includes("User already registered")) {
        const m = "This username is already taken. Please choose another one.\nဤ Username ကို အသုံးပြုပြီးဖြစ်သည်။ အခြားတစ်ခုကို ရွေးပါ။";
        setErr(m); showToast(m, "error");
      } else {
        setErr(error.message); showToast(error.message, "error");
      }
    } finally {
      setLoading(false);
    }
  }

  // [!ADD!] This prevents the sign-up form from flashing on screen for logged-in users before redirecting.
  if (authLoading || user) {
    return (
      <div
        className="min-h-screen w-full"
        style={{ backgroundColor: "#21101e" }}
        aria-busy="true"
      />
    );
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col justify-center items-center relative p-4"
      style={{
        background: `url('/images/myanmatch-bg.jpg') center center/cover no-repeat`,
        backgroundColor: "#21101e",
      }}
    >
      <div className="absolute inset-0 bg-black/40 z-0" />
      <div className="relative z-10 w-full max-w-sm mx-auto rounded-3xl bg-white/95 px-7 py-10 flex flex-col items-center shadow-2xl">
        <h2 className="text-2xl font-bold text-[#893086] text-center">Create Your Account</h2>
        <p className="text-base font-medium text-gray-700 mb-6 text-center">အကောင့်အသစ် ပြုလုပ်မည်</p>
        
        <form onSubmit={handleUsernameSignUp} className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username
            <span className="block text-xs text-gray-500 font-normal">အကောင့်နာမည်</span>
          </label>
          <input
            type="text"
            className="mb-4 w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#893086] text-lg"
            placeholder="e.g. aungaung25"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
            <span className="block text-xs text-gray-500 font-normal">စကားဝှက်</span>
          </label>
          <input
            type="password"
            className="mb-4 w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#893086] text-lg"
            placeholder="6+ characters / စာလုံး ၆ လုံးအထက်"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <label className="block text-sm font-medium text-gray-700 mb-1">
            Verify Password
            <span className="block text-xs text-gray-500 font-normal">စကားဝှက် အတည်ပြုပါ</span>
          </label>
          <input
            type="password"
            className="mb-6 w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#893086] text-lg"
            placeholder="Re-enter password / ထပ်မံရိုက်ထည့်ပါ"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          
          <button
            className={`w-full py-3 rounded-full bg-[#893086] text-white transition ${
              loading ? "opacity-60" : "hover:bg-[#a16bbf]"
            } shadow-md flex flex-col items-center justify-center`}
            disabled={loading}
          >
            <span className="text-lg font-semibold">{loading ? "Creating..." : "Create Account"}</span>
            <span className="text-sm font-normal">{loading ? "ပြုလုပ်နေသည်..." : "အကောင့်အသစ်ပြုလုပ်မည်"}</span>
          </button>
          
          {err && <div className="text-red-500 text-center mt-3 text-sm whitespace-pre-line">{err}</div>}
        </form>

        <div className="mt-3 text-center text-sm">
          <span className="text-gray-600">Already a member? / အကောင့်ရှိပြီးသားလား?</span>{" "}
          <span
            onClick={() => navigate("/SignInPage")}
            className="text-[#893086] font-medium underline hover:text-[#a16bbf] cursor-pointer"
          >
            Sign In / ဝင်မည်
          </span>
        </div>

        <div className="mt-6 text-xs text-gray-500 text-center">
          By signing up, you agree to the{" "}
          <a href="/TermsPage" className="underline hover:text-[#893086]">Terms of Use</a>,{" "}
          <a href="/PrivacyPage" className="underline hover:text-[#893086]">Privacy Notice</a>, and{" "}
          <a href="/CookiesPage" className="underline">Cookie Notice</a>.
        </div>
        
        <MMToast open={toastOpen} type={toastType} text={toastText} onClose={() => setToastOpen(false)} />
      </div>
    </div>
  );
}