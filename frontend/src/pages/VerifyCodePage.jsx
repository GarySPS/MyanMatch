import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ReactCodesInput from "react-codes-input";
import "react-codes-input/lib/react-codes-input.min.css";
import { supabase } from "../supabaseClient";

export default function VerifyCodePage() {
  const pinWrapperRef = useRef(null);
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [resending, setResending] = useState(false);
  const [resentMsg, setResentMsg] = useState("");
  const [timer, setTimer] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";
  const phone = location.state?.phone || "";
  const channel = location.state?.channel || (email ? "email" : "phone"); // fallback

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const ensureProfile = async (userId) => {
    if (!userId) return;
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", userId)
        .single();
      if (!profile) {
        await supabase.from("profiles").insert([
          {
            user_id: userId,
            onboarding_complete: false,
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch {}
  };

  const handleConfirm = async () => {
    if (pin.length !== 6 || loading) return;
    setLoading(true);
    setErrorMsg("");

    try {
      const url =
        channel === "phone" ? "/api/auth/verify-otp-phone" : "/api/auth/verify-otp";

      const payload =
        channel === "phone" ? { phone, otp_code: pin } : { email, otp_code: pin };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setLoading(false);

      if (data.user) {
        localStorage.setItem("myanmatch_user", JSON.stringify(data.user));
      }

      if (!res.ok) {
        // Already verified shortcut
        if (data.error === "Already verified." && data.user) {
          try {
            await ensureProfile(data.user.id || data.user.user_id);
          } catch {}
          navigate("/onboarding/terms");
          return;
        }
        setErrorMsg(data.error || "Invalid code. Try again.");
        return;
      }

      try {
        await ensureProfile(data.user?.id || data.user?.user_id);
      } catch {}

      if (data.user && data.user.onboarding_complete) {
        navigate("/HomePage");
      } else {
        navigate("/onboarding/terms");
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg("Network error. Please try again.");
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResentMsg("");
    setErrorMsg("");
    setTimer(30);
    try {
      const url =
        channel === "phone" ? "/api/auth/resend-otp-phone" : "/api/auth/resend-otp";
      const payload = channel === "phone" ? { phone } : { email };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setResending(false);
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to resend code.");
      } else {
        setResentMsg(
          channel === "phone"
            ? "A new code has been sent to your phone."
            : "A new code has been sent to your email."
        );
      }
    } catch (err) {
      setResending(false);
      setErrorMsg("Network error. Please try again.");
    }
  };

  const targetText =
    channel === "phone" ? `We sent a code to ${phone || "your phone"}` : "We sent you a code";

  return (
    <div
      className="min-h-screen w-full flex flex-col justify-center items-center relative"
      style={{
        background: `url('/images/myanmatch-bg.jpg') center center/cover no-repeat`,
        backgroundColor: "#21101e",
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-40 z-0" />
      <div className="relative z-10 w-full max-w-sm mx-auto rounded-[2.2rem] bg-white/80 backdrop-blur-[7px] px-9 py-12 flex flex-col items-center shadow-2xl border-[1.5px] border-[#ffffff33]">
        <h2 className="text-2xl font-extrabold text-[#893086] mb-1 text-center tracking-tight drop-shadow">
          {targetText}
        </h2>
        <p className="text-base text-gray-700/90 text-center mb-7 font-medium">
          Enter the 6-digit verification code
          <p>ရရှိလာသောကုဒ်-၆ခုကိုဖြည့်ပါ</p>
        </p>
        <ReactCodesInput
          classNameComponent="react-codes-premium !h-20 mb-8"
          classNameWrapper="flex gap-3 justify-center"
          classNameCodeWrapper="!w-14 !h-16 !flex-none !rounded-2xl !border-2 !border-[#e9e0f4] !bg-white/90 shadow-md !transition-all !duration-150 focus-within:!border-[#893086]"
          classNameEnteredValue="!text-3xl font-bold text-[#893086] tracking-widest text-center"
          classNameCode="!border-0 !bg-transparent"
          classNameCodeWrapperFocus="!border-[#893086] !shadow-lg"
          initialFocus={true}
          wrapperRef={pinWrapperRef}
          placeholder="000000"
          id="pin"
          codeLength={6}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          hide={false}
          onChange={(val) => {
            const clean = (val || "").replace(/\D/g, "").slice(0, 6);
            if (clean !== pin) setPin(clean);
          }}
        />
        <button
          className={`w-full py-3 rounded-full bg-[#893086] text-white text-lg font-bold mb-2 transition ${
            pin.length === 6 && !loading
              ? "hover:bg-[#a16bbf] cursor-pointer"
              : "opacity-50 cursor-not-allowed"
          } shadow-lg`}
          onClick={handleConfirm}
          disabled={pin.length !== 6 || loading}
        >
          {loading ? "Verifying..." : "Confirm"}
        </button>
        {errorMsg && (
          <div className="text-red-500 text-center mb-3">{errorMsg}</div>
        )}
        {resentMsg && (
          <div className="text-green-600 text-center mb-3">{resentMsg}</div>
        )}
        <div className="mt-3 text-sm text-gray-500 text-center">
          Didn’t get the code?{" "}
          <span
            className={`text-[#893086] font-semibold cursor-pointer hover:underline transition ${
              resending || timer > 0 ? "opacity-40 pointer-events-none" : ""
            }`}
            onClick={timer === 0 && !resending ? handleResend : undefined}
          >
            {resending
              ? "Resending..."
              : timer > 0
              ? `Resend (${timer}s)`
              : "Resend"}
          </span>
        </div>
      </div>
    </div>
  );
}
