// src/pages/MarketPage.jsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import {
  FaGift,
  FaCoins,
  FaArrowDown,
  FaArrowUp,
  FaStore,
  FaHistory,
  FaLightbulb,
  FaSync,
  FaCopy,
} from "react-icons/fa";
import clsx from "clsx";
import { useI18n } from "../i18n";

const BUCKET = "gift-images";

// NOTE: labels are translated at render time
const TABS = [
  { key: "buy", icon: <FaGift /> },
  { key: "sell", icon: <FaStore /> },
];

const PAYMENT_METHODS = [
  { key: "KBZpay", label: "KBZ Pay",  qr: "/payments/kpay-qr.jpg",  accountName: "Soe Pyae Sone", accountNo: "09957117174", note: "MyanMatch Dating" },
  { key: "AYApay", label: "AYA Pay", qr: "/payments/ayapay-qr.jpg", accountName: "Soe Pyae Sone", accountNo: "09957117174", note: "MyanMatch Dating" },
  { key: "Wavepay", label: "Wave Pay", qr: "/payments/wavepay-qr.jpg", accountName: "Soe Pyae Sone", accountNo: "09957117174", note: "MyanMatch Dating" },
  { key: "USDT", label: "USDT (TRC20)", qr: "/payments/usdt-qr.jpg", accountName: "USDT", accountNo: "TQsmC1Zow2wLAK5nrJXMqAnWAdhy1G8RiJ", note: "Network: TRC20 only." },
  { key: "WISE", label: "Wise Bank", qr: "/payments/wise-qr.png", accountName: "XXX", accountNo: "IBAN/Acct No here", note: "Put your email in payment note." },
];

const WITHDRAW_METHODS = [
  { key: "kpay", label: "KBZ Pay" },
  { key: "ayapay", label: "AYA Pay" },
  { key: "wavepay", label: "Wave Pay" },
  { key: "usdt", label: "USDT (TRC20)" },
  { key: "wise", label: "Wise Bank" },
];

// ---- wallet rules ----
const MIN_BALANCE = 1000;      // must keep at least this much after withdrawal
const MIN_WITHDRAW = 10000;    // minimum withdrawal amount

/* ---------------- utilities ---------------- */
const formatCoins = (n) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(Number(n || 0));

function publicGiftUrl(image_path) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(image_path);
  return data?.publicUrl || "";
}
function buildQtyMap(rows = []) {
  const m = new Map();
  for (const r of rows) {
    const k = r.gift_id;
    m.set(k, (m.get(k) || 0) + 1);
  }
  return m;
}
function groupGiftRows(rows = []) {
  // { gift_id: { ids:[], name, image_url, basePrice } }
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.gift_id)) {
      map.set(r.gift_id, {
        ids: [r.id],
        name: r.name,
        image_url: r.image_url,
        basePrice: r.purchase_price || 0,
      });
    } else {
      map.get(r.gift_id).ids.push(r.id);
    }
  }
  return [...map.entries()].map(([gift_id, v]) => ({
    gift_id,
    ...v,
    count: v.ids.length,
  }));
}

// add right after imports/utilities
function MMToast({ text, onClose }) {
  if (!text) return null;
  useEffect(() => {
    const id = setTimeout(onClose, 2200);
    return () => clearTimeout(id);
  }, [text, onClose]);

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[70]
                 bottom-[calc(env(safe-area-inset-bottom)+96px)]"
      role="status" aria-live="polite"
    >
      <div
        className="px-4 py-2 rounded-2xl bg-black/80 text-white text-sm
                   shadow-xl border border-white/10 backdrop-blur-md"
      >
        {text}
      </div>
    </div>
  );
}

/* ---------------- page ---------------- */
export default function MarketPage() {
  const { t } = useI18n();

  // state
  const [tab, setTab] = useState("buy");
  const [coin, setCoin] = useState(0);
  const [myGifts, setMyGifts] = useState([]);
  const [history, setHistory] = useState([]);
  const [pendingTx, setPendingTx] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [giftQty, setGiftQty] = useState(new Map());
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const [toast, setToast] = useState("");
  const showToast = (msg) => setToast(String(msg || ""));

  // deposit
  const [depositMethod, setDepositMethod] = useState("kpay");
  const [txRef, setTxRef] = useState("");
  const [noTxRef, setNoTxRef] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [depositMsg, setDepositMsg] = useState("");
  const [depositErr, setDepositErr] = useState("");

  // withdraw
  const [withdrawMethod, setWithdrawMethod] = useState("kpay");
  const [withdrawName, setWithdrawName] = useState("");
  const [withdrawNo, setWithdrawNo] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMsg, setWithdrawMsg] = useState("");
  const [withdrawErr, setWithdrawErr] = useState("");

  // buy/sell busy states
  const [buyingId, setBuyingId] = useState(null);
  const [sellingKey, setSellingKey] = useState(""); // gift_id or gift_id:all

  // user
  const user = JSON.parse(localStorage.getItem("myanmatch_user") || "{}");
  const userId = user.user_id || user.id;

  // derived
  const groupedInventory = useMemo(() => groupGiftRows(myGifts), [myGifts]);
  const filteredCatalog = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter(
      (g) =>
        g.name?.toLowerCase().includes(q) ||
        (g.category || "").toLowerCase().includes(q)
    );
  }, [catalog, search]);

  /* --------------- data --------------- */
  async function fetchAll() {
    if (!userId) return;
    setRefreshing(true);

    const { data: profile } = await supabase
      .from("profiles")
      .select("coin, coin_hold")
      .eq("user_id", userId)
      .single();
    setCoin(profile?.coin || 0);

    const { data: cat } = await supabase
      .from("gifts_catalog")
      .select("*")
      .eq("active", true)
      .order("price", { ascending: true });

    const resolved = (cat || []).map((g) => ({
      ...g,
      image_url: publicGiftUrl(g.image_path),
    }));
    setCatalog(resolved);

    const { data: ug, error: ugErr } = await supabase
      .from("user_gifts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (!ugErr) {
      setMyGifts(ug || []);
      setGiftQty(buildQtyMap(ug || []));
    } else {
      setMyGifts([]);
      setGiftQty(new Map());
    }

    // NEW: wallet history (deposit/withdraw) from wallet_transactions
    const { data: walletTx } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // keep gift buy/sell history from old transactions table
    const { data: giftTx } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .in("type", ["buy_gift", "sell_gift"])
      .order("created_at", { ascending: false });

    const merged =
      [...(walletTx || []), ...(giftTx || [])]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    setHistory(merged);
    setPendingTx(
      (walletTx || []).filter((x) => ["deposit", "withdraw"].includes(x.type) && x.status === "pending")
    );

    setRefreshing(false);
  }

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Sell sheet state (opened per gift)
  const [sellSheet, setSellSheet] = useState({ open: false, group: null, qty: 1 });
  function openSellSheet(group) { setSellSheet({ open: true, group, qty: 1 }); }
  function closeSellSheet() { setSellSheet({ open: false, group: null, qty: 1 }); }

  /* --------------- actions --------------- */
  async function buyGift(gift) {
    try {
      if (!userId) return showToast(t("market.msg.signInAgain"));
      if (coin < gift.price) return showToast(t("market.msg.notEnoughCoins"));
      if (buyingId) return;
      setBuyingId(gift.id);

      const { error: decErr } = await supabase.rpc("decrement_coin", {
        p_user_id: userId,
        p_amount: gift.price,
      });
      if (decErr) {
         showToast(decErr.message || t("market.err.deductFailed"));
        setBuyingId(null);
        return;
      }

      const { error: insErr } = await supabase.from("user_gifts").insert([{
        user_id: userId,
        gift_id: gift.id,
        name: gift.name,
        image_url: gift.image_url,
        purchase_price: gift.price,
      }]);
      if (insErr) {
        await supabase.rpc("increment_coin", { p_user_id: userId, p_amount: gift.price });
        showToast(insErr.message || t("market.err.addGiftFailed"));
        setBuyingId(null);
        return;
      }

      await supabase
        .from("transactions")
        .insert([{ user_id: userId, type: "buy_gift", amount: gift.price, detail: gift.name, status: "approved" }], { returning: "minimal" });

      await fetchAll();
     } catch (e) {
       showToast(e.message || t("market.err.buyError"));
    } finally {
      setBuyingId(null);
    }
  }

  async function sellQuantity(group, qty) {
    if (!group?.ids?.length) return;
    const clamped = Math.max(1, Math.min(qty, group.ids.length));
    const idsToSell = group.ids.slice(0, clamped);
    const sellPrice = Math.floor((group.basePrice || 0) * 0.8);
    const total = sellPrice * clamped;
    const key = `${group.gift_id}:qty`;

    try {
      setSellingKey(key);
      await supabase.from("user_gifts").delete().in("id", idsToSell);
      await supabase.rpc("increment_coin", { p_user_id: userId, p_amount: total });
      await supabase.from("transactions").insert(
        [{
          user_id: userId,
          type: "sell_gift",
          amount: total,
          detail: `${group.name} × ${clamped}`,
          status: "approved",
        }],
        { returning: "minimal" }
      );
      await fetchAll();
    } finally {
      setSellingKey("");
      closeSellSheet();
    }
  }

  async function sellAll(group) {
    if (!group?.ids?.length) return;
    const sellPrice = Math.floor((group.basePrice || 0) * 0.8);
    const key = `${group.gift_id}:all`;
    try {
      setSellingKey(key);
      await supabase.from("user_gifts").delete().in("id", group.ids);
      await supabase.rpc("increment_coin", { p_user_id: userId, p_amount: sellPrice * group.ids.length });
      await supabase
        .from("transactions")
        .insert([{ user_id: userId, type: "sell_gift", amount: sellPrice * group.ids.length, detail: `${group.name} × ${group.ids.length}`, status: "approved" }], { returning: "minimal" });
      await fetchAll();
    } finally {
      setSellingKey("");
    }
  }

  async function submitDepositProof() {
    if (!depositMethod) return showToast(t("market.deposit.chooseMethod"));
    if (!proofFile) return showToast(t("market.deposit.uploadScreenshotFirst"));
    try {
      setUploading(true);
      const ext = (proofFile.name.split(".").pop() || "png").toLowerCase();
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("deposit-proofs")
        .upload(path, proofFile, { upsert: false, contentType: proofFile.type || "image/png" });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("deposit-proofs").getPublicUrl(path);
      const screenshotUrl = pub?.publicUrl;
      const chosen = PAYMENT_METHODS.find((m) => m.key === depositMethod);

      await supabase
        .from("wallet_transactions")
        .insert([{
          user_id: userId,
          type: "deposit",
          status: "pending",
          amount: null,
          payment_method: depositMethod,
          tx_ref: noTxRef ? null : txRef.trim(),
          screenshot_url: screenshotUrl,
          detail: chosen?.label || depositMethod,
        }], { returning: "minimal" });

      setTxRef("");
      setProofFile(null);
      setDepositErr("");
      setDepositMsg(t("market.deposit.msgSubmitted"));
      fetchAll();
    } catch (e) {
      setDepositMsg("");
      setDepositErr(e.message || t("market.deposit.msgError"));
    } finally {
      setUploading(false);
    }
  }

  async function submitWithdrawRequest() {
    const amt = +withdrawAmount;
    const withdrawable = Math.max(0, coin - MIN_BALANCE);

    setWithdrawErr("");

    if (!withdrawMethod) return setWithdrawErr(t("market.withdraw.chooseMethod"));
    if (!withdrawName.trim()) return setWithdrawErr(t("market.withdraw.enterName"));
    if (!withdrawNo.trim()) return setWithdrawErr(t("market.withdraw.enterNo"));

    if (!amt || isNaN(amt) || amt < MIN_WITHDRAW) {
      return setWithdrawErr(t("market.withdraw.minAmount", { min: formatCoins(MIN_WITHDRAW) }));
    }

    if (amt > withdrawable) {
      return setWithdrawErr(
        t("market.withdraw.maxAmount", {
          max: formatCoins(withdrawable),
          keep: formatCoins(MIN_BALANCE),
        })
      );
    }

    const { error } = await supabase
      .from("wallet_transactions")
      .insert([{
        user_id: userId,
        type: "withdraw",
        status: "pending",
        amount: amt,
        payment_method: withdrawMethod,
        detail: `${withdrawName.trim()} | ${withdrawNo.trim()}`,
      }], { returning: "minimal" });

    if (error) {
      return setWithdrawErr(error.message || t("market.withdraw.createFailed"));
    }

    setWithdrawAmount("");
    setWithdrawName("");
    setWithdrawNo("");
    setWithdrawMsg(t("market.withdraw.msgQueued"));
    fetchAll();
  }

  /* --------------- UI --------------- */
  return (
    <div
      className={clsx(
        "min-h-dvh w-full overflow-x-hidden select-none",
        "bg-[radial-gradient(1200px_500px_at_0%_-15%,#b51f42_0%,transparent_60%),linear-gradient(145deg,#7d0f2c_0%,#47112d_100%)]",
        "text-rose-50"
      )}
    >
      {/* header / wallet */}
      <div className="px-4 pt-5 pb-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm px-5 py-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-100/90">
              <FaCoins className="text-xl" />
              <span className="text-sm font-medium">{t("market.coins")}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-extrabold tabular-nums">{formatCoins(coin)}</div>
              <button
                className={clsx(
                  "p-2 rounded-xl border border-white/10 bg-white/10 hover:bg-white/15 active:scale-95 transition",
                  refreshing && "animate-spin"
                )}
                aria-label={t("market.refresh")}
                onClick={fetchAll}
              >
                <FaSync />
              </button>
            </div>
          </div>

          {!!pendingTx.length && (
            <div className="flex flex-wrap gap-2 mt-3">
              {pendingTx.map((tx, i) => (
                <span key={i} className="text-[11px] bg-amber-100/90 text-amber-900 px-2 py-0.5 rounded-full">
                  {t("market.pending", { type: t(`market.type.${tx.type}`) })}: {tx.amount ?? "—"}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* quick actions */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          {[
            { k: "deposit", label: t("market.action.deposit"), icon: <FaArrowDown /> },
            { k: "withdraw", label: t("market.action.withdraw"), icon: <FaArrowUp /> },
            { k: "history", label: t("market.action.history"), icon: <FaHistory /> },
            { k: "whatworks", label: t("market.action.guide"), icon: <FaLightbulb /> },
          ].map((b) => (
            <button
              key={b.k}
              onClick={() => setTab(b.k)}
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm text-rose-50/90 shadow-sm flex flex-col items-center justify-center gap-1 py-2 active:scale-[0.98] transition"
            >
              <span className="text-base">{b.icon}</span>
              <span className="text-[12px] font-semibold">{b.label}</span>
            </button>
          ))}
        </div>

        {/* buy/sell tabs */}
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow">
          <div className="flex p-1.5 gap-1.5">
            {TABS.map((tTab) => (
              <button
                key={tTab.key}
                onClick={() => setTab(tTab.key)}
                className={clsx(
                  "flex-1 min-w-[110px] px-3 py-2 rounded-xl flex items-center justify-center gap-2 font-semibold transition",
                  tab === tTab.key ? "bg-rose-600 text-white shadow-inner" : "text-rose-100 hover:bg-white/10"
                )}
              >
                <span className="text-base">{tTab.icon}</span>
                <span className="text-sm">
                  {tTab.key === "buy" ? t("market.tab.buy") : t("market.tab.sell")}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* content */}
      <div className="px-4 pb-[calc(env(safe-area-inset-bottom)+112px)]">
        {/* BUY */}
        {tab === "buy" && (
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-extrabold text-lg text-rose-100">{t("market.giftStore")}</h2>
              <input
                className="ml-3 flex-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm placeholder:text-rose-200/60"
                placeholder={t("market.searchGifts")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {!filteredCatalog.length && (
              <div className="text-rose-100/70 text-center py-10 text-sm">{t("market.noGifts")}</div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {filteredCatalog.map((gift) => (
                <article
                  key={gift.id}
                  className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-lg p-3 flex flex-col items-center"
                >
                  {(giftQty.get(gift.id) || 0) > 0 && (
                    <span className="absolute top-2 right-2 text-[11px] px-2 py-0.5 rounded-full bg-white/90 text-rose-700 font-bold">
                      × {giftQty.get(gift.id)}
                    </span>
                  )}

                  <img
                    src={gift.image_url}
                    alt={gift.name}
                    className="w-24 h-24 object-contain mb-2"
                    draggable={false}
                    onError={(e) => (e.currentTarget.style.visibility = "hidden")}
                  />

                  <div className="text-[13px] font-semibold text-rose-50/90 text-center line-clamp-2">
                    {gift.name}
                  </div>
                  <div className="mt-0.5 mb-2 text-sm font-extrabold flex items-center gap-1 text-rose-50">
                    {formatCoins(gift.price)} <FaCoins />
                  </div>

                  <button
                    onClick={() => buyGift(gift)}
                    disabled={buyingId === gift.id}
                    className="w-full rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-60 text-white font-bold py-2 shadow"
                  >
                    {buyingId === gift.id ? t("market.buy.buying") : t("market.buy.buy")}
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* SELL */}
        {tab === "sell" && (
          <section>
            <h2 className="font-extrabold text-lg mb-3 text-rose-100">{t("market.sell.myGifts")}</h2>

            {!groupedInventory.length && (
              <div className="text-rose-100/70 text-center py-10 text-sm">{t("market.sell.noGifts")}</div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {groupedInventory.map((g) => {
                const sellPrice = Math.floor((g.basePrice || 0) * 0.8);
                return (
                  <article
                    key={g.gift_id}
                    className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-lg p-3 flex flex-col items-center"
                  >
                    <img src={g.image_url} alt={g.name} className="w-24 h-24 object-contain mb-2" />
                    <div className="text-[13px] font-semibold text-rose-50/90 text-center line-clamp-2">
                      {g.name} <span className="opacity-80">× {g.count}</span>
                    </div>
                    <div className="mt-0.5 mb-2 text-sm font-extrabold flex items-center gap-1 text-emerald-200">
                      {formatCoins(sellPrice)} <FaCoins /> {t("market.sell.perEach")}
                    </div>

                    {/* Single Sell button => open sheet */}
                    <button
                      onClick={() => openSellSheet(g)}
                      disabled={sellingKey === `${g.gift_id}:qty`}
                      className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-60 text-white font-bold py-2 shadow mt-1"
                    >
                      {sellingKey === `${g.gift_id}:qty` ? t("market.sell.selling") : t("market.sell.sell")}
                    </button>

                    {/* In-card sell sheet (popover) */}
                    {sellSheet.open && sellSheet.group?.gift_id === g.gift_id && (
                      <div className="absolute inset-0 z-10 rounded-2xl bg-black/70 backdrop-blur-[2px] flex items-center justify-center p-3">
                        <div className="w-full rounded-2xl bg-white text-rose-900 shadow-xl p-3">
                          <div className="text-sm font-semibold mb-1">{g.name}</div>
                          <div className="text-[12px] text-rose-700/80 mb-2">
                            {t("market.sell.receivePer", { amount: formatCoins(Math.floor((g.basePrice || 0) * 0.8)) })}
                          </div>

                          {/* qty stepper */}
                          <div className="flex items-center justify-between bg-rose-50 rounded-xl border border-rose-200 px-2 py-2 mb-2">
                            <button
                              className="px-3 py-1 rounded-lg bg-white border border-rose-200 active:scale-95"
                              onClick={() => setSellSheet(s => ({ ...s, qty: Math.max(1, s.qty - 1) }))}
                            >−</button>
                            <div className="text-base font-bold tabular-nums">
                              {sellSheet.qty} <span className="text-rose-500">/ {g.count}</span>
                            </div>
                            <button
                              className="px-3 py-1 rounded-lg bg-white border border-rose-200 active:scale-95"
                              onClick={() => setSellSheet(s => ({ ...s, qty: Math.min(g.count, s.qty + 1) }))}
                            >＋</button>
                          </div>

                          {/* total preview */}
                          <div className="text-sm mb-3">
                            {t("market.sell.total")} <b>{formatCoins(Math.floor((g.basePrice || 0) * 0.8) * sellSheet.qty)}</b> {t("market.coinsLower")}
                          </div>

                          {/* actions */}
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              className="rounded-xl border border-rose-200 bg-white text-rose-700 font-semibold py-2 active:scale-[0.98]"
                              onClick={closeSellSheet}
                            >
                              {t("market.common.cancel")}
                            </button>
                            <button
                              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 active:scale-[0.98]"
                              onClick={() => sellQuantity(g, sellSheet.qty)}
                            >
                              {t("market.common.confirm")}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* DEPOSIT */}
        {tab === "deposit" && (
          <section className="space-y-4">
            <h2 className="font-extrabold text-lg text-rose-100 text-center">
              {t("market.deposit.title", { rate: "1 coin = 1 MMK" })}
            </h2>

            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setDepositMethod(m.key)}
                  className={clsx(
                    "px-3 py-2 rounded-xl border text-sm font-semibold shadow",
                    depositMethod === m.key
                      ? "bg-rose-600 text-white border-rose-600"
                      : "bg-white/5 border-white/10 text-rose-100 hover:bg-white/10"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {(() => {
              const m = PAYMENT_METHODS.find((x) => x.key === depositMethod);
              if (!m) return null;
              return (
                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow p-4 text-rose-50/90">
                  <div className="flex flex-col items-center text-center">
                    <img
                      src={m.qr}
                      alt={`${m.label} QR`}
                      className="w-48 h-48 object-contain rounded-2xl bg-white/90 p-3 border border-white/20"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />

                    {/* Account name BELOW the QR */}
                    <div className="mt-3">
                      <div className="text-[13px] opacity-80 font-semibold">{t("market.deposit.account")}</div>
                      <div className="text-lg font-extrabold">{m.accountName}</div>
                    </div>

                    <div className="mt-2 flex items-center justify-center gap-2 text-sm">
                      <span><b>{t("market.deposit.noAddress")}:</b> {m.accountNo}</span>
                      <button
                        type="button"
                        className="px-2 py-0.5 rounded-lg bg-white/10 border border-white/15 text-[11px] inline-flex items-center gap-1"
                        onClick={() => navigator.clipboard?.writeText(m.accountNo)}
                      >
                        <FaCopy /> {t("market.deposit.copy")}
                      </button>
                    </div>

                    {m.note && <div className="mt-2 text-sm opacity-80">{m.note}</div>}
                  </div>
                </div>
              );
            })()}

            <div className="space-y-2">
              <input
                type="text"
                placeholder={t("market.deposit.txRefPlaceholder")}
                value={txRef}
                onChange={(e) => setTxRef(e.target.value)}
                disabled={noTxRef}
                className={clsx(
                  "w-full rounded-xl px-4 py-3 text-base shadow-inner placeholder:text-rose-200/70",
                  "bg-white/5 border border-white/10 text-rose-50",
                  noTxRef && "opacity-60"
                )}
              />
              <label className="flex items-center gap-2 text-xs text-rose-100/70">
                <input type="checkbox" checked={noTxRef} onChange={(e) => setNoTxRef(e.target.checked)} />
                {t("market.deposit.noTxRef")}
              </label>

              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow p-3 text-xs text-rose-50/90">
                {t("market.deposit.refundBox")}
              </div>
            </div>

            <label className="w-full rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-4 text-sm text-rose-50/90 shadow">
              <div className="font-semibold mb-1">{t("market.deposit.uploadLabel")}</div>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                className="block w-full"
              />
              {proofFile && <div className="mt-2 text-xs opacity-80">{proofFile.name}</div>}
            </label>

            <button
              onClick={submitDepositProof}
              disabled={uploading}
              className="w-full rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white py-3 shadow font-bold"
            >
              {uploading ? t("market.deposit.submitting") : t("market.deposit.submit")}
            </button>

            {depositMsg && (
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow p-3 text-rose-50/90">
                {depositMsg}
              </div>
            )}
            {depositErr && (
              <div className="rounded-2xl border border-rose-300/30 bg-rose-100/20 shadow p-3 text-rose-100">
                {depositErr}
              </div>
            )}

            <div className="text-xs text-rose-100/70 mt-1 text-center">
              {t("market.deposit.footerNote")}
            </div>
          </section>
        )}

        {/* WITHDRAW */}
        {tab === "withdraw" && (
          <section className="space-y-4">
            <h2 className="font-extrabold text-lg text-rose-100 text-center">{t("market.withdraw.title")}</h2>

            {/* payout method buttons */}
            <div className="grid grid-cols-2 gap-2">
              {WITHDRAW_METHODS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setWithdrawMethod(m.key)}
                  className={clsx(
                    "px-3 py-2 rounded-xl border text-sm font-semibold shadow",
                    withdrawMethod === m.key
                      ? "bg-rose-700 text-white border-rose-700"
                      : "bg-white/5 border-white/10 text-rose-100 hover:bg-white/10"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* payout account details */}
            <input
              type="text"
              placeholder={t("market.withdraw.namePlaceholder")}
              value={withdrawName}
              onChange={(e) => setWithdrawName(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-base shadow-inner bg-white/5 border border-white/10 text-rose-50 placeholder:text-rose-200/70"
            />
            <input
              type="text"
              placeholder={t("market.withdraw.noPlaceholder")}
              value={withdrawNo}
              onChange={(e) => setWithdrawNo(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-base shadow-inner bg-white/5 border border-white/10 text-rose-50 placeholder:text-rose-200/70"
            />

            {/* amount input with min/max rules */}
            <input
              type="number"
              min={MIN_WITHDRAW}
              max={Math.max(0, coin - MIN_BALANCE)}
              placeholder={t("market.withdraw.amountPlaceholder", {
                min: formatCoins(MIN_WITHDRAW),
                max: formatCoins(Math.max(0, coin - MIN_BALANCE)),
              })}
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-base shadow-inner bg-white/5 border border-white/10 text-rose-50 placeholder:text-rose-200/70"
            />
            <div className="text-xs text-rose-100/70">
              {t("market.withdraw.ruleText", {
                min: formatCoins(MIN_WITHDRAW),
                keep: formatCoins(MIN_BALANCE),
              })}
            </div>

            {/* submit */}
            <button
              className="w-full rounded-xl bg-rose-700 hover:bg-rose-800 text-white py-3 shadow font-bold disabled:opacity-60"
              onClick={submitWithdrawRequest}
              disabled={Math.max(0, coin - MIN_BALANCE) < MIN_WITHDRAW}
            >
              {t("market.withdraw.request")}
            </button>

            {withdrawMsg && (
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow p-3 text-rose-50/90">
                {withdrawMsg}
              </div>
            )}
            {withdrawErr && (
              <div className="rounded-2xl border border-rose-300/30 bg-rose-100/20 shadow p-3 text-rose-100">
                {withdrawErr}
              </div>
            )}

            <div className="text-xs text-rose-100/70 mt-1 text-center">
              {t("market.withdraw.footer")}
            </div>
          </section>
        )}

        {/* HISTORY */}
        {tab === "history" && (
          <section>
            <h2 className="font-extrabold text-lg text-rose-100 mb-3">{t("market.history.title")}</h2>
            <div className="flex flex-col gap-3">
              {!history.length && (
                <div className="text-rose-100/70 py-10 text-center text-sm">{t("market.history.empty")}</div>
              )}
              {history.map((tx, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-3 flex items-center gap-3 border border-white/10 bg-white/5 backdrop-blur-sm shadow"
                >
                  <span className="font-semibold flex-1 text-rose-50/90">
                    {tx.type === "buy_gift"   && <>🎁 {t("market.history.bought")} <b>{tx.detail}</b></>}
                    {tx.type === "sell_gift"  && <>🛒 {t("market.history.sold")} <b>{tx.detail}</b></>}
                    {tx.type === "deposit"    && <>💵 {t("market.history.deposit")} <i>{tx.payment_method || ""}</i> {tx.tx_ref ? `(${tx.tx_ref})` : ""}</>}
                    {tx.type === "withdraw"   && <>💸 {t("market.history.withdraw")} <i>{tx.payment_method || ""}</i></>}
                    <span className="opacity-70"> • {new Date(tx.created_at).toLocaleString()}</span>
                  </span>
                  <span
                    className={clsx(
                      "text-base font-extrabold flex items-center gap-1",
                      tx.type === "sell_gift" && "text-emerald-200",
                      tx.type === "deposit"  && "text-violet-200",
                      tx.type === "buy_gift" && "text-rose-200",
                      tx.type === "withdraw" && "text-rose-300"
                    )}
                  >
                    {["sell_gift", "deposit"].includes(tx.type) && tx.amount != null && <>+ {formatCoins(tx.amount)}</>}
                    {["buy_gift", "withdraw"].includes(tx.type) && tx.amount != null && <>- {formatCoins(tx.amount)}</>}
                    <FaCoins />
                  </span>
                  <span
                    className={clsx(
                      "ml-2 px-2 py-1 text-xs rounded-full",
                      tx.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : tx.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {tx.status || "approved"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* GUIDE */}
        {tab === "whatworks" && (
          <section className="space-y-3">
            <h2 className="font-extrabold text-lg text-rose-100">{t("market.guide.title")}</h2>
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow p-4 text-rose-50/90">
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>{t("market.guide.item1")}</li>
                <li>{t("market.guide.item2")}</li>
                <li>{t("market.guide.item3")}</li>
                <li>{t("market.guide.item4")}</li>
                <li>{t("market.guide.item5")}</li>
              </ul>
            </div>
          </section>
        )}
      </div>
      <MMToast text={toast} onClose={() => setToast("")} />

    </div>
  );
}
