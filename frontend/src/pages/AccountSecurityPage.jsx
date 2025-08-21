// src/pages/AccountSecurityPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../i18n";

export default function AccountSecurityPage() {
  const { t } = useI18n();
  const navigate = useNavigate();

  const cached = JSON.parse(localStorage.getItem("myanmatch_user") || "{}");
  const userId = cached?.id || cached?.user_id;

  // Email
  const [oldEmail] = useState(cached?.email || "");
  const [newEmail, setNewEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [emailPwd, setEmailPwd] = useState("");
  const [emailMsg, setEmailMsg] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [emailStep, setEmailStep] = useState(1); // 1=start, 2=confirm

  // Phone
  const [oldPhone] = useState(cached?.phone || "");
  const [newPhone, setNewPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phonePwd, setPhonePwd] = useState("");
  const [phoneMsg, setPhoneMsg] = useState("");
  const [phoneErr, setPhoneErr] = useState("");
  const [phoneStep, setPhoneStep] = useState(1); // 1=start, 2=confirm

  const [loading, setLoading] = useState(false);

  /* ---------- handlers ---------- */
  const startEmailChange = async () => {
    setEmailErr(""); setEmailMsg("");
    if (!newEmail || !emailPwd) { setEmailErr(t("acct.email.err.enterNewAndPwd")); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/users/change-email/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, password: emailPwd, new_email: newEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t("acct.common.err.start"));
      setEmailMsg(t("acct.email.msg.codeSent"));
      setEmailStep(2);
    } catch (e) {
      setEmailErr(e.message || t("acct.common.err.network"));
    } finally {
      setLoading(false);
    }
  };

  const confirmEmailChange = async () => {
    setEmailErr(""); setEmailMsg("");
    if (!emailCode || !emailPwd) { setEmailErr(t("acct.email.err.enterCodeAndPwd")); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/users/change-email/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, password: emailPwd, code: emailCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t("acct.common.err.confirm"));
      localStorage.setItem(
        "myanmatch_user",
        JSON.stringify({ ...cached, email: data.user.email, verified: true })
      );
      setEmailMsg(t("acct.email.msg.updated"));
      setEmailStep(1);
      setNewEmail(""); setEmailCode(""); setEmailPwd("");
    } catch (e) {
      setEmailErr(e.message || t("acct.common.err.network"));
    } finally {
      setLoading(false);
    }
  };

  const startPhoneChange = async () => {
    setPhoneErr(""); setPhoneMsg("");
    if (!newPhone || !phonePwd) { setPhoneErr(t("acct.phone.err.enterNewAndPwd")); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/users/change-phone/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, password: phonePwd, new_phone: newPhone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t("acct.common.err.start"));
      setPhoneMsg(t("acct.phone.msg.codeSent"));
      setPhoneStep(2);
    } catch (e) {
      setPhoneErr(e.message || t("acct.common.err.network"));
    } finally {
      setLoading(false);
    }
  };

  const confirmPhoneChange = async () => {
    setPhoneErr(""); setPhoneMsg("");
    if (!phoneCode || !phonePwd) { setPhoneErr(t("acct.phone.err.enterCodeAndPwd")); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/users/change-phone/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, password: phonePwd, code: phoneCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t("acct.common.err.confirm"));
      localStorage.setItem(
        "myanmatch_user",
        JSON.stringify({ ...cached, phone: data.user.phone, phone_verified: true })
      );
      setPhoneMsg(t("acct.phone.msg.updated"));
      setPhoneStep(1);
      setNewPhone(""); setPhoneCode(""); setPhonePwd("");
    } catch (e) {
      setPhoneErr(e.message || t("acct.common.err.network"));
    } finally {
      setLoading(false);
    }
  };

  /* ---------- UI ---------- */
  return (
    <div className="relative min-h-dvh w-full text-white">
      {/* bg */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#201033] via-[#120f1f] to-[#0a0a12]" />
        <div className="absolute -top-24 -left-28 w-[22rem] h-[22rem] rounded-full bg-fuchsia-500/25 blur-[110px]" />
        <div className="absolute -bottom-32 -right-24 w-[24rem] h-[24rem] rounded-full bg-violet-500/25 blur-[120px]" />
      </div>

      {/* header */}
      <header className="sticky top-0 z-20 bg-white/5 backdrop-blur border-b border-white/10">
        <div className="px-4 h-[56px] flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-3 py-1.5 rounded-full hover:bg-white/10"
            type="button"
            aria-label={t("chpw.back")}
            title={t("chpw.back")}
          >
            ←
          </button>
          <h1 className="text-lg font-extrabold tracking-tight">
            {t("acct.title")}
          </h1>
        </div>
      </header>

      {/* content */}
      <main className="px-4 py-6">
        <div className="max-w-md mx-auto space-y-6">
          {/* EMAIL CARD */}
          <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow">
            <h2 className="text-base font-bold mb-2">{t("acct.email.title")}</h2>
            <p className="text-sm text-white/70 mb-3">
              {t("acct.common.current")}{" "}
              {oldEmail ? <span className="font-semibold">{oldEmail}</span> : <em>{t("acct.common.notSet")}</em>}
            </p>

            {emailStep === 1 ? (
              <>
                <label className="block text-sm mb-1">{t("acct.email.ph.new")}</label>
                <input
                  type="email"
                  className="w-full mb-3 px-4 py-3 rounded-xl bg-black/30 border border-white/15 outline-none"
                  placeholder={t("acct.email.ph.new")}
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  autoComplete="email"
                />

                <label className="block text-sm mb-1">{t("acct.common.ph.confirmPwd")}</label>
                <input
                  type="password"
                  className="w-full mb-4 px-4 py-3 rounded-xl bg-black/30 border border-white/15 outline-none"
                  placeholder={t("acct.common.ph.confirmPwd")}
                  value={emailPwd}
                  onChange={(e) => setEmailPwd(e.target.value)}
                  autoComplete="current-password"
                />

                {emailErr && (
                  <div className="mb-3 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-sm">
                    {emailErr}
                  </div>
                )}
                {emailMsg && (
                  <div className="mb-3 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-sm">
                    {emailMsg}
                  </div>
                )}

                <button
                  onClick={startEmailChange}
                  disabled={loading}
                  className={`w-full rounded-full px-5 py-3 text-sm font-bold ${
                    loading
                      ? "bg-white/10 text-white/60 cursor-not-allowed"
                      : "bg-[#FFD84D] text-black hover:opacity-90"
                  }`}
                  type="button"
                >
                  {loading ? t("acct.common.sending") : t("acct.email.cta.send")}
                </button>
              </>
            ) : (
              <>
                <label className="block text-sm mb-1">{t("acct.common.ph.code6")}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="w-full mb-3 px-4 py-3 rounded-xl bg-black/30 border border-white/15 outline-none"
                  placeholder={t("acct.common.ph.code6")}
                  value={emailCode}
                  onChange={(e) =>
                    setEmailCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                />

                <label className="block text-sm mb-1">{t("acct.common.ph.confirmPwd")}</label>
                <input
                  type="password"
                  className="w-full mb-4 px-4 py-3 rounded-xl bg-black/30 border border-white/15 outline-none"
                  placeholder={t("acct.common.ph.confirmPwd")}
                  value={emailPwd}
                  onChange={(e) => setEmailPwd(e.target.value)}
                  autoComplete="current-password"
                />

                {emailErr && (
                  <div className="mb-3 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-sm">
                    {emailErr}
                  </div>
                )}
                {emailMsg && (
                  <div className="mb-3 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-sm">
                    {emailMsg}
                  </div>
                )}

                <button
                  onClick={confirmEmailChange}
                  disabled={loading}
                  className={`w-full rounded-full px-5 py-3 text-sm font-bold ${
                    loading
                      ? "bg-white/10 text-white/60 cursor-not-allowed"
                      : "bg-[#FFD84D] text-black hover:opacity-90"
                  }`}
                  type="button"
                >
                  {loading ? t("acct.common.verifying") : t("acct.email.cta.confirm")}
                </button>
              </>
            )}
          </section>

          {/* PHONE CARD */}
          <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow">
            <h2 className="text-base font-bold mb-2">{t("acct.phone.title")}</h2>
            <p className="text-sm text-white/70 mb-3">
              {t("acct.common.current")}{" "}
              {oldPhone ? <span className="font-semibold">{oldPhone}</span> : <em>{t("acct.common.notSet")}</em>}
            </p>

            {phoneStep === 1 ? (
              <>
                <label className="block text-sm mb-1">{t("acct.phone.ph.newMm")}</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  className="w-full mb-3 px-4 py-3 rounded-xl bg-black/30 border border-white/15 outline-none"
                  placeholder={t("acct.phone.ph.newMm")}
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  autoComplete="tel-national"
                />

                <label className="block text-sm mb-1">{t("acct.common.ph.confirmPwd")}</label>
                <input
                  type="password"
                  className="w-full mb-4 px-4 py-3 rounded-xl bg-black/30 border border-white/15 outline-none"
                  placeholder={t("acct.common.ph.confirmPwd")}
                  value={phonePwd}
                  onChange={(e) => setPhonePwd(e.target.value)}
                  autoComplete="current-password"
                />

                {phoneErr && (
                  <div className="mb-3 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-sm">
                    {phoneErr}
                  </div>
                )}
                {phoneMsg && (
                  <div className="mb-3 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-sm">
                    {phoneMsg}
                  </div>
                )}

                <button
                  onClick={startPhoneChange}
                  disabled={loading}
                  className={`w-full rounded-full px-5 py-3 text-sm font-bold ${
                    loading
                      ? "bg-white/10 text-white/60 cursor-not-allowed"
                      : "bg-[#FFD84D] text-black hover:opacity-90"
                  }`}
                  type="button"
                >
                  {loading ? t("acct.common.sending") : t("acct.phone.cta.send")}
                </button>
              </>
            ) : (
              <>
                <label className="block text-sm mb-1">{t("acct.common.ph.code6")}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="w-full mb-3 px-4 py-3 rounded-xl bg-black/30 border border-white/15 outline-none"
                  placeholder={t("acct.common.ph.code6")}
                  value={phoneCode}
                  onChange={(e) =>
                    setPhoneCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                />

                <label className="block text-sm mb-1">{t("acct.common.ph.confirmPwd")}</label>
                <input
                  type="password"
                  className="w-full mb-4 px-4 py-3 rounded-xl bg-black/30 border border-white/15 outline-none"
                  placeholder={t("acct.common.ph.confirmPwd")}
                  value={phonePwd}
                  onChange={(e) => setPhonePwd(e.target.value)}
                  autoComplete="current-password"
                />

                {phoneErr && (
                  <div className="mb-3 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-sm">
                    {phoneErr}
                  </div>
                )}
                {phoneMsg && (
                  <div className="mb-3 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-sm">
                    {phoneMsg}
                  </div>
                )}

                <button
                  onClick={confirmPhoneChange}
                  disabled={loading}
                  className={`w-full rounded-full px-5 py-3 text-sm font-bold ${
                    loading
                      ? "bg-white/10 text-white/60 cursor-not-allowed"
                      : "bg-[#FFD84D] text-black hover:opacity-90"
                  }`}
                  type="button"
                >
                  {loading ? t("acct.common.verifying") : t("acct.phone.cta.confirm")}
                </button>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
