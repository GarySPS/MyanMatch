import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaTrashAlt, FaExclamationTriangle, FaEye, FaEyeSlash } from "react-icons/fa";
import { useI18n } from "../i18n";
import { supabase } from "../supabaseClient"; // [!ADD!] Import supabase

export default function DeleteAccount() {
  const { t } = useI18n();
  const navigate = useNavigate();

  // [!MODIFIED!] Changed state from `email` to a more generic `loginInput`
  const [loginInput, setLoginInput] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // [!MODIFIED!] Updated to check `loginInput`
  const canSubmit = loginInput.trim() && password && confirmed && !busy;

  // [!REPLACED!] The entire handleDelete function is updated with new logic
  async function handleDelete(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError("");

    // Determine if the input is an email or a username
    const trimmedInput = loginInput.trim().toLowerCase();
    let emailToDelete;
    if (trimmedInput.includes('@')) {
      emailToDelete = trimmedInput; // It's a real email
    } else {
      emailToDelete = `${trimmedInput}@myanmatch.user`; // It's a username, so construct the dummy email
    }

    try {
      // 1. First, try to sign in to verify the password is correct.
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email: emailToDelete,
        password,
      });

      if (signInError || !user) {
        throw new Error(t("delete.err.invalidCredentials"));
      }

      // 2. If sign-in is successful, proceed with account deletion.
      // This requires a backend function for security.
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        throw new Error(t("delete.err.sessionExpired"));
      }

      const resp = await fetch("/api/users/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        // The body is now empty because the backend will get the user ID from the token
      });

      if (!resp.ok) {
        const json = await resp.json().catch(() => ({}));
        throw new Error(json?.error || t("delete.err.default"));
      }
      
      // 3. Clear session and local data.
      await supabase.auth.signOut();
      localStorage.removeItem("myanmatch_user");

      setDone(true);
      setTimeout(() => navigate("/signin", { replace: true }), 1500);

    } catch (err) {
      setError(err.message || t("delete.err.generic"));
      // If the error was a sign-in error, sign out any partial session.
      await supabase.auth.signOut();
    } finally {
      setBusy(false);
    }
  }


  if (done) {
    return (
      <div className="min-h-[100dvh] bg-neutral-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-neutral-900 p-8 border border-neutral-800 shadow-xl text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-emerald-600/20 flex items-center justify-center">
            <FaTrashAlt className="text-emerald-400" />
          </div>
          <h1 className="text-xl font-semibold text-white">{t("delete.done.title")}</h1>
          <p className="mt-2 text-neutral-300">{t("delete.done.body")}</p>
          <p className="mt-1 text-neutral-400">{t("delete.done.redirecting")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-neutral-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-4 text-center">
          <h1 className="text-2xl font-bold text-white">{t("delete.title")}</h1>
          <p className="mt-1 text-neutral-300">
            {t("delete.permanent1")}{" "}
            <span className="text-red-400 font-medium">{t("delete.permanent2")}</span>{" "}
            {t("delete.permanent3")}
          </p>
        </div>

        <div className="rounded-2xl border border-red-500/30 bg-gradient-to-b from-red-900/40 to-neutral-900 p-6 shadow-[0_10px_30px_-10px_rgba(255,0,0,0.35)]">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-red-600/20 flex items-center justify-center shrink-0">
              <FaExclamationTriangle className="text-red-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold">{t("delete.readFirst.title")}</h2>
              <p className="text-neutral-300 text-sm mt-1">
                {t("delete.readFirst.body")}
              </p>
            </div>
          </div>

          <form onSubmit={handleDelete} className="mt-6 space-y-4">
            <div>
              {/* [!MODIFIED!] Updated label */}
              <label className="block text-sm text-neutral-300 mb-1">{t("delete.loginLabel", "Your Username or Email")}</label>
              {/* [!MODIFIED!] Updated input */}
              <input
                type="text"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                placeholder={t("delete.loginPH", "Enter your username or email")}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-900 text-white placeholder-neutral-500 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/60"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-300 mb-1">{t("delete.passwordLabel")}</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("delete.passwordPH")}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900 text-white placeholder-neutral-500 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-red-500/60"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-neutral-400 hover:text-neutral-200"
                  aria-label={showPass ? t("delete.hidePwd") : t("delete.showPwd")}
                  title={showPass ? t("delete.hidePwd") : t("delete.showPwd")}
                >
                  {showPass ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={() => setConfirmed((c) => !c)}
                className="mt-1 h-4 w-4 rounded border-neutral-600 bg-neutral-900 text-red-500 focus:ring-red-500"
              />
              <span className="text-sm text-neutral-300">
                {t("delete.confirm")}
              </span>
            </label>

            {error ? (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 text-sm px-3 py-2">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={!canSubmit}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold transition
                ${canSubmit
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-red-900/40 text-red-300 cursor-not-allowed"}`}
            >
              <FaTrashAlt />
              {busy ? t("delete.submitting") : t("delete.submit")}
            </button>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full mt-2 rounded-xl px-4 py-3 font-medium bg-neutral-800 text-neutral-200 hover:bg-neutral-700 transition"
            >
              {t("delete.cancel")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}