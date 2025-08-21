// src/pages/PricingPage.jsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import Layout from "../components/Layout";
import { FaCrown, FaBolt, FaUndo, FaInfinity, FaHeart, FaEye, FaFire } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../i18n";

/** ---------- Config ---------- */
const PROMO_ACTIVE = true; // toggle to false when promo ends
const SUB_DURATION_DAYS = 30; // monthly length
const COIN_PRICING = {
  PLUS: { normal: 20000, promo: 10000 },
  X: { normal: 30000, promo: 15000 },
  UPGRADE_PLUS_TO_X: { normal: 10000, promo: 5000 },
};

/** ---------- Helpers ---------- */
function normalizePlan(p) {
  const s = String(p || "").toLowerCase().trim();
  if (["plus", "myanmatch+", "myanmatch plus", "myanmatchplus"].includes(s)) return "plus";
  if (["x", "myanmatchx", "myanmatch x"].includes(s)) return "x";
  return "free";
}

function getLocalUserId() {
  try {
    const u = JSON.parse(localStorage.getItem("myanmatch_user") || "{}");
    return u?.user_id || u?.id || null;
  } catch {
    return null;
  }
}
const fmtCoins = (n) => `${Number(n || 0).toLocaleString()} coins`;
const addDaysISO = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleString([], { month: "short", day: "numeric", year: "numeric" }) : "";

export default function PricingPage() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [userId, setUserId] = useState(null);
  const [row, setRow] = useState(null);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const balance = row?.coin ?? 0;
  const currentPlan = row?.membership_plan || "free";
  const expiresAt = row?.membership_expires_at || null;
  const planNorm = normalizePlan(row?.membership_plan);
  const displayPlan = planNorm === "plus" ? "MyanMatch+" : planNorm === "x" ? "MyanMatchX" : "free";


  const prices = useMemo(() => {
    const usePromo = PROMO_ACTIVE;
    return {
      plus: usePromo ? COIN_PRICING.PLUS.promo : COIN_PRICING.PLUS.normal,
      x: usePromo ? COIN_PRICING.X.promo : COIN_PRICING.X.normal,
      upgrade: usePromo
        ? COIN_PRICING.UPGRADE_PLUS_TO_X.promo
        : COIN_PRICING.UPGRADE_PLUS_TO_X.normal,
    };
  }, []);

  // localized benefits
  const BENEFITS = useMemo(
    () => ({
      PLUS: [
        { icon: <FaHeart />, text: t("pricing.b.plus.swaps50") },
        { icon: <FaEye />, text: t("pricing.b.common.seeLikes") },
      ],
      X: [
        { icon: <FaInfinity />, text: t("pricing.b.x.unlimitedSwaps") },
        { icon: <FaEye />, text: t("pricing.b.common.seeLikes") },
        { icon: <FaCrown />, text: t("pricing.b.x.advancedPref") },
        { icon: <FaFire />, text: t("pricing.b.x.boost1day") },
        { icon: <FaUndo />, text: t("pricing.b.x.undo5") },
      ],
    }),
    [t]
  );

  /** ---------- Load profile (+ auto-downgrade if expired) ---------- */
  useEffect(() => {
    const id = getLocalUserId();
    setUserId(id);
    if (!id) {
      setLoading(false);
      setMessage(t("pricing.msg.signInFirst"));
      return;
    }
    (async () => {
      setLoading(true);

      let { data, error } = await supabase
        .from("profiles")
        .select("id,user_id,coin,membership_plan,membership_expires_at")
        .eq("user_id", id)
        .maybeSingle();

      if (!data && error?.code === "PGRST116") {
        const ins = await supabase
          .from("profiles")
          .insert({ user_id: id, coin: 0, membership_plan: "free", membership_expires_at: null })
          .select("id,user_id,coin,membership_plan,membership_expires_at")
          .maybeSingle();
        data = ins.data || null;
      }

      // Auto-downgrade if expired
      if (
        data &&
        data.membership_plan !== "free" &&
        data.membership_expires_at &&
        new Date(data.membership_expires_at).getTime() <= Date.now()
      ) {
        await supabase
          .from("profiles")
          .update({ membership_plan: "free", membership_expires_at: null })
          .eq("user_id", id);
        data.membership_plan = "free";
        data.membership_expires_at = null;
      }

      setRow(data || null);
      setLoading(false);
    })();
  }, [t]);

  async function refresh() {
    if (!userId) return;
    const { data } = await supabase
      .from("profiles")
      .select("id,user_id,coin,membership_plan,membership_expires_at")
      .eq("user_id", userId)
      .maybeSingle();
    setRow(data || null);
  }

async function purchase(target) {
  if (!row) return;
  setMessage("");
  setBusy(true);
  try {
    const have = row.coin ?? 0;
    const planNormNow = normalizePlan(currentPlan);
    const now = Date.now();

    // ❌ Block buying X again while X is still active
    if (
      target === "x" &&
      planNormNow === "x" &&
      expiresAt &&
      new Date(expiresAt).getTime() > now
    ) {
      setBusy(false);
      setMessage(t("pricing.msg.xAlreadyActive", { date: fmtDate(expiresAt) }));
      return;
    }

    // ✅ Correct pricing (upgrade uses discounted upgrade price)
    const cost =
      target === "plus"
        ? prices.plus
        : planNormNow === "plus"
        ? prices.upgrade
        : prices.x;

    if (have < cost) {
      setMessage(t("pricing.msg.notEnough", { need: fmtCoins(cost), have: fmtCoins(have) }));
      setBusy(false);
      return;
    }

const newBalance = have - cost;
const newPlan = target === "plus" ? "plus" : "x";

// keep expiry when upgrading from PLUS to X
const isUpgradeToX =
  target === "x" &&
  planNormNow === "plus" &&
  expiresAt &&
  new Date(expiresAt).getTime() > now;

const newExpiry = isUpgradeToX ? expiresAt : addDaysISO(SUB_DURATION_DAYS);

    const shouldAutoBoost = newPlan === "x";
    const boostUntil = shouldAutoBoost ? addDaysISO(1) : null;

    setRow((r) =>
      r
        ? {
            ...r,
            coin: newBalance,
            membership_plan: newPlan,
            membership_expires_at: newExpiry,
            boosted_until: boostUntil ?? r.boosted_until,
          }
        : r
    );

    const updatePayload = {
      coin: newBalance,
      membership_plan: newPlan,
      membership_expires_at: newExpiry,
      ...(shouldAutoBoost ? { boosted_until: boostUntil } : {}),
    };

    const { error: updErr } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("user_id", userId);

    if (updErr) {
      await refresh();
      throw updErr;
    }

    const baseMsg =
      newPlan === "plus"
        ? t("pricing.msg.nowPlus", { days: SUB_DURATION_DAYS, date: fmtDate(newExpiry) })
        : t("pricing.msg.nowX", { days: SUB_DURATION_DAYS, date: fmtDate(newExpiry) });

    const boostMsg = shouldAutoBoost ? " " + t("pricing.msg.boostActivated") : "";
    setMessage(baseMsg + boostMsg);
  } catch (e) {
    setMessage(e.message || t("pricing.msg.somethingWrong"));
  } finally {
    setBusy(false);
  }
}


const alreadyPlus = planNorm === "plus";
const alreadyX = planNorm === "x";
const showUpgradeBtn = alreadyPlus && !alreadyX;
const xActive = alreadyX && expiresAt && new Date(expiresAt).getTime() > Date.now();
const canBuyX = showUpgradeBtn || !xActive;

const plusActive = alreadyPlus && expiresAt && new Date(expiresAt).getTime() > Date.now();
const canBuyPlus = !plusActive && !xActive; // block while PLUS or X is active

const isActivePaid = (alreadyPlus || alreadyX) && !!expiresAt;
const expired = isActivePaid && new Date(expiresAt).getTime() <= Date.now();

  return (
    <Layout title={t("pricing.titleWindow")}>
      {/* Plain layout background (matches Home) */}
      <div
        className="min-h-[calc(100vh-80px)] w-full"
        style={{ background: "transparent", boxShadow: "none" }}
      >
        <div className="max-w-5xl mx-auto px-4 py-10" style={{ background: "transparent" }}>
          {/* Header */}
          <div className="text-center mb-8">
            {PROMO_ACTIVE && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#fff6ea] border border-[#e9d9c5] text-[#8a0f1b]">
                <FaCrown className="opacity-90" />
                <span className="text-sm font-semibold tracking-wide">{t("pricing.ribbon")}</span>
              </div>
            )}
            <h1 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              {t("pricing.title")}
            </h1>
            <p className="mt-2 text-white/80">
              {t("pricing.subtitle", { days: SUB_DURATION_DAYS })}{" "}
              {PROMO_ACTIVE ? t("pricing.subtitlePromo") : ""}
            </p>
          </div>

          {/* Balance card */}
          <div className="mx-auto mb-8 max-w-xl">
            <div className="rounded-2xl p-5 bg-[#fff6ea] text-[#8a0f1b] shadow-[0_10px_30px_rgba(0,0,0,0.12)] border border-[#e9d9c5]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm uppercase tracking-wider text-[#a47b62]">{t("pricing.currentBalance")}</div>
                  <div className="text-2xl font-extrabold">{loading ? "…" : fmtCoins(balance)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm uppercase tracking-wider text-[#a47b62]">{t("pricing.currentPlan")}</div>
                  <div className="text-xl font-bold capitalize">
                    {loading ? "…" : displayPlan}
                  </div>
                </div>
              </div>

              {isActivePaid && !expired && (
                <div className="mt-3 text-sm">
                  <span className="text-[#a47b62]">{t("pricing.expiresOn")}:</span>{" "}
                  <span className="font-semibold">{fmtDate(expiresAt)}</span>
                </div>
              )}
              {expired && (
                <div className="mt-3 text-sm text-[#a5101d] font-semibold">
                  {t("pricing.expired")}
                </div>
              )}

              <div className="mt-3 text-xs text-[#a47b62]">
                {t("pricing.refundNote")}
              </div>
            </div>
          </div>

          {/* Plans */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* PLUS */}
            <div className="relative rounded-2xl bg-[#fff6ea] text-[#531016] border border-[#e9d9c5] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
              {PROMO_ACTIVE && (
                <div className="absolute -top-3 left-4 bg-[#ffd7de] text-[#a5101d] text-xs font-bold px-3 py-1 rounded-full border border-[#f2b9c1]">
                  {t("pricing.badge50")}
                </div>
              )}
              <div className="flex items-center gap-2">
                <FaCrown />
                <h3 className="text-xl font-extrabold">MyanMatch+</h3>
              </div>
              <p className="mt-2 text-sm text-[#8d6b58]">{t("pricing.plusDesc")}</p>
              <div className="mt-4 flex items-end gap-2">
                <div className="text-3xl font-extrabold">{fmtCoins(prices.plus)}</div>
                <div className="text-sm text-[#a47b62]">{t("pricing.perDays", { days: SUB_DURATION_DAYS })}</div>
                <div className="text-sm text-[#a47b62] line-through">
                  {fmtCoins(COIN_PRICING.PLUS.normal)}
                </div>
              </div>
              <ul className="mt-5 space-y-2 text-sm">
                {BENEFITS.PLUS.map((b, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#ffe8d1] border border-[#e9d9c5]">
                      {b.icon}
                    </span>
                    <span>{b.text}</span>
                  </li>
                ))}
              </ul>
              
{/* PLUS action button (corrected) */}
<button
  className={`mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold 
    ${
      !canBuyPlus || busy
        ? "bg-[#e7e1d9] text-[#8d6b58] cursor-not-allowed"
        : "bg-[#a5101d] text-white hover:opacity-95 active:opacity-90"
    }`}
  disabled={!canBuyPlus || busy}
  onClick={() => {
    if (!canBuyPlus) {
      if (plusActive) setMessage(t("pricing.msg.plusAlreadyActive", { date: fmtDate(expiresAt) }));
      else if (xActive) setMessage(t("pricing.msg.xAlreadyActive", { date: fmtDate(expiresAt) }));
      return;
    }
    purchase("plus");
  }}
  type="button"
>
  <FaCrown />
  {alreadyPlus
    ? t("pricing.btn.renewPlus", { price: fmtCoins(prices.plus) }) // shows if PLUS expired
    : t("pricing.btn.getPlus", { price: fmtCoins(prices.plus) })}
</button>

              {alreadyX && <div className="mt-2 text-xs text-[#8d6b58]">{t("pricing.noteOnX")}</div>}
            </div>

            {/* X */}
            <div className="relative rounded-2xl bg-[#fff6ea] text-[#531016] border border-[#e9d9c5] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
              {PROMO_ACTIVE && (
                <div className="absolute -top-3 left-4 bg-[#ffd7de] text-[#a5101d] text-xs font-bold px-3 py-1 rounded-full border border-[#f2b9c1]">
                  {t("pricing.badge50")}
                </div>
              )}
              <div className="flex items-center gap-2">
                <FaCrown />
                <h3 className="text-xl font-extrabold">MyanMatchX</h3>
              </div>
              <p className="mt-2 text-sm text-[#8d6b58]">{t("pricing.xDesc")}</p>

              {showUpgradeBtn ? (
                <div className="mt-4 flex items-end gap-2">
                  <div className="text-3xl font-extrabold">{fmtCoins(prices.upgrade)}</div>
                  <div className="text-sm text-[#a47b62]">{t("pricing.upgradeFromPlus")}</div>
                  <div className="text-sm text-[#a47b62] line-through">
                    {fmtCoins(COIN_PRICING.UPGRADE_PLUS_TO_X.normal)}
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex items-end gap-2">
                  <div className="text-3xl font-extrabold">{fmtCoins(prices.x)}</div>
                  <div className="text-sm text-[#a47b62]">{t("pricing.perDays", { days: SUB_DURATION_DAYS })}</div>
                  <div className="text-sm text-[#a47b62] line-through">{fmtCoins(COIN_PRICING.X.normal)}</div>
                </div>
              )}

              <ul className="mt-5 space-y-2 text-sm">
                {BENEFITS.X.map((b, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#ffe8d1] border border-[#e9d9c5]">
                      {b.icon}
                    </span>
                    <span>{b.text}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold 
                  ${
                    false
                      ? "bg-[#e7e1d9] text-[#8d6b58] cursor-not-allowed"
                      : "bg-[#a5101d] text-white hover:opacity-95 active:opacity-90"
                  }`}
                disabled={busy}
                onClick={() => purchase("x")}
              >
                <FaBolt />
                {alreadyX
                  ? t("pricing.btn.renewX", { price: fmtCoins(prices.x) })
                  : showUpgradeBtn
                  ? t("pricing.btn.upgradeToX", { price: fmtCoins(prices.upgrade) })
                  : t("pricing.btn.getX", { price: fmtCoins(prices.x) })}
              </button>

            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
