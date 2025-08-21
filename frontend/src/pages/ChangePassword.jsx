// src/pages/ChangePassword.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../i18n";

export default function ChangePassword() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  function getLocalUser() {
    try { return JSON.parse(localStorage.getItem("myanmatch_user") || "{}"); }
    catch { return {}; }
  }

  useEffect(() => {
    const u = getLocalUser();
    setEmail(u?.email || "");
  }, []);

  function validate(pw) {
    if ((pw || "").length < 8) return t("chpw.err.minLen");
    if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return t("chpw.err.mix");
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");

    if (!currentPw) return setMsg(t("chpw.msg.enterCurrent"));
    const v = validate(newPw);
    if (v) return setMsg(v);
    if (newPw !== confirmPw) return setMsg(t("chpw.err.mismatch"));

    const u = getLocalUser();
    const user_id = u?.user_id || u?.id;
    if (!user_id) return setMsg(t("chpw.err.notSignedIn"));

    setBusy(true);
    try {
      const res = await fetch("/api/users/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id,
          old_password: currentPw,
          new_password: newPw,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || t("chpw.err.changeFailed"));

      setMsg(t("chpw.success"));
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setTimeout(() => navigate("/Profile"), 900);
    } catch (err) {
      setMsg(err.message || t("chpw.err.tryAgain"));
    } finally {
      setBusy(false);
    }
  }

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
          <h1 className="text-lg font-extrabold tracking-tight">{t("nav.changePw")}</h1>
        </div>
      </header>

      {/* content */}
      <main className="px-4 py-6">
        <form
          onSubmit={handleSubmit}
          className="max-w-md mx-auto rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow"
        >
          <div className="text-sm text-white/80 mb-3">
            {t("chpw.signedInAs")} <span className="font-semibold">{email || "…"}</span>
          </div>

          <label className="block text-sm mb-1">{t("chpw.currentLabel")}</label>
          <input
            type="password"
            className="w-full mb-4 px-4 py-3 rounded-xl bg-black/30 border border-white/15 outline-none"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            autoComplete="current-password"
          />

          <label className="block text-sm mb-1">{t("chpw.newLabel")}</label>
          <input
            type="password"
            className="w-full mb-2 px-4 py-3 rounded-xl bg-black/30 border border-white/15 outline-none"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            autoComplete="new-password"
          />
          <p className="text-[12px] text-white/60 mb-4">
            {t("chpw.hint")}
          </p>

          <label className="block text-sm mb-1">{t("chpw.confirmLabel")}</label>
          <input
            type="password"
            className="w-full mb-4 px-4 py-3 rounded-xl bg-black/30 border border-white/15 outline-none"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            autoComplete="new-password"
          />

          {msg && (
            <div className="mb-4 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-sm">
              {msg}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className={`w-full rounded-full px-5 py-3 text-sm font-bold ${
              busy
                ? "bg-white/10 text-white/60 cursor-not-allowed"
                : "bg-[#FFD84D] text-black hover:opacity-90"
            }`}
          >
            {busy ? t("chpw.btn.submitting") : t("chpw.btn.submit")}
          </button>
        </form>
      </main>
    </div>
  );
}
