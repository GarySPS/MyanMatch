import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function SignInPage() {
  const [mode, setMode] = useState("email"); // 'email' | 'phone'
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

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
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setErrorMsg(data.error || "Invalid credentials.");
        // If not verified, push to verify page with channel
        if (
          data.error &&
          (data.error.includes("verify your gmail") || data.error.includes("verify your phone"))
        ) {
          if (mode === "email") navigate("/VerifyCodePage", { state: { email, channel: "email" } });
          else navigate("/VerifyCodePage", { state: { phone, channel: "phone" } });
        }
        return;
      }

      await postLoginMergeAndRoute(data.user);
    } catch (err) {
      setLoading(false);
      setErrorMsg("Network error. Please try again.");
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
        <h2 className="text-2xl font-bold text-[#893086] mb-2 text-center">
          Sign in to MyanMatch
        </h2>

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
          <button
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
            Forgot password?မေ့သွားပြီ
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
      </div>
    </div>
  );
}
