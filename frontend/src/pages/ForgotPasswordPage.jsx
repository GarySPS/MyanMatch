import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ReactCodesInput from "react-codes-input";
import "react-codes-input/lib/react-codes-input.min.css";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1: input email, 2: enter otp, 3: reset password
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const pinWrapperRef = useRef(null);

  // Step 1: Request OTP
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/auth/forgot-password/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to send OTP. Try again.");
      } else {
        setStep(2);
        setSuccessMsg("We sent a code to your email.");
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg("Network error. Try again.");
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/auth/forgot-password/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp_code: pin }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) {
        setErrorMsg(data.error || "Invalid or expired code.");
      } else {
        setStep(3);
        setSuccessMsg("OTP verified! Set new password.");
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg("Network error. Try again.");
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp_code: pin, new_password: newPassword }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to reset password.");
      } else {
        setSuccessMsg("Password reset! Please sign in.");
        setTimeout(() => window.location.href = "/SignInPage", 1600); // Redirect
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg("Network error. Try again.");
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
      <div className="relative z-10 w-full max-w-sm mx-auto rounded-3xl bg-white bg-opacity-90 px-7 py-10 flex flex-col items-center shadow-2xl">
        <h2 className="text-2xl font-bold text-[#893086] mb-2 text-center">
          Forgot Password
        </h2>
        {step === 1 && (
          <form className="w-full" onSubmit={handleRequestOTP}>
            <p className="text-base text-gray-700 text-center mb-6">
              Enter your email and we'll send you a code to reset password.
            </p>
            <input
              type="email"
              className="mb-4 w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#893086] text-lg"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <button
              className="w-full py-3 rounded-full bg-[#893086] text-white text-lg font-semibold mb-2 transition hover:bg-[#a16bbf] shadow-md"
              disabled={loading}
            >
              {loading ? "Sending code..." : "Continue"}
            </button>
          </form>
        )}
        {step === 2 && (
          <form className="w-full" onSubmit={handleVerifyOTP}>
            <p className="text-base text-gray-700 text-center mb-6">
              Enter the 6-digit code sent to <span className="font-medium text-[#893086]">{email}</span>
            </p>
            <ReactCodesInput
              classNameComponent="react-codes-premium !h-20 mb-8"
              classNameWrapper="flex gap-3 justify-center"
              classNameCodeWrapper="!w-14 !h-16 !flex-none !rounded-2xl !border-2 !border-[#e9e0f4] !bg-white/90 shadow-md"
              classNameEnteredValue="!text-3xl font-bold text-[#893086] tracking-widest text-center"
              classNameCode="!border-0 !bg-transparent"
              classNameCodeWrapperFocus="!border-[#893086] !shadow-lg"
              initialFocus={true}
              wrapperRef={pinWrapperRef}
              placeholder="000000"
              id="pin"
              codeLength={6}
              type="number"
              hide={false}
              value={pin}
              onChange={res => setPin(res)}
            />
            <button
              className={`w-full py-3 rounded-full bg-[#893086] text-white text-lg font-semibold mb-2 transition ${
                pin.length === 6 && !loading
                  ? "hover:bg-[#a16bbf] cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              } shadow-md`}
              disabled={pin.length !== 6 || loading}
            >
              {loading ? "Verifying..." : "Verify"}
            </button>
          </form>
        )}
        {step === 3 && (
          <form className="w-full" onSubmit={handleResetPassword}>
            <p className="text-base text-gray-700 text-center mb-6">
              Set a new password for <span className="font-medium text-[#893086]">{email}</span>
            </p>
<input
  type="password"
  className="mb-4 w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#893086] text-lg"
  placeholder="New password"
  value={newPassword}
  onChange={e => setNewPassword(e.target.value)}
  required
  minLength={8}
  pattern="(?=.*[A-Za-z])(?=.*\d).{8,}"
  title="At least 8 characters, include letters and numbers."
/>
            <button
              className="w-full py-3 rounded-full bg-[#893086] text-white text-lg font-semibold mb-2 transition hover:bg-[#a16bbf] shadow-md"
              disabled={loading}
            >
              {loading ? "Saving..." : "Reset Password"}
            </button>
          </form>
        )}
        {errorMsg && <div className="text-red-500 text-center mb-2">{errorMsg}</div>}
        {successMsg && <div className="text-green-600 text-center mb-2">{successMsg}</div>}
        <div className="mt-4 text-xs text-gray-500 text-center">
          Remembered?{" "}
          <span
            onClick={() => navigate("/SignInPage")}
            className="underline text-[#893086] cursor-pointer hover:text-[#a16bbf]"
          >
            Sign in
          </span>
        </div>
      </div>
    </div>
  );
}
