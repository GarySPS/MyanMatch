// src/pages/Profile.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import PlusBadge from "../components/PlusBadge";
import { useI18n } from "../i18n";

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

function getLocalUser() {
  try {
    return JSON.parse(localStorage.getItem("myanmatch_user") || "{}");
  } catch {
    return {};
  }
}

export default function Profile() {
  const navigate = useNavigate();
  const { t } = useI18n(); // ← i18n

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [uiName, setUiName] = useState("You");
  const [isVerified, setIsVerified] = useState(false);
  const [isPlus, setIsPlus] = useState(false);
  const [language, setLanguage] = useState("en");

  const [coin, setCoin] = useState(0);
  const [boostActive, setBoostActive] = useState(false);
  const [boostUntil, setBoostUntil] = useState(null);

  const [msg, setMsg] = useState("");
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [usersId, setUsersId] = useState(null);

  const [planNorm, setPlanNorm] = useState("free");
  const [planExpiryISO, setPlanExpiryISO] = useState(null);

  const local = useMemo(() => getLocalUser(), []);
  const userId = local.user_id || local.id || null;




  async function reload() {
    if (!userId) {
      setLoading(false);
      return;
    }

    const { data: prof } = await supabase
      .from("profiles")
      .select(
        "id,user_id,first_name,last_name,is_verified,is_plus,coin,membership_plan,boosted_until,language"
      )
      .or(`user_id.eq."${userId}",id.eq."${userId}"`)
      .maybeSingle();

    const uid = prof?.user_id || userId;
    setUsersId(uid);

    const first = prof?.first_name || local?.first_name || "";
    const last = prof?.last_name || local?.last_name || "";
    setUiName(((first + " " + last).trim()) || "You");
    setIsVerified(!!prof?.is_verified);
const norm = normalizePlan(prof?.membership_plan);
setPlanNorm(norm);
// premium features available for both plus and x (keep your behavior)
setIsPlus(norm === "plus" || norm === "x");

// optional expiry for later use if you want
setPlanExpiryISO(prof?.membership_expires_at ?? null);

    setCoin(Number(prof?.coin ?? 0));
    setLanguage(prof?.language || "en");

    const until = prof?.boosted_until ? new Date(prof.boosted_until) : null;
    const active = !!until && until.getTime() > Date.now();
    setBoostActive(active);
    setBoostUntil(until?.toISOString() ?? null);

    setLoading(false);
  }

  useEffect(() => {
    let ok = true;
    (async () => {
      setLoading(true);
      await reload();
      if (ok) setLoading(false);
    })();
    return () => {
      ok = false;
    };
  }, [userId]);

  // initialize language quickly from localStorage to avoid flicker
  useEffect(() => {
    if (local?.language) setLanguage(local.language);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleBoost() {
    setMsg("");
    if (!userId) {
      setMsg("Please sign in first.");
      return;
    }
    if (busy) return;

    if (boostActive && boostUntil) {
      setMsg(`Boost already active until ${fmtTime(boostUntil)}.`);
      setShowBoostModal(false);
      return;
    }
    if ((Number(coin) || 0) < BOOST_PRICE) {
      setMsg(
        `Not enough coins. Need ${fmtCoins(BOOST_PRICE)} (you have ${fmtCoins(
          coin
        )}).`
      );
      return;
    }

    setBusy(true);
    try {
      let uid = usersId || userId;
      const { error } = await supabase.rpc("activate_profile_boost", {
        p_user_id: uid,
        p_price: BOOST_PRICE,
      });
      if (error) throw error;

      await reload();
      setMsg(
        "🚀 Boost activated! You’ll appear on Users Of The Day for 24 hours."
      );
      setShowBoostModal(false);
    } catch (e) {
      setMsg(e.message || "Boost failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function doLocalSignOut() {
    try {
      await supabase.auth.signOut();
    } catch {}
    try {
      localStorage.removeItem("myanmatch_user");
      localStorage.removeItem("myanmatch_token");
      localStorage.removeItem("onboarding_state");
      localStorage.removeItem("myanmatch_profile_draft");
      localStorage.removeItem("myanmatch_plus");
      localStorage.removeItem("myanmatch_cache");
    } catch {}
    navigate("/");
  }

  function handleLogout() {
    if (busy) return;
    setShowLogoutModal(true);
  }

  const canBoost =
    (Number(coin) || 0) >= BOOST_PRICE && !(boostActive && boostUntil);

  /* ---------- UI ---------- */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse w-72 h-8 rounded-full bg-white/10" />
      </div>
    );
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
          //<NavDivider />
          //<NavRow label={t("nav.whatworks")} icon="💡" onClick={() => navigate("/WhatWorksPage")} />
          //<NavRow label={t("nav.photoGuide")} icon="📸" onClick={() => navigate("/PhotoGuidePage")} />
          //<NavRow label={t("nav.promptGuide")} icon="💬" onClick={() => navigate("/PromptGuidePage")} />
          //<NavRow label={t("nav.matchingGuide")} icon="❤️" onClick={() => navigate("/MatchingGuidePage")} />
          //<NavRow label={t("nav.convGuide")} icon="🗨️" onClick={() => navigate("/ConversationGuidePage")} />
          //<NavDivider />

          {/* ✅ Customer Support row added here */}
          <NavRow
            label="Customer Support"
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
  label="Download"
  icon="⬇️"
  onClick={() => navigate("/Download")}
/>
          <NavRow label={t("nav.changePw")} icon="🔒" onClick={() => navigate("/ChangePassword")} />
          <NavRow label={t("nav.acctSecurity")} icon="🛡️" onClick={() => navigate("/AccountSecurityPage")} />
          <NavDivider />

          <NavRow label={t("nav.logout")} icon="🚪" onClick={handleLogout} />
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
          onConfirm={async () => {
            setBusy(true);
            try {
              await doLocalSignOut();
            } finally {
              setBusy(false);
            }
          }}
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
