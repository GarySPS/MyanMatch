import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

/* --- Pretty toast for notices --- */
function MMToast({ open, type = "error", text = "", onClose }) {
  if (!open) return null;
  const isErr = type === "error";
  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[80]
                 bottom-[calc(env(safe-area-inset-bottom)+110px)]"
      role="status"
      aria-live="polite"
      onClick={onClose}
    >
      <div
        className={`px-4 py-3 rounded-2xl shadow-2xl border
                    ${isErr
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
  const [mode, setMode] = useState("email"); // 'email' | 'phone'
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

    // toast
  const [toastOpen, setToastOpen] = useState(false);
  const [toastType, setToastType] = useState("error"); // 'error' | 'success'
  const [toastText, setToastText] = useState("");

  function showToast(text, type = "error") {
    setToastText(text);
    setToastType(type);
    setToastOpen(true);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToastOpen(false), 2200);
  }

  // map backend errors -> friendly MM messages
  function normalizeLoginError(msg = "") {
    const s = String(msg).toLowerCase();
    if (s.includes("not found") || s.includes("no account") || s.includes("doesn") || s.includes("unknown user"))
      return "ဒီ Gmail/ဖုန်းနံပါတ်နဲ့ အကောင့် မရှိပါ။";
    if (s.includes("password") || s.includes("credential") || s.includes("incorrect") || s.includes("mismatch"))
      return "စကားဝှက် မမှန်ပါ။";
    if (s.includes("verify")) return "အကောင့်အတည်ပြုခြင်း လိုအပ်ပါတယ်။";
    return msg || "ဝင်ရောက်မှု မအောင်မြင်ပါ။ ထပ်ကြိုးစားပါ။";
  }


  const postLoginMergeAndRoute = async (dataUser) => {
    const userId = dataUser.id || dataUser.user_id;
    const { data: prof, error: profErr } = await supabase
      .from("profiles")
      .select("onboarding_complete, is_admin")
      .eq("user_id", userId)
      .single();

    if (profErr || !prof) {
      const { error: insertError } = await supabase.from("profiles").insert([{
        user_id: userId,
        onboarding_complete: false,
        created_at: new Date().toISOString(),
      }]);
      if (insertError) {
        setErrorMsg("Failed to create profile: " + insertError.message);
        return;
      }
      localStorage.setItem("myanmatch_user", JSON.stringify({ ...dataUser, is_admin: false }));
      navigate("/onboarding/terms");
      return;
    }

    const merged = { ...dataUser, is_admin: !!prof.is_admin };
    localStorage.setItem("myanmatch_user", JSON.stringify(merged));

    if (prof.is_admin) return navigate("/admin");
    if (prof.onboarding_complete) navigate("/HomePage");
    else navigate("/onboarding/terms");
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      let url = "/api/auth/login";
      let body = { email, password };
      if (mode === "phone") {
        url = "/api/auth/login-phone";
        body = { phone, password };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      setLoading(false);

      if (!res.ok) {
        const nice = normalizeLoginError(data.error || "");
        setErrorMsg(nice);
        showToast(nice, "error");

        // if needs verification -> route to verify page
        if (String(data.error || "").toLowerCase().includes("verify")) {
          if (mode === "email") navigate("/VerifyCodePage", { state: { email, channel: "email" } });
          else navigate("/VerifyCodePage", { state: { phone, channel: "phone" } });
        }
        return;
      }

      showToast("Welcome back!", "success");
      await postLoginMergeAndRoute(data.user);
    } catch (err) {
      setLoading(false);
      setErrorMsg("Network error. Please try again.");
      showToast("Network error. Please try again.", "error");
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col justify-center items-center relative"
      style={{
        background: `url('/images/myanmatch-bg.jpg') center/cover no-repeat`,
        backgroundColor: "#21101e",
      }}
    >
      <div className="absolute inset-0 bg-black/40 z-0" />
      <div className="relative z-10 w-full max-w-sm mx-auto rounded-3xl bg-white/90 px-7 py-10 flex flex-col items-center shadow-2xl">
<h2 className="text-2xl font-extrabold text-[#893086] text-center">
  Sign in to MyanMatch
</h2>
<p className="text-base font-medium text-gray-700 mb-3 text-center">
  အကောင့်ဝင်မည်
</p>


        {/* Toggle Email / Phone */}
        <div className="flex w-full mb-5 rounded-xl overflow-hidden border border-gray-200">
          <button
            className={`flex-1 py-2 text-sm font-semibold ${
              mode === "email" ? "bg-[#893086] text-white" : "bg-white"
            }`}
            onClick={() => setMode("email")}
            type="button"
          >
            Gmail
          </button>
          <button
            className={`flex-1 py-2 text-sm font-semibold ${
              mode === "phone" ? "bg-[#893086] text-white" : "bg-white"
            }`}
            onClick={() => setMode("phone")}
            type="button"
          >
            Phone
          </button>
        </div>

        <form className="w-full" onSubmit={handleSignIn}>
          {mode === "email" ? (
            <input
              type="email"
              className="mb-3 w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#893086] text-lg"
              placeholder="Gmail ဝင်ပါ"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          ) : (
            <input
              type="tel"
              inputMode="numeric"
              className="mb-3 w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#893086] text-lg"
              placeholder="Phone ထည့်ပါ (09xxxxxxxxx)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          )}

          <input
            type="password"
            className="mb-4 w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#893086] text-lg"
            placeholder="Password ထည့်ပါ"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit"
            className="w-full py-3 rounded-full bg-[#893086] text-white text-lg font-semibold mb-2 transition hover:bg-[#a16bbf] shadow-md"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
          {errorMsg && (
            <div className="text-red-500 text-center mb-3">{errorMsg}</div>
          )}
        </form>

        <div className="w-full mt-2 mb-2 text-right">
          <span
            onClick={() => navigate("/ForgotPasswordPage")}
            className="text-sm text-[#893086] font-medium underline cursor-pointer hover:text-[#a16bbf]"
          >
            Forgot password? မေ့သွားပြီ
          </span>
        </div>
        <div className="mt-2 text-center text-base">
          <span className="text-gray-600">New to MyanMatch?</span>{" "}
          <span
            onClick={() => navigate("/SignUpPage")}
            className="text-[#893086] font-medium underline hover:text-[#a16bbf] cursor-pointer"
          >
            Create account
          </span>
        </div>

              <MMToast
        open={toastOpen}
        type={toastType}
        text={toastText}
        onClose={() => setToastOpen(false)}
      />

      </div>
    </div>
  );
}
