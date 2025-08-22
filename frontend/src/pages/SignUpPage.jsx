import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SignUpPage() {
  const [mode, setMode] = useState("email"); // 'email' | 'phone'
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(""); // Myanmar local like 09xxxxxxxxx
  const [password, setPassword] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (password !== verifyPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const body = {
        password,
        username: "user" + Math.floor(Math.random() * 1000000),
      };

      let url = "/api/auth/register";
      if (mode === "email") {
        body.email = email;
      } else {
        url = "/api/auth/register-phone";
        body.phone = phone;
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setErrorMsg(data.error || "Failed to send OTP. Try again.");
      } else {
        localStorage.removeItem("myanmatch_user");
        if (mode === "email") {
          navigate("/VerifyCodePage", { state: { email, channel: "email" } });
        } else {
          navigate("/VerifyCodePage", { state: { phone, channel: "phone" } });
        }
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg("Network error. Please try again.");
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
      <div className="absolute inset-0 bg-black bg-opacity-40 z-0" />
      <div className="relative z-10 w-full max-w-sm mx-auto rounded-3xl bg-white/90 px-7 py-10 flex flex-col items-center shadow-2xl">
<h2 className="text-2xl font-bold text-[#893086] text-center">
  Create your account
</h2>
<p className="text-base font-medium text-gray-700 mb-4 text-center">
  အကောင့်အသစ်ဖောက်မည်
</p>

        {/* Toggle: Email / Phone */}
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

        <form className="w-full" onSubmit={handleSignUp}>
          {mode === "email" ? (
            <input
              type="email"
              className="mb-4 w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#893086] text-lg"
              placeholder="Gmail ထည့်ပါ"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          ) : (
            <input
              type="tel"
              inputMode="numeric"
              className="mb-4 w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#893086] text-lg"
              placeholder="Phone နာမ်ပတ် (09xxxxxxxxx)"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
            />
          )}

          <input
            type="password"
            className="mb-4 w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#893086] text-lg"
            placeholder="Password ထည့်ပါ"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            className="mb-6 w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#893086] text-lg"
            placeholder="Verify Password အတည်ပြုပါ"
            value={verifyPassword}
            onChange={e => setVerifyPassword(e.target.value)}
            required
          />
          <button
            className="w-full py-3 rounded-full bg-[#893086] text-white text-lg font-semibold mb-2 transition hover:bg-[#a16bbf] shadow-md"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Continue"}
          </button>
          {errorMsg && (
            <div className="text-red-500 text-center mb-3">{errorMsg}</div>
          )}
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
          <a href="/TermsPage" className="underline hover:text-[#893086]">
            Terms of Use
          </a>
          ,{" "}
          <a href="/PrivacyPage" className="underline hover:text-[#893086]">
            Privacy Notice
          </a>
          , and <span className="underline">Cookie Notice</span>.
        </div>
      </div>
    </div>
  );
}
