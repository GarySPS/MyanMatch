// src/pages/UserProfilePage.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { FaCheckCircle, FaSearch, FaHeart, FaEllipsisV } from "react-icons/fa";
import {
  FaVenusMars, FaRulerVertical, FaBriefcase, FaGraduationCap, FaHome, FaBook,
  FaGlobeAmericas, FaBalanceScale, FaGlassWhiskey, FaSmoking, FaCannabis,
  FaSyringe, FaChild, FaUsers, FaCommentDots, FaTransgender
} from "react-icons/fa";
import PhotoLikeModal from "../components/PhotoLikeModal";
import { canSwapToday, logSwap } from "../lib/swaps";
import { useI18n } from "../i18n";

/* ---------- helpers ---------- */
function renderValue(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  if (typeof value === "string" && value.startsWith("[") && value.endsWith("]")) {
    try { const arr = JSON.parse(value); if (Array.isArray(arr)) return arr.filter(Boolean).join(", "); } catch {}
  }
  return value || "";
}

// ---- i18n + normalization helpers (match HomePage) ----
function norm(v) {
  if (v == null) return "";
  return String(v).trim().toLowerCase();
}

// Map common English/Burmese variants -> canonical keys used in OPTION_KEY.ethnicity
const ETH_ALIASES = {
  "karen (kayin)": "karen",
  "kayah (karenni)": "kayah",
  "rakhine (arakanese)": "rakhine",

  // Burmese -> canonical
  "ဗမာ": "bamar",
  "ကရင်": "karen",
  "ရှမ်း": "shan",
  "ကချင်": "kachin",
  "မွန်": "mon",
  "ချင်း": "chin",
  "ရခိုင်": "rakhine",
  "ကယား": "kayah",
  "အခြားတိုင်းရင်းသား": "other myanmar ethnic",
  "တရုတ်": "chinese",
  "အိန္ဒိယ": "indian",
  "အာဖရိကန်": "black/african descent",
  "အရှေ့အာရှ": "east asian",
  "တောင်အာရှ": "south asian",
  "ဟစ်စပန်နစ်/လက်တင်နို": "hispanic/latino",
  "အလယ်အာရှ": "middle eastern",
  "နေးတီးဗ် အမေရိကန်": "native american",
  "ပစိဖိတ် ကျွန်းသား": "pacific islander",
  "လူဖြူ(ကောက်ကေးရှင်း)": "white/caucasian",
  "အခြား": "other",
};

function cleanEthnicityKey(v) {
  if (v == null) return "";
  let s = String(v).trim().toLowerCase().replace(/\s*\([^)]*\)\s*/g, "");
  s = s.replace(/\s+/g, " ");
  if (ETH_ALIASES[s]) return ETH_ALIASES[s];
  return s;
}

const OPTION_KEY = {
  gender: {
    man: "gender.opt.man",
    woman: "gender.opt.woman",
    nonbinary: "gender.opt.nonbinary",
  },
  sexuality: {
    straight: "sex.opt.straight",
    gay: "sex.opt.gay",
    lesbian: "sex.opt.lesbian",
    bisexual: "sex.opt.bisexual",
    allosexual: "sex.opt.allosexual",
    androsexual: "sex.opt.androsexual",
    "prefer not to say": "sex.opt.na",
  },
  yesno: {
    yes: "drink.opt.yes",
    sometimes: "drink.opt.sometimes",
    no: "drink.opt.no",
    "prefer not to say": "drink.opt.na",
    "no preference": null,
  },
  education: {
    "high school": "edu.opt.highschool",
    undergrad: "edu.opt.undergrad",
    postgrad: "edu.opt.postgrad",
    "prefer not to say": "edu.opt.na",
  },
  children: {
    "don't have children": "children.opt.none",
    "have children": "children.opt.have",
    "have dog": "children.opt.dog",
    "have cat": "children.opt.cat",
    "have pet": "children.opt.pet",
    "prefer not to say": "children.opt.na",
  },
  familyPlans: {
    "don't want children": "fam.opt.dont",
    "want children": "fam.opt.want",
    "open to children": "fam.opt.open",
    "not sure yet": "fam.opt.unsure",
    "prefer not to say": "fam.opt.na",
  },
  politics: {
    liberal: "pol.opt.liberal",
    moderate: "pol.opt.moderate",
    conservative: "pol.opt.conservative",
    "not political": "pol.opt.notPolitical",
    other: "pol.opt.other",
    "prefer not to say": "pol.opt.na",
  },
  religion: {
    agnostic: "rel.opt.agnostic",
    atheist: "rel.opt.atheist",
    buddhist: "rel.opt.buddhist",
    catholic: "rel.opt.catholic",
    christian: "rel.opt.christian",
    hindu: "rel.opt.hindu",
    jewish: "rel.opt.jewish",
    deity: "rel.opt.deity",
    muslim: "rel.opt.muslim",
  },
  ethnicity: {
    bamar: "eth.opt.bamar",
    karen: "eth.opt.karen",
    shan: "eth.opt.shan",
    kachin: "eth.opt.kachin",
    mon: "eth.opt.mon",
    chin: "eth.opt.chin",
    rakhine: "eth.opt.rakhine",
    kayah: "eth.opt.kayah",
    "other myanmar ethnic": "eth.opt.mmOther",
    chinese: "eth.opt.chinese",
    indian: "eth.opt.indian",
    "black/african descent": "eth.opt.african",
    "east asian": "eth.opt.eastAsian",
    "south asian": "eth.opt.southAsian",
    "hispanic/latino": "eth.opt.hispanic",
    "middle eastern": "eth.opt.mideast",
    "native american": "eth.opt.native",
    "pacific islander": "eth.opt.pacific",
    "white/caucasian": "eth.opt.white",
    other: "eth.opt.other",
  },
  intention: {
    "short-term relationship": "intent.opt.short",
    "long-term relationship": "intent.opt.long",
    "short-term relationship, open to long": "intent.opt.shortOpenLong",
    "short-term, open to long": "intent.opt.shortOpenLong",
    "open to long": "intent.opt.openLong",
    "friends only": "intent.opt.friends",
    "prefer not to say": "intent.opt.na",
  },
};

function translateSingle(t, group, value) {
  const map = OPTION_KEY[group];
  if (!map || !value) return value ?? "";
  let keyLookup = norm(value);
  if (group === "ethnicity") keyLookup = cleanEthnicityKey(value);
  const key = map[keyLookup];
  return key ? t(key) : value;
}

function translateArray(t, group, value) {
  const items = Array.isArray(value)
    ? value
    : (typeof value === "string" && value.startsWith("[")
        ? (() => { try { const a = JSON.parse(value); return Array.isArray(a) ? a : []; } catch { return []; } })()
        : value ? [value] : []);
  const translated = items.map(v => translateSingle(t, group, v)).filter(Boolean);
  return [...new Set(translated)].join(", ");
}

// ---- prompt title normalizer ----
// Map plain English/Burmese prompt texts -> i18n keys, so old saved titles still translate
const PROMPT_KEY_BY_TEXT = {
  // EN
  "a quick rant about": "prompts.pool.rant",
  "the key to my heart is": "prompts.pool.keyToHeart",
  "if you get my attention then i'll give you the hints:": "prompts.pool.setupPunchline",
  "unusual skills": "prompts.pool.unusualSkills",
  "the kindest thing someone has ever done for me": "prompts.pool.kindestThing",
  "something that's non-negotiable for me is": "prompts.pool.nonNegotiable",
  "change my mind about": "prompts.pool.changeMyMind",
  "the last time i cried happy tears was": "prompts.pool.lastHappyTears",
  "my song while riding car is": "prompts.pool.cryInCarSong",
  "my happy place": "prompts.pool.happyPlace",
  "where i go when i want to feel a little more like myself": "prompts.pool.whereIGoMyself",
  "my bff's take on why you should date me": "prompts.pool.bffWhyDateMe",
  "my irrational fear is": "prompts.pool.irrationalFear",
  "my go-to comfort food": "prompts.pool.comfortFood",
  "the most spontaneous thing i’ve done": "prompts.pool.mostSpontaneous",
  "a social cause i care about": "prompts.pool.socialCause",
  "a fact about me that surprises people": "prompts.pool.factSurprises",
  "a hobby i picked up recently": "prompts.pool.hobbyRecent",
  "if i could have dinner with anyone...": "prompts.pool.dinnerWithAnyone",
  "i'm known for": "prompts.pool.knownFor",
  "a language i wish i could speak": "prompts.pool.wishLanguage",
  "the movie i can watch on repeat": "prompts.pool.repeatMovie",
  "song that describes my life": "prompts.pool.lifeSong",
  "the most adventurous place i’ve visited": "prompts.pool.adventurousPlace",
  "the most used app on my phone": "prompts.pool.mostUsedApp",

  // MM (add/adjust your exact Burmese strings as used in DB/UI)
  "အမြန် လူနာံ့တမ်း တစ်ခု": "prompts.pool.rant",
  "ငါ့ရဲ့ နှလုံးသားကီးလော့ခ်": "prompts.pool.keyToHeart",
  "ငါ့ကို စိတ်ဝင်စားစေသော် နောက်ခံဟင့့်များပေးမယ်": "prompts.pool.setupPunchline",
  "မမျှော်လင့်ထားတဲ့ ကျွမ်းကျင်မှုများ": "prompts.pool.unusualSkills",
  "တစ်ယောက်က ငါ့ကို အကောင်းဆုံးလုပ်ပေးခဲ့တာ": "prompts.pool.kindestThing",
  "ငါ့အတွက် မျပောပြောင်းနိုင်တဲ့ အရာတစ်ခု": "prompts.pool.nonNegotiable",
  "ငါ့စိတ်ကို ပြောင်းလိုက်": "prompts.pool.changeMyMind",
  "နောက်ဆုံး သာယာဝမ်းသာ တွင်ကျယ်နေရင်း မျက်ရည်ဝင်ခဲ့သည့်အခါ": "prompts.pool.lastHappyTears",
  "ကားစီးတယ်ဆိုရင် ကျွန်တော်/ကျွန်မ အကြိုက်ဆုံး သီချင်း": "prompts.pool.cryInCarSong",
  "ငါ့ရဲ့ ပျော်ရွှင်ရာနေရာ": "prompts.pool.happyPlace",
  "ငါ့ကိုယ်ငယ် ပိုစစ်စစ် လုပ်ချင်တဲ့အချိန် သွားရာနေရာ": "prompts.pool.whereIGoMyself",
  "ငါ့ကို ချိတ်ဆွဲရမယ့် အကြောင်းအရာကို ငါ့ BFF ပြောပေးမယ်": "prompts.pool.bffWhyDateMe",
  "ငါ့ရဲ့ အညံ့စား အကြောက်ပျက်": "prompts.pool.irrationalFear",
  "ငါ့ရဲ့ စိတ်ချမ်းသာအစားအစာ": "prompts.pool.comfortFood",
  "အလွန် မျှော်လင့်မထားဘဲ လုပ်ခဲ့တဲ့ အရာ": "prompts.pool.mostSpontaneous",
  "ငါ စိတ်ဝင်စားတဲ့ လူမူရေး အကြောင်းအရာ": "prompts.pool.socialCause",
  "လူတွေ အံ့ဩသွားမည့် ငါ့အကြောင်း ရ事实": "prompts.pool.factSurprises",
  "မကြာသေးခင်က စတင် လေ့လာခဲ့တဲ့ ဝါသနာ": "prompts.pool.hobbyRecent",
  "ထမင်းစားချင်ရင် သဘောတူမယ့် လူ…": "prompts.pool.dinnerWithAnyone",
  "ငါ့ကို သိကြတာ": "prompts.pool.knownFor",
  "သင်ပြောနိုင်လိုသည့် ဘာသာ": "prompts.pool.wishLanguage",
  "ထပ်ပြီး ကြည့်လို့ မ မန့်တားမည့် ရုပ်ရှင်": "prompts.pool.repeatMovie",
  "ငါ့လမ်းကြောင်းကို ဖော်ပြတဲ့ သီချင်း": "prompts.pool.lifeSong",
  "အက်စပိုင်ရာနေရာ အားလုံးထဲက အားမာန်ဆုံး": "prompts.pool.adventurousPlace",
  "ဖုန်းထဲ အများဆုံး သုံးတဲ့ app": "prompts.pool.mostUsedApp",
};

const normalizePromptText = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
const toPromptKey = (title) => PROMPT_KEY_BY_TEXT[normalizePromptText(title)] || null;

// Prompts may store keys (e.g. 'prompts.pool.rant') or plain text -> translate either way
const resolvePromptTitle = (t, p) => {
  if (!p) return "";
  const raw = String(p).trim();
  if (raw.startsWith("prompts.pool.")) return t(raw);
  const key = toPromptKey(raw);
  return key ? t(key) : raw;
};

function VerifiedBadge({ className = "" }) {
  const { t } = useI18n();
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold 
                  bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/30 ${className}`}
      title={t("home.verified")}
    >
      <FaCheckCircle className="text-sky-400" size={12} />
      {t("home.verified")}
    </span>
  );
}

/* ---------- Gift modal (same as HomePage, localized) ---------- */
function GiftSendModal({ open, onClose, senderId, receiverId, onSent, presetComment }) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [selectedGift, setSelectedGift] = useState(null);
  const [comment, setComment] = useState(presetComment || "");

  useEffect(() => {
    if (!open || !senderId) return;
    setSelectedGift(null);
    setComment(presetComment || "");
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from("user_gifts").select("*").eq("user_id", senderId);
      setInventory(error ? [] : (data || []));
      setLoading(false);
    })();
  }, [open, senderId, presetComment]);

  async function handleSend() {
    if (!selectedGift || loading) return;
    setLoading(true);
    try {
      const { error: delErr } = await supabase
        .from("user_gifts").delete().eq("id", selectedGift.id).eq("user_id", senderId);
      if (delErr) throw delErr;

      const insertRow = {
        user_id: receiverId,
        gift_id: selectedGift.gift_id,
        name: selectedGift.name,
        image_url: selectedGift.image_url,
        purchase_price: selectedGift.purchase_price,
      };
      const { error: insErr } = await supabase.from("user_gifts").insert([insertRow]);
      if (insErr) throw insErr;

      const { error: likeErr } = await supabase.from("likes").insert([{
        from_user_id: senderId,
        to_user_id: receiverId,
        type: "gift",
        comment: comment || null,
        is_visible: true,
        created_at: new Date().toISOString(),
      }]);
      if (likeErr) throw likeErr;

      onSent?.();
      onClose?.();
    } catch (e) {
      console.error("Send gift failed:", e);
      alert(t("gift.error"));
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div className="w-[92%] max-w-md bg-white rounded-3xl shadow-2xl p-5">
        <div className="text-xl font-extrabold mb-3">{t("gift.title")}</div>

        <div className="max-h-64 overflow-auto rounded-xl border border-gray-100 p-2 mb-4">
          {loading && <div className="p-4 text-gray-500 text-center">{t("gift.loading")}</div>}
          {!loading && inventory.length === 0 && (
            <div className="p-4 text-gray-500 text-center">{t("gift.empty")}</div>
          )}
          {!loading && inventory.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {inventory.map((g) => {
                const active = selectedGift?.id === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGift(g)}
                    className={`rounded-2xl border p-2 flex flex-col items-center gap-2 transition ${
                      active ? "border-purple-500 ring-2 ring-purple-200" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <img src={g.image_url || "/images/gift.png"} alt={g.name || "Gift"} className="w-16 h-16 object-cover rounded-xl" />
                    <div className="text-xs font-semibold text-gray-700 text-center line-clamp-2">{g.name || "Gift"}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <input
          type="text"
          placeholder={t("gift.commentPH")}
          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 mb-4 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-300"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-gray-300 text-gray-700 font-semibold" disabled={loading}>
            {t("market.common.cancel")}
          </button>
          <button
            onClick={handleSend}
            disabled={!selectedGift || loading}
            className="flex-1 h-11 rounded-xl bg-gradient-to-tr from-pink-500 to-[#a259c3] text-white font-bold disabled:opacity-60"
          >
            {loading ? t("gift.sending") : t("gift.send")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- MyanMatch mobile toast ---------- */
function MMToast({ open, type = "success", text = "", onClose }) {
  if (!open) return null;
  const isErr = type === "error";
  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[80]
                 bottom-[calc(env(safe-area-inset-bottom)+110px)]"
      role="status"
      aria-live="polite"
      onClick={onClose}
    >
      <div
        className={`px-4 py-3 rounded-2xl shadow-2xl border
                    ${isErr
                      ? "bg-gradient-to-tr from-red-500 to-red-700 text-white border-white/20"
                      : "bg-gradient-to-tr from-pink-500 to-[#a259c3] text-white border-white/20"
                    }`}
      >
        <div className="font-semibold text-sm">{text}</div>
      </div>
    </div>
  );
}

function ReportModal({ open, onClose, reporterId, reportedUserId, onSubmitted, onError }) {
  const { t } = useI18n();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const REASONS = [
    t("report.r1"),
    t("report.r2"),
    t("report.r3"),
    t("report.r4"),
  ];

  async function submit() {
    if (!reason || !reporterId || !reportedUserId || submitting) return;
    setSubmitting(true);
    try {
      const uid = reporterId;
      if (!uid) {
        onError?.(t("report.err.login"));
        setSubmitting(false);
        return;
      }

      const resp = await fetch("/api/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": uid,
        },
        body: JSON.stringify({
          reported_user_id: reportedUserId,
          reason,
          details: details?.trim() || "",
        }),
      });

      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || !json?.ok) throw new Error(json?.error || "failed");

      onSubmitted?.();
      onClose?.();
      setReason("");
      setDetails("");
    } catch (e) {
      console.error(e);
      onError?.(t("report.err.generic"));
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center">
      <div className="w-[92%] max-w-md rounded-3xl overflow-hidden shadow-2xl border border-white/10">
        {/* header */}
        <div className="bg-gradient-to-b from-red-500 to-red-700 px-5 py-4">
          <div className="text-white text-lg font-extrabold tracking-widest">{t("report.title")}</div>
          <div className="text-white/80 text-sm">{t("report.subtitle")}</div>
        </div>

        {/* body */}
        <div className="bg-[#101017] text-white px-5 pt-4 pb-5">
          <div className="space-y-3">
            {REASONS.map((r) => (
              <label
                key={r}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border cursor-pointer transition
                ${reason === r ? "border-red-400 bg-white/5" : "border-white/10 hover:border-white/20"}`}
              >
                <input
                  type="radio"
                  name="report-reason"
                  value={r}
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="accent-red-500"
                />
                <span className="text-white/90">{r}</span>
              </label>
            ))}

            <div className="mt-2">
              <div className="text-sm text-white/80 mb-1">{t("report.extraLabel")}</div>
              <textarea
                rows={4}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={t("report.extraPH")}
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-red-300/40"
              />
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <button
              onClick={onClose}
              disabled={submitting}
              className="flex-1 h-11 rounded-xl border border-white/15 text-white/90 font-semibold"
            >
              {t("market.common.cancel")}
            </button>
            <button
              onClick={submit}
              disabled={!reason || submitting}
              className="flex-1 h-11 rounded-xl bg-gradient-to-tr from-red-500 to-red-600 text-white font-bold disabled:opacity-60"
            >
              {submitting ? t("report.sending") : t("report.submit")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Short ID search modal ---------- */
function ShortIdSearchModal({ open, onClose, onFound }) {
  const { t } = useI18n();
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (!open) return null;

  async function submit(e) {
    e?.preventDefault?.();
    const shortId = (val || "").trim();
    if (!shortId) return;
    setBusy(true); setErr("");
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id")
        .eq("short_id", shortId)
        .maybeSingle();
      if (error) throw error;
      if (!data?.id) { setErr(t("profile.shortidNotFound") || "Not found"); }
      else { onFound?.(data.id); onClose?.(); }
    } catch (e) {
      setErr(t("profile.shortidError") || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[75] bg-black/60 backdrop-blur-sm flex items-center justify-center">
      <form
        onSubmit={submit}
        className="w-[92%] max-w-md rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-[#101017] text-white"
      >
        <div className="bg-gradient-to-b from-purple-500 to-pink-500 px-5 py-4">
          <div className="text-white text-lg font-extrabold tracking-widest">
            {t("Profile search by ID") || "Search by ID"}
          </div>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
            <FaSearch className="text-white/70" />
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              value={val}
              onChange={(e) => setVal(e.target.value.replace(/\D+/g, ""))}
              placeholder={t("ID") || "e.g. 240929"}
              className="bg-transparent outline-none w-full"
            />
          </div>
          {err ? <div className="text-red-400 text-sm">{err}</div> : null}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl border border-white/15 text-white/90 font-semibold"
              disabled={busy}
            >
              {t("market.common.cancel")}
            </button>
            <button
              type="submit"
              className="flex-1 h-11 rounded-xl bg-gradient-to-tr from-pink-500 to-[#a259c3] text-white font-bold disabled:opacity-60"
              disabled={busy || !val}
            >
              {busy ? (t("profile.searching") || "Searching…") : (t("profile.search") || "Search")}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// [ADD] InfoTag (chip) used in “About” card (same visual as HomePage)
function InfoTag({ icon, text }) {
  if (!text) return null;
  return (
    <li className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 border border-white/10 text-sm">
      <span className="text-white/60">{icon}</span>
      <span className="text-white/90 font-medium">{text}</span>
    </li>
  );
}

/* -------------------------- Page -------------------------- */
export default function UserProfilePage() {
  const { t } = useI18n();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // photos & prompts modal
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [modalPhotoIdx, setModalPhotoIdx] = useState(1); // first photo not clickable

  // plan & busy state for daily-gate / swaps
  const [plan, setPlan] = useState("free");
  const [busy, setBusy] = useState(false);

  // gift flow
  const [giftOpen, setGiftOpen] = useState(false);
  const [giftPresetComment, setGiftPresetComment] = useState("");

  // short-id search
  const [searchOpen, setSearchOpen] = useState(false);


// ✅ report + toast (inside component)
const [reportOpen, setReportOpen] = useState(false);

const [toastOpen, setToastOpen] = useState(false);
const [toastType, setToastType] = useState("success");
const [toastText, setToastText] = useState("");

function showToast(text, type = "success") {
  setToastText(text);
  setToastType(type);
  setToastOpen(true);
  window.clearTimeout(showToast._t);
  showToast._t = window.setTimeout(() => setToastOpen(false), 2200);
}


  const navigate = useNavigate();
  const { id, userId } = useParams(); // supports /profile/:id OR /profile/:userId

  const me = JSON.parse(localStorage.getItem("myanmatch_user") || "{}");
  const myId = me?.user_id || me?.id || null;
  const viewingUserId = id || userId || myId; // if no param, show self
  const isSelf = viewingUserId && myId && String(viewingUserId) === String(myId);

  useEffect(() => {
    async function run() {
      setLoading(true);

      // my plan (for daily gate)
      if (myId) {
        const { data: meRow } = await supabase
          .from("profiles")
          .select("membership_plan")
          .eq("user_id", myId)
          .single();
        setPlan(meRow?.membership_plan || "free");
      }

      // viewed profile
      if (!viewingUserId) {
        setUser(null);
        setLoading(false);
        return;
      }

const [{ data: prof, error: profErr }, { data: urow, error: uerr }] = await Promise.all([
  supabase.from("profiles").select("*").eq("user_id", viewingUserId).maybeSingle(),
  supabase.from("users").select("id, verified_at, kyc_status, short_id").eq("id", viewingUserId).maybeSingle(),
]);

      if (profErr || uerr) {
        if (profErr) console.error("Fetch profile error:", profErr);
        if (uerr) console.error("Fetch user error:", uerr);
        setUser(null);
      } else {
        // derived verified flag from either table
        const verified = !!(prof?.is_verified) || !!(urow?.verified_at);
        setUser({
  ...(prof || {}),
  _verified: verified,
  _kyc_status: urow?.kyc_status || null,
  _short_id: urow?.short_id || null, // only shown if isSelf
});
      }
      setLoading(false);
    }

    run();
  }, [viewingUserId, myId]);

  if (loading) {
    return (
      <div className="relative min-h-screen w-full text-white overflow-hidden">
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-[#201033] via-[#120f1f] to-[#0a0a12]" />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute -top-28 -left-24 w-[22rem] h-[22rem] rounded-full bg-pink-500/25 blur-[110px]" />
          <div className="absolute -bottom-28 -right-24 w-[22rem] h-[22rem] rounded-full bg-purple-500/25 blur-[110px]" />
        </div>

        <div className="flex items-center justify-center min-h-screen">
          <div className="rounded-xl bg-white/10 border border-white/15 px-5 py-3 font-bold">
            {t("profile.loading")}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative min-h-screen w-full text-white overflow-hidden">
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-[#201033] via-[#120f1f] to-[#0a0a12]" />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute -top-28 -left-24 w-[22rem] h-[22rem] rounded-full bg-pink-500/25 blur-[110px]" />
          <div className="absolute -bottom-28 -right-24 w-[22rem] h-[22rem] rounded-full bg-purple-500/25 blur-[110px]" />
        </div>

        <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-white/10 border border-white/15 mb-3">
            <span className="font-semibold">{t("profile.oops")}</span>
          </div>
          <div className="text-2xl font-extrabold mb-2">{t("profile.notfound")}</div>
          {!isSelf && (
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-xl bg-white/10 border border-white/15"
            >
              {t("profile.goBack")}
            </button>
          )}
          {isSelf && (
            <button
              onClick={() => navigate("/EditProfilePage")}
              className="px-4 py-2 rounded-xl bg-white/10 border border-white/15"
            >
              {t("profile.edit")}
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ---------- media & prompts parsing (with storage fallback) ---------- */
  const name = user.first_name || user.name || t("home.noname");
  const verified = !!user._verified || !!user.is_verified;

  // normalize array-ish fields
  const arr = (v) => {
    if (Array.isArray(v)) return v;
    if (typeof v === "string" && v.trim().startsWith("[")) {
      try { const a = JSON.parse(v); return Array.isArray(a) ? a : []; } catch {}
    }
    return v ? [v] : [];
  };

  // convert any signed URL -> public URL (since your bucket is Public)
  const signedToPublic = (u) => {
    const s = String(u);
    const m = s.match(/storage\/v1\/object\/sign\/([^/]+)\/([^?]+)/);
    if (!m) return s;
    const [, bucket, keyRaw] = m;
    const key = decodeURIComponent(keyRaw);
    const { data } = supabase.storage.from(bucket).getPublicUrl(key);
    return data?.publicUrl || s.replace("/object/sign/", "/object/public/").split("?")[0];
  };

  // turn objects/paths/urls into displayable URLs
  const toUrl = (item) => {
    if (!item) return null;

    // object shape { url|publicUrl|signedUrl|path }
    if (typeof item === "object") {
      const u = item.url || item.publicUrl || item.signedUrl;
      if (u) return /^https?:\/\//i.test(u) ? signedToPublic(u) : u;
      if (item.path) item = item.path;
    }

    const s = String(item).trim();
    if (!s) return null;

    // already a URL
    if (/^https?:\/\//i.test(s)) return signedToPublic(s);

    // treat as storage key; default bucket is "media"
    const key = s.replace(/^public\//, "").replace(/^media\//, "");
    const bucket = s.startsWith("onboarding/") ? "onboarding" : "media";
    const { data } = supabase.storage.from(bucket).getPublicUrl(key);
    return data?.publicUrl || null;
  };

  // Prefer persistent storage paths (never expire), then fall back to any stored URLs
  const paths  = arr(user.media_paths);
  const medias = arr(user.media);
  const photoUrls = [...new Set([...paths, ...medias].map(toUrl).filter(Boolean))];

  // prompts[]
  const prompts = Array.isArray(user.prompts)
    ? user.prompts
    : (typeof user.prompts === "string" && user.prompts.startsWith("[")
        ? (() => { try { const a = JSON.parse(user.prompts); return Array.isArray(a) ? a : []; } catch { return []; } })()
        : []);

  // Voice prompt resolver
  let vp = user.voicePrompt ?? user.voiceprompt ?? user.voice_prompt ?? null;
  if (vp && typeof vp === "string") {
    try { vp = JSON.parse(vp); } catch {}
  }

  function toPublicFromPath(path, bucket = "onboarding") {
    if (!path) return null;
    const cleanBucket = bucket || "onboarding";
    const cleanPath = String(path).replace(/^public\//, "");
    const { data } = supabase.storage.from(cleanBucket).getPublicUrl(cleanPath);
    return data?.publicUrl || null;
  }

  // 1) Prefer a direct public URL
  let voiceUrl =
    (vp?.url && !String(vp.url).startsWith("blob:") ? String(vp.url) : null) || null;

  // 2) Otherwise, resolve from bucket/path
  if (!voiceUrl) {
    const path = vp?.path ?? vp?.audio_path ?? vp?.storagePath ?? null;
    const bucket = vp?.bucket || "onboarding";
    if (path) voiceUrl = toPublicFromPath(path, bucket);
  }

  // 3) Title for the card
  const voiceTitle = (vp?.prompt && String(vp.prompt).trim()) || t("home.voicePrompt");

  /* ---------- info fields (mirrors HomePage) ---------- */
  const gender = user.gender || user.genders || user.sex || null;
  const sexuality = user.orientation || user.sexuality;
  const height = user.height;
  const job = user.job || user.job_title;
  const workplace = user.workplace || null;
  const education = user.education || user.education_level;
  const school = user.school || user.education_school || null;
  const hometown = user.hometown || null;
  const politics = user.politics || user.political_belief;
  const location = user.location || user.hometown;
  const relationship = user.relationship;
  const children = user.children || user.have_children || null;
  const weed = (user.weed ?? user.cannabis) ?? null;
  const drugs = user.drugs || null;

  /* ---------- actions (same gate + logging as HomePage) ---------- */
  const handlePass = async () => {
    if (!myId || !viewingUserId || isSelf || busy) return;
    setBusy(true);
    try {
      const gate = await canSwapToday(myId, plan);
      if (!gate.ok) { alert(t("home.dailyLimit")); return; }

      const { error } = await supabase.from("pass").insert([{
        from_user_id: myId,
        to_user_id: viewingUserId,
        created_at: new Date().toISOString()
      }]);
      if (error) { console.error("Insert pass failed:", error); alert(t("home.err.pass")); return; }

      try { await logSwap({ fromUserId: myId, toUserId: viewingUserId, action: "pass" }); } catch {}
      navigate(-1);
    } finally {
      setBusy(false);
    }
  };

  const likeOrSuper = async (type, comment = null) => {
    if (!myId || !viewingUserId || isSelf || busy) return;
    setBusy(true);
    try {
      const gate = await canSwapToday(myId, plan);
      if (!gate.ok) { alert(t("home.dailyLimit")); return; }

      const { error } = await supabase.from("likes").insert([{
        from_user_id: myId,
        to_user_id: viewingUserId,
        type,
        is_visible: true,
        comment: comment || null,
        created_at: new Date().toISOString()
      }]);
      if (error) { console.error("Insert like failed:", error); alert(t("home.err.like")); return; }

      try { await logSwap({ fromUserId: myId, toUserId: viewingUserId, action: type }); } catch {}
      alert(type === "like" ? t("profile.likeSent") : t("profile.superSent"));
    } finally {
      setBusy(false);
    }
  };

  const openGiftWithOptionalComment = async (comment) => {
    if (!myId || !viewingUserId || isSelf) return;
    const gate = await canSwapToday(myId, plan);
    if (!gate.ok) { alert(t("home.dailyLimit")); return; }
    setGiftPresetComment(comment || "");
    setGiftOpen(true);
  };

  /* ---------- UI ---------- */
  return (
    <div className="relative min-h-screen w-full text-white overflow-hidden">
      {/* FULL-PAGE BACKGROUND (match HomePage) */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#201033] via-[#120f1f] to-[#0a0a12]" />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute -top-28 -left-24 w-[22rem] h-[22rem] rounded-full bg-pink-500/25 blur-[110px]" />
        <div className="absolute -bottom-28 -right-24 w-[22rem] h-[22rem] rounded-full bg-purple-500/25 blur-[110px]" />
      </div>

      {/* Fixed name bar (same style as HomePage) */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 z-40 w-full max-w-[480px] px-4 py-3 bg-white/5 backdrop-blur border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            {name}
            {verified && <VerifiedBadge className="ml-1 scale-90" />}
          </div>
<div className="ml-auto flex items-center gap-2">
  {/* Magnifier: search by Short ID */}
  <button
    onClick={() => setSearchOpen(true)}
    className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
    aria-label={t("profile.searchById") || "Search by ID"}
    title={t("profile.searchById") || "Search by ID"}
  >
    <FaSearch size={16} className="text-white/90" />
  </button>

  {isSelf ? (
    <button
      onClick={() => navigate("/EditProfilePage")}
      className="text-white/80 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold"
    >
      {t("profile.edit")}
    </button>
  ) : (
    <button
      onClick={() => setReportOpen(true)}
      className="px-3 py-1.5 rounded-2xl bg-gradient-to-b from-red-500 to-red-700
                 text-white text-[11px] font-extrabold tracking-widest uppercase
                 border border-white/10 shadow-[0_6px_24px_rgba(239,68,68,.35)]
                 hover:scale-[1.02] active:scale-95 transition"
      aria-label={t("report.title")}
      title={t("report.title")}
    >
      {t("report.title")}
    </button>
  )}
</div>
        </div>
      </div>

{/* CONTENT — same order/theme as HomePage */}
<div className="px-0 pb-40 pt-[76px] max-w-[480px] mx-auto space-y-4">
  {/* 1) photo[0] */}
  {photoUrls[0] && (
    <div className="relative group">
      <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg aspect-[4/5] bg-white/5">
        <img src={photoUrls[0]} alt="" className="w-full h-full object-cover" draggable={false} />
      </div>

      {/* open photo modal (index 0 is view-only, no like) */}
      <button
        onClick={() => { setShowPhotoModal(true); setModalPhotoIdx(0); }}
        className="absolute bottom-4 right-4 w-12 h-12 grid place-items-center rounded-full bg-black/30 backdrop-blur-sm border border-white/20 text-white
                   hover:bg-pink-500 hover:scale-110 active:scale-100 transition-all duration-200 opacity-0 group-hover:opacity-100"
        aria-label={t("home.btn.likePhoto")}
      >
        <FaHeart size={20} />
      </button>
    </div>
  )}

  {/* 2) About card (chips, identical to HomePage) */}
  <div className="mx-4 p-4 rounded-2xl bg-white/5 border border-white/10">
    <h2 className="text-lg font-bold mb-3 text-white/90">{t("profile.about", { name }) || `About ${name}`}</h2>
    <ul className="flex flex-wrap gap-2">
      {/* Self short ID (ONLY self-visible) */}
      {isSelf && user._short_id && (
        <InfoTag icon={<span>🆔</span>} text={
          <span className="inline-flex items-center gap-2">
            <span>{user._short_id}</span>
            <button
              onClick={() => { navigator.clipboard.writeText(String(user._short_id)); showToast(t("profile.copied") || "Copied"); }}
              className="px-2 py-0.5 text-[11px] rounded-lg bg-white/10 border border-white/15"
            >
              {t("copy") || "Copy"}
            </button>
          </span>
        } />
      )}

      <InfoTag icon={<FaVenusMars />} text={translateSingle(t, "gender", (user.gender || user.genders || user.sex))} />
      <InfoTag icon={<FaTransgender />} text={translateSingle(t, "sexuality", (user.orientation || user.sexuality))} />
      <InfoTag icon={<FaRulerVertical />} text={user.height} />
      <InfoTag icon={<FaBriefcase />} text={user.job || user.job_title} />
      <InfoTag icon={<FaGraduationCap />} text={translateSingle(t, "education", user.education || user.education_level)} />
      <InfoTag icon={<FaHome />} text={user.hometown} />
      <InfoTag icon={<FaBook />} text={translateArray(t, "religion", user.religion)} />
      <InfoTag icon={<FaGlobeAmericas />} text={translateArray(t, "ethnicity", user.ethnicity)} />
      <InfoTag icon={<FaBalanceScale />} text={translateSingle(t, "politics", user.politics || user.political_belief)} />
      <InfoTag icon={<FaGlassWhiskey />} text={translateSingle(t, "yesno", user.drinking)} />
      <InfoTag icon={<FaSmoking />} text={translateSingle(t, "yesno", user.smoking)} />
      <InfoTag icon={<FaCannabis />} text={translateSingle(t, "yesno", (user.weed ?? user.cannabis))} />
      <InfoTag icon={<FaSyringe />} text={translateSingle(t, "yesno", user.drugs)} />
      <InfoTag icon={<FaChild />} text={translateSingle(t, "children", user.children || user.have_children)} />
      <InfoTag icon={<FaUsers />} text={translateArray(t, "familyPlans", user.family_plans)} />
      <InfoTag icon={<FaCommentDots />} text={translateSingle(t, "intention", user.relationship)} />
    </ul>
  </div>

  {/* 3) photo[1] */}
  {photoUrls[1] && (
    <div className="mx-4 relative group">
      <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg aspect-[4/5] bg-white/5">
        <img src={photoUrls[1]} alt="" className="w-full h-full object-cover" draggable={false} />
      </div>
      <button
        onClick={() => { setShowPhotoModal(true); setModalPhotoIdx(1); }}
        className="absolute bottom-4 right-4 w-12 h-12 grid place-items-center rounded-full bg-black/30 backdrop-blur-sm border border-white/20 text-white
                   hover:bg-pink-500 hover:scale-110 active:scale-100 transition-all duration-200 opacity-0 group-hover:opacity-100"
        aria-label={t("home.btn.likePhoto")}
      >
        <FaHeart size={20} />
      </button>
    </div>
  )}

  {/* 4) photo[2] */}
  {photoUrls[2] && (
    <div className="mx-4 relative group">
      <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg aspect-[4/5] bg-white/5">
        <img src={photoUrls[2]} alt="" className="w-full h-full object-cover" draggable={false} />
      </div>
      <button
        onClick={() => { setShowPhotoModal(true); setModalPhotoIdx(2); }}
        className="absolute bottom-4 right-4 w-12 h-12 grid place-items-center rounded-full bg-black/30 backdrop-blur-sm border border-white/20 text-white
                   hover:bg-pink-500 hover:scale-110 active:scale-100 transition-all duration-200 opacity-0 group-hover:opacity-100"
        aria-label={t("home.btn.likePhoto")}
      >
        <FaHeart size={20} />
      </button>
    </div>
  )}

  {/* 5) prompt[0] (with heart button like HomePage) */}
  {prompts[0]?.prompt && prompts[0]?.answer && (
    <div className="mx-4 relative group p-5 rounded-2xl bg-white/5 border border-white/10">
      <div className="text-lime-300 font-semibold mb-1">{resolvePromptTitle(t, prompts[0].prompt)}</div>
      <p className="text-white/90 text-lg leading-relaxed">{prompts[0].answer}</p>
      {!isSelf && (
        <button
          onClick={() => openGiftWithOptionalComment(`"${prompts[0].answer}"`)}
          className="absolute top-4 right-4 w-10 h-10 grid place-items-center rounded-full bg-black/30 backdrop-blur-sm border border-white/20 text-white
                     hover:bg-pink-500 hover:scale-110 active:scale-100 transition-all duration-200 opacity-0 group-hover:opacity-100"
          aria-label={t("home.btn.likePrompt")}
        >
          <FaHeart size={18} />
        </button>
      )}
    </div>
  )}

  {/* 6) photo[3] */}
  {photoUrls[3] && (
    <div className="mx-4 relative group">
      <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg aspect-[4/5] bg-white/5">
        <img src={photoUrls[3]} alt="" className="w-full h-full object-cover" draggable={false} />
      </div>
      <button
        onClick={() => { setShowPhotoModal(true); setModalPhotoIdx(3); }}
        className="absolute bottom-4 right-4 w-12 h-12 grid place-items-center rounded-full bg-black/30 backdrop-blur-sm border border-white/20 text-white
                   hover:bg-pink-500 hover:scale-110 active:scale-100 transition-all duration-200 opacity-0 group-hover:opacity-100"
        aria-label={t("home.btn.likePhoto")}
      >
        <FaHeart size={20} />
      </button>
    </div>
  )}

  {/* 7) prompt[1] */}
  {prompts[1]?.prompt && prompts[1]?.answer && (
    <div className="mx-4 relative group p-5 rounded-2xl bg-white/5 border border-white/10">
      <div className="text-lime-300 font-semibold mb-1">{resolvePromptTitle(t, prompts[1].prompt)}</div>
      <p className="text-white/90 text-lg leading-relaxed">{prompts[1].answer}</p>
      {!isSelf && (
        <button
          onClick={() => openGiftWithOptionalComment(`"${prompts[1].answer}"`)}
          className="absolute top-4 right-4 w-10 h-10 grid place-items-center rounded-full bg-black/30 backdrop-blur-sm border border-white/20 text-white
                     hover:bg-pink-500 hover:scale-110 active:scale-100 transition-all duration-200 opacity-0 group-hover:opacity-100"
          aria-label={t("home.btn.likePrompt")}
        >
          <FaHeart size={18} />
        </button>
      )}
    </div>
  )}

  {/* 8) photo[4] */}
  {photoUrls[4] && (
    <div className="mx-4 relative group">
      <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg aspect-[4/5] bg-white/5">
        <img src={photoUrls[4]} alt="" className="w-full h-full object-cover" draggable={false} />
      </div>
      <button
        onClick={() => { setShowPhotoModal(true); setModalPhotoIdx(4); }}
        className="absolute bottom-4 right-4 w-12 h-12 grid place-items-center rounded-full bg-black/30 backdrop-blur-sm border border-white/20 text-white
                   hover:bg-pink-500 hover:scale-110 active:scale-100 transition-all duration-200 opacity-0 group-hover:opacity-100"
        aria-label={t("home.btn.likePhoto")}
      >
        <FaHeart size={20} />
      </button>
    </div>
  )}

  {/* 9) prompt[2] */}
  {prompts[2]?.prompt && prompts[2]?.answer && (
    <div className="mx-4 relative group p-5 rounded-2xl bg-white/5 border border-white/10">
      <div className="text-lime-300 font-semibold mb-1">{resolvePromptTitle(t, prompts[2].prompt)}</div>
      <p className="text-white/90 text-lg leading-relaxed">{prompts[2].answer}</p>
      {!isSelf && (
        <button
          onClick={() => openGiftWithOptionalComment(`"${prompts[2].answer}"`)}
          className="absolute top-4 right-4 w-10 h-10 grid place-items-center rounded-full bg-black/30 backdrop-blur-sm border border-white/20 text-white
                     hover:bg-pink-500 hover:scale-110 active:scale-100 transition-all duration-200 opacity-0 group-hover:opacity-100"
          aria-label={t("home.btn.likePrompt")}
        >
          <FaHeart size={18} />
        </button>
      )}
    </div>
  )}

  {/* 10) voice prompt */}
  {voiceUrl && (
    <div className="mx-4 p-5 rounded-2xl bg-white/5 border border-white/10">
      <div className="text-lime-300 font-semibold mb-2">{voiceTitle}</div>
      <audio controls src={voiceUrl} className="w-full" />
    </div>
  )}

  {/* 11) photo[5] */}
  {photoUrls[5] && (
    <div className="mx-4 relative group">
      <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg aspect-[4/5] bg-white/5">
        <img src={photoUrls[5]} alt="" className="w-full h-full object-cover" draggable={false} />
      </div>
      <button
        onClick={() => { setShowPhotoModal(true); setModalPhotoIdx(5); }}
        className="absolute bottom-4 right-4 w-12 h-12 grid place-items-center rounded-full bg-black/30 backdrop-blur-sm border border-white/20 text-white
                   hover:bg-pink-500 hover:scale-110 active:scale-100 transition-all duration-200 opacity-0 group-hover:opacity-100"
        aria-label={t("home.btn.likePhoto")}
      >
        <FaHeart size={20} />
      </button>
    </div>
  )}
</div>

      {/* MODALS */}
      <PhotoLikeModal
        open={showPhotoModal}
        photo={photoUrls[modalPhotoIdx]}
        name={name}
        onClose={() => setShowPhotoModal(false)}
        onLike={!isSelf ? ((comment) => { setShowPhotoModal(false); likeOrSuper("like", comment || null); }) : undefined}
        onSuperlike={!isSelf ? ((comment) => { setShowPhotoModal(false); openGiftWithOptionalComment(comment || ""); }) : undefined}
      />

            {/* REPORT modal + TOAST (same behavior as HomePage) */}
      {!isSelf && (
        <ReportModal
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          reporterId={myId}
          reportedUserId={viewingUserId}
          onSubmitted={() => showToast(t("report.toast.ok"), "success")}
          onError={(msg) => showToast(msg || t("report.toast.err"), "error")}
        />
      )}

      <ShortIdSearchModal
  open={searchOpen}
  onClose={() => setSearchOpen(false)}
  onFound={(foundUserId) => {
    if (!foundUserId) return;
    navigate(`/profile/${foundUserId}`);
  }}
/>

      <MMToast
        open={toastOpen}
        type={toastType}
        text={toastText}
        onClose={() => setToastOpen(false)}
      />

      {!isSelf && (
        <GiftSendModal
          open={giftOpen}
          onClose={() => setGiftOpen(false)}
          senderId={myId}
          receiverId={viewingUserId}
          onSent={() => {}}
          presetComment={giftPresetComment}
        />
      )}
    </div>
  );
}
