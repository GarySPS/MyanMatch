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
  // "signup" expected for this flow (email+password). We still default safe.
  const flow = location.state?.flow || "signup";

  useEffect(() => {
    if (!email) navigate("/SignInPage", { replace: true });
  }, [email, navigate]);

  useEffect(() => {
    if (timer > 0) {
      const id = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(id);
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
          { user_id: userId, onboarding_complete: false, created_at: new Date().toISOString() },
        ]);
      }
    } catch {}
  };

  const handleConfirm = async () => {
    if (pin.length !== 6 || loading) return;
    setLoading(true);
    setErrorMsg("");

    try {
      // For password sign-up email confirmation use type: 'signup'
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: pin,
        type: flow === "signup" ? "signup" : "email",
      });
      if (error) throw error;

      const user = data?.session?.user;
      if (!user) throw new Error("No session returned. Try again.");

      try {
        await ensureProfile(user.id);
        const { data: prof } = await supabase
          .from("profiles")
          .select("onboarding_complete, is_admin")
          .eq("user_id", user.id)
          .single();

        if (prof?.is_admin) return navigate("/admin", { replace: true });
        if (prof?.onboarding_complete) return navigate("/HomePage", { replace: true });
      } catch {}

      navigate("/onboarding/terms", { replace: true });
    } catch (err) {
      setErrorMsg(err?.message || "Invalid code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResentMsg("");
    setErrorMsg("");
    setTimer(30);
    try {
      if (flow === "signup") {
        await supabase.auth.resend({ type: "signup", email });
      } else {
        await supabase.auth.resend({ type: "magiclink", email });
      }
      setResentMsg("A new code has been sent to your email.");
    } catch (err) {
      setErrorMsg(err?.message || "Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  const targetText = `We sent a code to ${email}`;

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

        {errorMsg && <div className="text-red-500 text-center mb-3">{errorMsg}</div>}
        {resentMsg && <div className="text-green-600 text-center mb-3">{resentMsg}</div>}

        <div className="mt-3 text-sm text-gray-500 text-center">
          Didn’t get the code?{" "}
          <span
            className={`text-[#893086] font-semibold cursor-pointer hover:underline transition ${
              resending || timer > 0 ? "opacity-40 pointer-events-none" : ""
            }`}
            onClick={timer === 0 && !resending ? handleResend : undefined}
          >
            {resending ? "Resending..." : timer > 0 ? `Resend (${timer}s)` : "Resend"}
          </span>
        </div>
      </div>
    </div>
  );
}
