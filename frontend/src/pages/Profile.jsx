// src/pages/Profile.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import PlusBadge from "../components/PlusBadge";
import { useI18n } from "../i18n";
import { useAuth } from "../context/AuthContext";

const BOOST_PRICE = 3000;
const fmtCoins = (n) => `${Number(n || 0).toLocaleString()} coins`;
const fmtTime = (d) =>
  new Date(d).toLocaleString([], {
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  });

  function normalizePlan(p) {
  const s = String(p || "").toLowerCase().trim();
  if (["plus", "myanmatch+", "myanmatch plus", "myanmatchplus"].includes(s)) return "plus";
  if (["x", "myanmatchx", "myanmatch x"].includes(s)) return "x";
  return "free";
}

export default function Profile() {
  const navigate = useNavigate();
  const { t } = useI18n();

  // ✅ 1. Get EVERYTHING from the AuthContext. This is the single source of truth.
  const { profile, signOut, refreshProfile } = useAuth();

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // ✅ 2. Derive all user data directly from the `profile` object from context.
  const userId = profile?.user_id;
  const uiName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || "You";
  const coin = Number(profile?.coin ?? 0);
  const language = profile?.language || "en";
  const planNorm = normalizePlan(profile?.membership_plan);

  const boostUntil = profile?.boosted_until ? new Date(profile.boosted_until) : null;
  const boostActive = !!boostUntil && boostUntil.getTime() > Date.now();

  const canBoost = coin >= BOOST_PRICE && !boostActive;

  // ✅ 3. The `handleBoost` function is simplified. It calls `refreshProfile` on success.
  async function handleBoost() {
    setMsg("");
    if (!userId || busy) return;

    if (boostActive) {
      setMsg(t("nav.boostActive", { time: fmtTime(boostUntil) }));
      return;
    }
    if (coin < BOOST_PRICE) {
      setMsg(`Not enough coins. Need ${fmtCoins(BOOST_PRICE)}.`);
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.rpc("activate_profile_boost", {
        p_user_id: userId,
        p_price: BOOST_PRICE,
      });
      if (error) throw error;

      await refreshProfile(); // Refresh the central auth state
      setShowBoostModal(false);
      
    } catch (e) {
      setMsg(e.message || "Boost failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  
  // ✅ 4. The Logout function now uses the CORRECT `signOut` from context.
  async function handleLogout() {
    if (busy) return;
    setBusy(true);
    try {
      await signOut();
      navigate("/"); // Navigate after sign-out is complete
    } catch (error) {
      console.error("Sign out failed", error);
    } finally {
      setBusy(false);
      setShowLogoutModal(false);
    }
  }
  

  return (
    <div className="relative min-h-dvh w-full text-white overflow-hidden">
      {/* Full-page background (overrides Layout) */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#201033] via-[#120f1f] to-[#0a0a12]" />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute -top-24 -left-28 w-[22rem] h-[22rem] rounded-full bg-fuchsia-500/25 blur-[110px]" />
        <div className="absolute -bottom-32 -right-24 w-[24rem] h-[24rem] rounded-full bg-violet-500/25 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/5 backdrop-blur border-b border-white/10">
        <div className="px-4 h-[56px] flex items-center gap-3">
          <h1 className="text-lg font-extrabold tracking-tight">{t("settings.title")}</h1>
{planNorm === "plus" && <PlusBadge className="scale-90" />}
{planNorm === "x" && (
  <span className="ml-1 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold bg-[#FFD84D] text-black border border-black/10">
    ✨ MyanMatchX
  </span>
)}
          <button
            onClick={() => navigate("/PricingPage")}
            className="ml-auto px-3 py-1.5 rounded-full bg-[#FFD84D] text-black text-sm font-bold hover:opacity-90"
            type="button"
          >
            ✨ Upgrade
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+96px)]">
        {/* Profile summary / wallet — removed */}
        <div className="mt-1" />

        {/* Navigation list */}
        <nav className="mt-4 rounded-3xl border border-white/10 bg-white/5 backdrop-blur shadow">
          <NavRow label={t("nav.viewProfile")} icon="👤" onClick={() => navigate("/me")} />
          <NavRow
            label={t("nav.editProfile")}
            icon="📝"
            onClick={() => navigate("/EditProfilePage")}
          />
          <NavRow
            label={t("nav.verify")}
            icon="✅"
            onClick={() => navigate("/VerifyYourIdentityPage")}
          />
          <NavRow
            label={t("nav.pref")}
            icon="🎯"
            onClick={() => navigate("/settings/preferences")}
          />
          <NavRow
            label={t("nav.plan")}
            icon="💳"
            onClick={() => navigate("/PricingPage")}
          />
          <NavDivider />
          <NavRow
            label={
              boostActive && boostUntil
                ? t("nav.boostActive", { time: fmtTime(boostUntil) })
                : t("nav.boost")
            }
            icon="🚀"
            rightText={boostActive ? "Active" : "Buy"}
            disabled={busy || (boostActive && !!boostUntil)}
            onClick={() => {
              if (boostActive && boostUntil) {
                setMsg(t("nav.boostActive", { time: fmtTime(boostUntil) }));
                return;
              }
              setShowBoostModal(true);
            }}
          />

{/* ✅ Customer Support row added here */}
<NavRow
  label={t("nav.support")} 
  icon="📞"
  onClick={() => window.open("https://t.me/myanmatch", "_blank")}
/>

          <NavRow
            label={t("nav.language")}
            icon="🌐"
            rightText={language === "my" ? t("lang.myanmar") : t("lang.english")}
            onClick={() => navigate("/settings/language")}
          />

<NavRow
  label={t("nav.download")}
  icon="⬇️"
  onClick={() => navigate("/Download")}
/>
          <NavRow label={t("nav.changePw")} icon="🔒" onClick={() => navigate("/ChangePassword")} />
          <NavRow label={t("nav.acctSecurity")} icon="🛡️" onClick={() => navigate("/AccountSecurityPage")} />
          <NavDivider />

          <NavRow label={t("nav.logout")} icon="🚪" onClick={() => setShowLogoutModal(true)} />
          <NavRow label={t("nav.delete")} icon="🗑️" onClick={() => navigate("/DeleteAccount")} />
        </nav>

        {msg && (
          <div className="mt-4 text-center">
            <div className="inline-block px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm">
              {msg}
            </div>
          </div>
        )}

        <p className="text-center text-[12px] text-white/70 mt-4">
          {t("tip.fresh")}
        </p>
      </main>

      {/* Modals */}
      {showBoostModal && (
        <BoostModal
          onClose={() => setShowBoostModal(false)}
          onConfirm={handleBoost}
          busy={busy}
          balance={coin}
          price={BOOST_PRICE}
          canBoost={canBoost}
        />
      )}

{showLogoutModal && (
  <LogoutModal
    onClose={() => setShowLogoutModal(false)}
    onConfirm={handleLogout} // <-- Use the new, correct logout handler
    busy={busy}
  />
)}
    </div>
  );
}

/* --------- small components --------- */
function NavRow({ label, icon, onClick, disabled, rightText }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      type="button"
      className={`w-full flex items-center gap-4 px-5 py-4 text-left transition
        ${disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-white/5"}`}
    >
      <span className="text-xl" aria-hidden>
        {icon}
      </span>
      <span className="flex-1 text-[15px] font-semibold">{label}</span>
      <span className="text-white/60 text-sm" aria-hidden>
        {rightText ? rightText : "›"}
      </span>
    </button>
  );
}

function NavDivider() {
  return <div className="h-px bg-white/10" />;
}

/* Modals left unchanged (English copy) to match your current i18n keys. */
function BoostModal({ onClose, onConfirm, busy, balance, price, canBoost }) {
  const notEnough = (Number(balance) || 0) < (price || 0);
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative max-w-sm w-[92%] rounded-3xl border border-white/10 bg-white/10 backdrop-blur p-6 shadow-2xl text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xl font-extrabold">{t("boost.title")}</div>
          <button
            onClick={onClose}
            className="px-2 py-1 rounded-full hover:bg-white/10"
            type="button"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

       <div className="text-sm leading-relaxed text-white/90">
         {t("boost.desc")}
       </div>

        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-white/70">{t("boost.price")}</span>
          <span className="font-bold">{fmtCoins(price)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-sm">
          <span className="text-white/70">{t("boost.balance")}</span>
          <span className="font-semibold">{fmtCoins(balance)}</span>
        </div>

        {notEnough && (
         <div className="mt-3 text-xs text-rose-200">
           {t("boost.notEnough")}
         </div>
        )}

        <button
          onClick={onConfirm}
          disabled={!canBoost || busy}
          className={`mt-5 w-full rounded-full px-5 py-3 text-sm font-bold transition
            ${
              !canBoost || busy
                ? "bg-white/10 border border-white/15 text-white/60 cursor-not-allowed"
                : "bg-[#FFD84D] text-black hover:opacity-90"
            }`}
          type="button"
        >
          {busy ? t("boost.processing") : t("boost.button", { price: fmtCoins(price) })}
        </button>
      </div>
    </div>
  );
}

function LogoutModal({ onClose, onConfirm, busy }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative max-w-sm w-[92%] rounded-3xl border border-white/10 bg-white/10 backdrop-blur p-6 shadow-2xl text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xl font-extrabold">Log out</div>
          <button
            onClick={onClose}
            className="px-2 py-1 rounded-full hover:bg-white/10"
            type="button"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="text-sm leading-relaxed text-white/90">
          You’re about to log out of <strong>MyanMatch</strong>.
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-3 text-sm font-bold border border-white/15 bg-white/5 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`rounded-full px-4 py-3 text-sm font-bold ${
              busy
                ? "bg-white/10 text-white/60 cursor-not-allowed"
                : "bg-[#FFD84D] text-black hover:opacity-90"
            }`}
          >
            {busy ? "Signing out…" : "Log out"}
          </button>
        </div>
      </div>
    </div>
  );
}
