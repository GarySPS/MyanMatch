// src/pages/HomePage.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { FaCheckCircle, FaGift } from "react-icons/fa";
import { FaTimes, FaHeart } from "react-icons/fa";
import {
  FaEllipsisV, FaVenusMars, FaRulerVertical, FaBriefcase, FaMapMarkerAlt,
  FaGraduationCap, FaHome, FaBook, FaGlobeAmericas, FaBalanceScale,
  FaGlassWhiskey, FaSmoking, FaCannabis, FaSyringe, FaChild, FaUsers,
  FaCommentDots, FaTransgender,
} from "react-icons/fa";
import PhotoLikeModal from "../components/PhotoLikeModal";
import { canSwapToday, logSwap } from "../lib/swaps";
import { useI18n } from "../i18n";

const API_BASE = import.meta.env.VITE_API_URL || "";
// put this just after renderValue(...)
function calcAgeFromBirthdate(birthdate) {
  if (!birthdate) return null;
  const d = new Date(birthdate);
  if (isNaN(d)) return null;
  const diff = Date.now() - d.getTime();
  const ageDt = new Date(diff);
  return Math.abs(ageDt.getUTCFullYear() - 1970);
}
function getAge(u) {
  if (typeof u?.age === "number") return u.age;
  return calcAgeFromBirthdate(u?.birthdate);
}
// ---- geo / distance helpers ----
function num(v) {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : null;
}
function pickCoord(obj, keys) {
  for (const k of keys) {
    const v = obj?.[k];
    const n = num(v);
    if (n != null) return n;
  }
  return null;
}
function getCoord(u) {
  // We tolerate many possible column names
  const lat = pickCoord(u, ["geo_lat", "latitude", "lat", "lat_deg", "latd"]);
  const lng = pickCoord(u, ["geo_lng", "longitude", "lng", "lon", "long", "long_deg"]);
  return (lat == null || lng == null) ? { ok: false } : { ok: true, lat, lng };
}
function toRad(d) { return (d * Math.PI) / 180; }
function distanceKm(lat1, lng1, lat2, lng2) {
  // Haversine
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


// ---- preference matching helpers ----
function coerceArray(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === "string" && v.startsWith("[")) {
    try { const a = JSON.parse(v); return Array.isArray(a) ? a : []; } catch { return []; }
  }
  return v ? [v] : [];
}

function photoCount(u) {
  const parseArr = (v) =>
    Array.isArray(v)
      ? v
      : (typeof v === "string" && v.trim().startsWith("[")
          ? (() => { try { const a = JSON.parse(v); return Array.isArray(a) ? a : []; } catch { return []; } })()
          : v ? [v] : []);

  const m = parseArr(u.media);
  const p = parseArr(u.media_paths);
  // de-dupe strings/objects -> stringify for uniqueness
  const merged = [...m, ...p].filter(Boolean);
  const uniq = Array.from(new Set(merged.map(x => typeof x === "string" ? x : JSON.stringify(x))));
  return uniq.length;
}

function hasVoicePrompt(u) {
  let vp = u.voicePrompt ?? u.voiceprompt ?? u.voice_prompt ?? null;
  if (vp && typeof vp === "string") { try { vp = JSON.parse(vp); } catch {} }
  if (!vp) return false;

  // direct url present (and not a blob:)
  if (vp.url && !String(vp.url).startsWith("blob:")) return true;

  // or saved storage path
  if (vp.path || vp.audio_path || vp.storagePath) return true;

  return false;
}

function normalizeYesNoPref(raw) {
  // Maps "Yes|Sometimes|No|Prefer not to say|No preference" into a set we can test
  const val = String(raw || "No preference");
  return val;
}

function fieldValueAsOption(uVal) {
  // Normalizes profile habit fields to one of the options if possible
  if (uVal == null) return "";
  const s = String(uVal).trim();
  const lower = s.toLowerCase();
  if (["yes","often","frequently","socially"].includes(lower)) return "Yes";
  if (["sometimes","occasionally"].includes(lower)) return "Sometimes";
  if (["no","never"].includes(lower)) return "No";
  if (lower.startsWith("prefer")) return "Prefer not to say";
  return s; // already a compatible option
}

// Map common English/Burmese variants -> canonical keys used in OPTION_KEY.ethnicity
const ETH_ALIASES = {
  "karen (kayin)": "karen",
  "kayah (karenni)": "kayah",
  "rakhine (arakanese)": "rakhine",
  "kayin": "karen",

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
  // lower, trim, and drop anything in parentheses
  let s = String(v).trim().toLowerCase().replace(/\s*\([^)]*\)\s*/g, "");
  // collapse multiple spaces
  s = s.replace(/\s+/g, " ");
  // alias to canonical key if we know it
  if (ETH_ALIASES[s]) return ETH_ALIASES[s];
  return s;
}

// ADD: normalize preference gender values to profile's canonical values
function normalizeGenderKey(v) {
  const s = String(v || "").trim().toLowerCase();
  if (["women", "female", "girl", "girls", "lady", "ladies"].includes(s)) return "woman";
  if (["men", "male", "boy", "boys", "guy", "guys"].includes(s)) return "man";
  if (["non-binary", "non binary", "nb", "enby"].includes(s)) return "nonbinary";
  return s;
}

// ---- i18n mapping helpers for profile values ----
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
    "friendship": "intent.opt.friends",
    "life partner": "intent.opt.long",
    "long-term relationship, open to short": "intent.opt.long",
    "prefer not to say": "intent.opt.na",
  },

};


function norm(v) {
  if (v == null) return "";
  return String(v).trim().toLowerCase();
}

function translateSingle(t, group, value) {
  const map = OPTION_KEY[group];
  if (!map || !value) return value ?? "";

  let keyLookup = norm(value);
  if (group === "ethnicity") {
    keyLookup = cleanEthnicityKey(value);
  }

  const key = map[keyLookup];
  return key ? t(key) : value;
}


function translateArray(t, group, value) {
  const items = Array.isArray(value)
    ? value
    : (typeof value === "string" && value.startsWith("[")
        ? (() => { try { const a = JSON.parse(value); return Array.isArray(a) ? a : []; } catch { return []; } })()
        : value ? [value] : []);

  // translate, drop empties, de-dupe
  const translated = items.map(v => translateSingle(t, group, v)).filter(Boolean);
  return [...new Set(translated)].join(", ");
}

function normalizeIntentionText(v) {
  const s = String(v || "").trim().toLowerCase();
  const MAP = {
    "friendship": "friends only",
    "friends only": "friends only",
    "friends": "friends only",
    "life partner": "long-term relationship",
    "long-term relationship, open to short": "long-term relationship",
    "figuring out my dating goals": "prefer not to say",

    // unify short-term “open to long” variants
    "short-term, open to long": "short-term relationship, open to long",
    "open to long": "short-term relationship, open to long",

    // tolerate missing hyphens
    "short term relationship": "short-term relationship",
    "long term relationship": "long-term relationship",
  };
  return MAP[s] || s;
}


// Prompts may store keys (e.g. 'prompts.pool.rant') or plain text
const resolvePromptTitle = (t, p) => (p && p.startsWith("prompts.pool.")) ? t(p) : p;

// Return true if `user` matches `prefs`
function matchesPreferences(user, prefs, myAge) {
  // 1) Age
  const a = getAge(user);
  if (Number.isFinite(a)) {
    if (typeof prefs.age_min === "number" && a < prefs.age_min) return false;
    if (typeof prefs.age_max === "number" && a > prefs.age_max) return false;
  }

// 2) Show me (genders)
const wantGenders = coerceArray(prefs.genders).map(normalizeGenderKey);
if (wantGenders.length) {
  const g = normalizeGenderKey(user.gender || user.genders || user.sex || "");
  if (!wantGenders.includes(g)) return false;
}


  // 3) Quality
  if (prefs.verified_only && !user.is_verified && !user.kyc_verified) return false;
  if (prefs.has_voice && !hasVoicePrompt(user)) return false;

  // 4) Habits (only apply if user set a specific choice; "No preference" skips)
  const habits = ["smoking","drinking","weed","drugs"];
  for (const h of habits) {
    const pref = normalizeYesNoPref(prefs[h]);
    if (pref && pref !== "No preference") {
      const uVal = fieldValueAsOption(user[h]);
      if (!uVal) return false;
      if (uVal !== pref) return false;
    }
  }

  // 5) Optional multi-selects — apply only when user selected some
  const optionalMulti = [
    ["religion", (u) => coerceArray(u.religion).map(String)],
    ["politics", (u) => coerceArray(u.politics ?? u.political_belief).map(String)],
    ["family_plans", (u) => coerceArray(u.family_plans).map(String)],
    ["ethnicity", (u) => coerceArray(u.ethnicity).map(v => cleanEthnicityKey(v))],
  ];
  for (const [key, uGetter] of optionalMulti) {
    const chosen = coerceArray(prefs[key]).filter(Boolean);
    if (chosen.length) {
      const uVals = uGetter(user).map(v =>
  key === "ethnicity" ? cleanEthnicityKey(v) : String(v).toLowerCase()
);
      const want = chosen.map(v =>
  key === "ethnicity" ? cleanEthnicityKey(v) : String(v).toLowerCase()
);
      const overlap = want.some(v => uVals.includes(v));
      if (!overlap) return false;
    }
  }

// 5b) Relationship intention (prefs.relationship is array; profile is string)
// We normalize common synonyms so DP labels and profile labels connect.
{
  const chosen = coerceArray(prefs.relationship).filter(Boolean);
  if (chosen.length) {
    const uRel = normalizeIntentionText(user.relationship);
    const want = chosen.map(normalizeIntentionText);
    if (!want.includes(uRel)) return false;
  }
}


// 6) Education level (single; apply only if user chose a specific one)
// normalize both sides to lowercase canonical
if (prefs.education_level && prefs.education_level !== "No preference") {
  const uEdu = (user.education_level || user.education || "").toString().trim();
  if (!uEdu) return false;
  const canon = (s) => String(s || "").trim().toLowerCase();
  if (canon(uEdu) !== canon(prefs.education_level)) return false;
}


  // 7) Distance (optional)
  return true;
}

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

/* ---------- Gift modal ---------- */
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
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error(t("report.err.login"));
      }

      const resp = await fetch(`${API_BASE}/api/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          reported_user_id: reportedUserId,
          reason,
          details: details?.trim() || "",
        }),
      });

      if (!resp.ok) {
        const json = await resp.json().catch(() => ({}));
        throw new Error(json?.error || `Request failed with status ${resp.status}`);
      }

      onSubmitted?.();
      onClose?.();
      setReason("");
      setDetails("");
    } catch (e) {
      console.error("Report submission failed:", e);
      onError?.(e.message || t("report.err.generic"));
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

// [!ADD!] This new helper component before the HomePage component
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
export default function HomePage() {
  const { t } = useI18n();

  const [profiles, setProfiles] = useState([]);
  const [index, setIndex] = useState(0);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [modalPhotoIdx, setModalPhotoIdx] = useState(0);
  const [plan, setPlan] = useState("free");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

    // Optional: reload if localStorage user changes in another tab/window
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "myanmatch_user") {
        window.location.reload();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Gift flow
  const [giftOpen, setGiftOpen] = useState(false);
  const [giftPresetComment, setGiftPresetComment] = useState("");
  const [reportOpen, setReportOpen] = useState(false);

  // Toast (page-level)
  const [toastOpen, setToastOpen] = useState(false);
  const [toastType, setToastType] = useState("success");
  const [toastText, setToastText] = useState("");

  // ✅ FIXED: Added the missing showToast helper function
  function showToast(text, type = "success") {
    setToastText(text);
    setToastType(type);
    setToastOpen(true);
    if (showToast.timer) clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
      setToastOpen(false);
    }, 3000);
  }

  // === SAFE CURRENT USER ID (prevents bad queries) ===
  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem("myanmatch_user") || "{}"); }
    catch { return {}; }
  })();

  // accept only a UUID-like id (prevents sending user_id=eq.)
  const myId = (() => {
    const c = currentUser || {};
    const id = c.user_id || c.id || "";
    return typeof id === "string" && /^[0-9a-f-]{20,}$/i.test(id) ? id : null;
  })();

  useEffect(() => {
    async function fetchProfiles() {
      setLoading(true);

      if (!myId) {
        console.warn("HomePage: no valid myId in localStorage; skipping profile fetch.");
        setProfiles([]);
        setLoading(false);
        return;
      }

      // Fetch current user's profile and preferences
      const { data: me } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", myId)
        .maybeSingle();
      
      const planStr = (me?.membership_plan || "free").toLowerCase();
      setPlan(planStr);

      const { data: prefsRow } = await supabase
        .from("preferences")
        .select("*")
        .eq("user_id", myId)
        .maybeSingle();

      const prefs = { age_min: 18, age_max: 80, genders: [], distance_km: 100, ...(prefsRow || {}) };

      // Determine which genders to show, with fallbacks
      let wantGenders = coerceArray(prefs.genders).map(normalizeGenderKey).filter(Boolean);
      if (wantGenders.length === 0 && me?.interested_in) {
        const interested = typeof me.interested_in === 'string' && me.interested_in.startsWith('[')
          ? JSON.parse(me.interested_in)
          : me.interested_in;
        wantGenders = coerceArray(interested).map(normalizeGenderKey).filter(Boolean);
      }
      
      // Get IDs of users already passed or liked
      const { data: passes } = await supabase.from("pass").select("to_user_id").eq("from_user_id", myId);
      const passedIds = (passes ?? []).map(p => p.to_user_id);

      const { data: likes } = await supabase.from("likes").select("to_user_id").eq("from_user_id", myId);
      const likedIds = (likes ?? []).map(l => l.to_user_id);

      const excludeIds = Array.from(new Set([myId, ...passedIds, ...likedIds]));

      // Build the query
      let q = supabase
        .from("profiles")
        .select("*")
        .eq('is_bot', false)
        .not("user_id", "in", `(${excludeIds.join(",")})`);

      if (wantGenders.length > 0) {
        q = q.in("gender", wantGenders);
      }
      
      if (prefs.age_min) q = q.gte('age', prefs.age_min);
      if (prefs.age_max) q = q.lte('age', prefs.age_max);
      
      const { data, error } = await q;
      
      if (error) {
        console.error("Fetch profiles error:", error);
        setProfiles([]);
        setLoading(false);
        return;
      }

      // Client-side filtering for non-database fields
      const myAge = getAge(me);
      const myCoordProbe = getCoord(me || {});
      const myCoord = myCoordProbe.ok ? { lat: myCoordProbe.lat, lng: myCoordProbe.lng } : null;

      const withDist = (data || []).map((u) => {
        const c = getCoord(u);
        const d = (myCoord && c.ok) ? distanceKm(myCoord.lat, myCoord.lng, c.lat, c.lng) : Infinity;
        return { ...u, _distKm: d };
      });
      
      const filtered = withDist.filter((u) => matchesPreferences(u, prefs, myAge));

      const sorted = filtered.sort((a, b) => {
          const aAge = getAge(a);
          const bAge = getAge(b);
          const my = Number.isFinite(myAge) ? myAge : 200;
          const aDelta = Number.isFinite(aAge) ? Math.abs(aAge - my) : Infinity;
          const bDelta = Number.isFinite(bAge) ? Math.abs(bAge - my) : Infinity;
          const ageCmp = aDelta - bDelta;
          if (ageCmp !== 0) return ageCmp;
          return a._distKm - b._distKm;
      });

      setIndex(0);
      setProfiles(sorted);
      setLoading(false);
    }

    fetchProfiles();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchProfiles();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [myId]);

  /* ---------- early outs ---------- */
  if (loading) {
    return (
      <div className="relative min-h-screen w-full text-white overflow-hidden">
        {/* full-page background */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-[#201033] via-[#120f1f] to-[#0a0a12]" />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute -top-28 -left-24 w-[22rem] h-[22rem] rounded-full bg-pink-500/25 blur-[110px]" />
          <div className="absolute -bottom-28 -right-24 w-[22rem] h-[22rem] rounded-full bg-purple-500/25 blur-[110px]" />
        </div>

        <div className="flex items-center justify-center min-h-screen">
          <div className="rounded-xl bg-white/10 border border-white/15 px-5 py-3 font-bold">
            {t("home.loading")}
          </div>
        </div>
      </div>
    );
  }

  if (!profiles.length || index >= profiles.length) {
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
            <span className="font-semibold">{t("home.empty.ribbon")}</span>
          </div>
          <div className="text-2xl font-extrabold mb-2">{t("home.empty.title")}</div>
          <div className="text-white/85 max-w-sm">
            {t("home.empty.desc")}
          </div>
        </div>
      </div>
    );
  }

  /* ---------- current profile data ---------- */
  const user = profiles[index];
  const name = user.first_name || user.name || t("home.noname");
  const verified = !!user.is_verified;
  const ageDisplay = getAge(user);

  // convert any signed URL -> public URL (bucket is public)
  const signedToPublic = (u) => {
    const s = String(u || "");
    const m = s.match(/storage\/v1\/object\/sign\/([^/]+)\/([^?]+)/);
    if (!m) return s;
    const [, bucket, keyRaw] = m;
    const key = decodeURIComponent(keyRaw);
    const { data } = supabase.storage.from(bucket).getPublicUrl(key);
    return data?.publicUrl || s.replace("/object/sign/", "/object/public/").split("?")[0];
  };

  // turn objects/paths/urls into displayable URLs (same logic as UserProfilePage)
  const toUrl = (item) => {
    if (!item) return null;
    if (typeof item === "object") {
      const u = item.url || item.publicUrl || item.signedUrl;
      if (u) return /^https?:\/\//i.test(u) ? signedToPublic(u) : u;
      if (item.path) item = item.path;
    }
    const s = String(item).trim();
    if (!s) return null;
    if (/^https?:\/\//i.test(s)) return signedToPublic(s);

    const key = s.replace(/^public\//, "").replace(/^media\//, "");
    const bucket = s.startsWith("onboarding/") ? "onboarding" : "media";
    const { data } = supabase.storage.from(bucket).getPublicUrl(
      bucket === "onboarding" ? key.replace(/^onboarding\//, "") : key
    );
    return data?.publicUrl || null;
  };

  // gather the same set of possible fields as UserProfilePage
  const arr = (v) => {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    if (typeof v === "string") {
      const s = v.trim();
      if (s.startsWith("[")) { try { const a = JSON.parse(s); return Array.isArray(a) ? a : []; } catch {} }
      if (s.includes(",")) return s.split(",").map(x => x.trim()).filter(Boolean);
      return [s];
    }
    return [v];
  };

  const rawCandidates = [
    ...arr(user.media_paths),
    ...arr(user.media),
    ...arr(user.photos),
    ...arr(user.images),
    ...arr(user.photo_urls),
    ...arr(user.gallery),
    user.photo1, user.photo2, user.photo3, user.photo4, user.photo5, user.photo6,
  ].filter(Boolean);

  const media = [...new Set(rawCandidates.map(toUrl).filter(Boolean))];

  function isVideo(u) {
    return /\.(mp4|webm|mov|m4v|3gp)$/i.test(String(u).split("?")[0]);
  }

  function renderMedia(idx) {
    const url = media[idx];
    if (!url) return null;
    const isVid = isVideo(url);

    return (
      <div key={url || idx} className="mx-4 relative group">
        <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg aspect-[4/5] bg-white/5">
          {isVid ? (
            <video
              src={url}
              className="w-full h-full object-cover"
              playsInline
              muted
              loop
              controls
            />
          ) : (
            <img
              src={url}
              alt={`${name}'s media ${idx + 1}`}
              className="w-full h-full object-cover"
              draggable={false}
            />
          )}
        </div>
        <button
          onClick={() => { setShowPhotoModal(true); setModalPhotoIdx(idx); }}
          className="absolute bottom-4 right-4 w-12 h-12 grid place-items-center rounded-full bg-black/30 backdrop-blur-sm border border-white/20 text-white
                    hover:bg-pink-500 hover:scale-110 active:scale-100 transition-all duration-200 opacity-0 group-hover:opacity-100"
          aria-label={t("home.btn.likePhoto")}
        >
          <FaHeart size={20} />
        </button>
      </div>
    );
  }

  const prompts = Array.isArray(user.prompts)
    ? user.prompts
    : (typeof user.prompts === "string" && user.prompts.startsWith("[")
        ? (() => { try { const a = JSON.parse(user.prompts); return Array.isArray(a) ? a : []; } catch { return []; } })()
        : []);

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

  let voiceUrl =
    (vp?.url && !String(vp.url).startsWith("blob:") ? String(vp.url) : null) ||
    null;

  if (!voiceUrl) {
    const path =
      vp?.path ?? vp?.audio_path ?? vp?.storagePath ?? null;
    const bucket = vp?.bucket || "onboarding";
    if (path) voiceUrl = toPublicFromPath(path, bucket);
  }

  const voiceTitle = (vp?.prompt && String(vp.prompt).trim()) || t("home.voicePrompt");
  const gender = user.gender || user.genders || user.sex || null;
  const sexuality = user.orientation || user.sexuality;
  const height = user.height;
  const job = user.job || user.job_title;
  const education = user.education || user.education_level;
  const hometown = user.hometown || null;
  const politics = user.politics || user.political_belief;
  const relationship = user.relationship;
  const children = user.children || user.have_children || null;
  const weed = (user.weed ?? user.cannabis) ?? null;
  const drugs = user.drugs || null;

  /* ---------- actions ---------- */
  const handlePass = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const gate = await canSwapToday(myId, plan);
      if (!gate.ok) { alert(t("home.dailyLimit")); return; }

      const { error } = await supabase.from("pass").insert([{
        from_user_id: myId,
        to_user_id: user.user_id,
        created_at: new Date().toISOString()
      }]);
      if (error) { console.error("Insert pass failed:", error); alert(t("home.err.pass")); return; }

      try { await logSwap({ fromUserId: myId, toUserId: user.user_id, action: "pass" }); } catch {}
      setIndex((i) => i + 1);
    } finally {
      setBusy(false);
    }
  };

  const likeOrSuper = async (type, comment = null) => {
    if (busy) return;
    setBusy(true);
    try {
      const gate = await canSwapToday(myId, plan);
      if (!gate.ok) { alert(t("home.dailyLimit")); return; }

      const { error } = await supabase.from("likes").insert([{
        from_user_id: myId,
        to_user_id: user.user_id,
        type,
        is_visible: true,
        comment: comment || null,
        created_at: new Date().toISOString()
      }]);
      if (error) { console.error("Insert like failed:", error); alert(t("home.err.like")); return; }

      try { await logSwap({ fromUserId: myId, toUserId: user.user_id, action: type }); } catch {}
      setIndex((i) => i + 1);
    } finally {
      setBusy(false);
    }
  };

  const openGiftWithOptionalComment = async (comment) => {
    const gate = await canSwapToday(myId, plan);
    if (!gate.ok) { alert(t("home.dailyLimit")); return; }
    setGiftPresetComment(comment || "");
    setGiftOpen(true);
  };

  const afterGiftSentAdvance = () => setIndex((i) => i + 1);

  function renderPrompt(p, idx) {
    return (
      <div key={`prompt-${idx}`} className="mx-4 relative group p-5 rounded-2xl bg-white/5 border border-white/10">
        <div className="text-lime-300 font-semibold mb-1">{resolvePromptTitle(t, p.prompt)}</div>
        <p className="text-white/90 text-lg leading-relaxed">{p.answer}</p>
        <button
          onClick={() => openGiftWithOptionalComment(`"${p.answer}"`)}
          className="absolute top-4 right-4 w-10 h-10 grid place-items-center rounded-full bg-black/30 backdrop-blur-sm border border-white/20 text-white
                    hover:bg-pink-500 hover:scale-110 active:scale-100 transition-all duration-200 opacity-0 group-hover:opacity-100"
          aria-label={t("home.btn.likePrompt")}
        >
          <FaHeart size={18} />
        </button>
      </div>
    );
  }
  return (
    <div className="relative min-h-dvh w-full text-white overflow-x-hidden bg-[#101017]">
      {/* FULL-PAGE BACKGROUND (Simplified) */}
      <div className="fixed inset-0 -z-10 opacity-50">
        <div className="absolute inset-0 bg-gradient-to-b from-[#201033] via-[#120f1f] to-[#0a0a12]" />
        <div className="absolute -top-28 -left-24 w-[22rem] h-[22rem] rounded-full bg-pink-500/25 blur-[120px]" />
        <div className="absolute -bottom-28 -right-24 w-[22rem] h-[22rem] rounded-full bg-purple-500/25 blur-[120px]" />
      </div>

      {/* UI UPGRADE: Sleeker, more informative fixed header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-black/20 backdrop-blur-lg">
        <div className="w-full max-w-[480px] mx-auto flex items-center justify-between gap-3 px-4 pt-[calc(env(safe-area-inset-top)+8px)] pb-3 border-b border-white/10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              {name}
              {verified && <FaCheckCircle className="text-sky-400" size={18} title={t("home.verified")} />}
            </h1>
            <div className="flex items-center gap-2 text-sm font-medium">
              {Number.isFinite(ageDisplay) && (
                <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-white/90 font-bold">
                  {ageDisplay}
                </span>
              )}
              {Number.isFinite(user._distKm) && (
                <span className="text-white/60">~{Math.round(user._distKm)}km away</span>
              )}
            </div>
          </div>
          <button
            onClick={() => setReportOpen(true)}
            className="w-10 h-10 grid place-items-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 active:scale-95 transition-transform"
            aria-label={t("report.title")}
            title={t("report.title")}
          >
            <FaEllipsisV />
          </button>
        </div>
      </header>

      {/* CONTENT SCROLL — with adjusted padding for new header */}
      <div className="pt-[calc(env(safe-area-inset-top)+88px)] pb-[calc(env(safe-area-inset-bottom)+210px)] space-y-4">

        {/* Unified media order: photos or videos */}
        {media[0] && renderMedia(0)}

        {/* 2) About card */}
        <div className="mx-4 p-4 rounded-2xl bg-white/5 border border-white/10">
          <h2 className="text-lg font-bold mb-3 text-white/90">About {name}</h2>
          <ul className="flex flex-wrap gap-2">
            <InfoTag icon={<FaVenusMars />} text={translateSingle(t, "gender", gender)} />
            <InfoTag icon={<FaTransgender />} text={translateSingle(t, "sexuality", sexuality)} />
            <InfoTag icon={<FaRulerVertical />} text={height} />
            <InfoTag icon={<FaBriefcase />} text={job} />
            <InfoTag icon={<FaGraduationCap />} text={translateSingle(t, "education", education)} />
            <InfoTag icon={<FaHome />} text={hometown} />
            <InfoTag icon={<FaBook />} text={translateArray(t, "religion", user.religion)} />
            <InfoTag icon={<FaGlobeAmericas />} text={translateArray(t, "ethnicity", user.ethnicity)} />
            <InfoTag icon={<FaBalanceScale />} text={translateSingle(t, "politics", politics)} />
            <InfoTag icon={<FaGlassWhiskey />} text={translateSingle(t, "yesno", user.drinking)} />
            <InfoTag icon={<FaSmoking />} text={translateSingle(t, "yesno", user.smoking)} />
            <InfoTag icon={<FaCannabis />} text={translateSingle(t, "yesno", weed)} />
            <InfoTag icon={<FaSyringe />} text={translateSingle(t, "yesno", drugs)} />
            <InfoTag icon={<FaChild />} text={translateSingle(t, "children", children)} />
            <InfoTag icon={<FaUsers />} text={translateArray(t, "familyPlans", user.family_plans)} />
            <InfoTag icon={<FaCommentDots />} text={translateSingle(t, "intention", relationship)} />
          </ul>
        </div>

        {/* Continue with rest of media + prompts */}
        {media[1] && renderMedia(1)}
        {media[2] && renderMedia(2)}
        {prompts[0] && prompts[0].prompt && prompts[0].answer && renderPrompt(prompts[0], 0)}
        {media[3] && renderMedia(3)}
        {prompts[1] && prompts[1].prompt && prompts[1].answer && renderPrompt(prompts[1], 1)}
        {media[4] && renderMedia(4)}
        {prompts[2] && prompts[2].prompt && prompts[2].answer && renderPrompt(prompts[2], 2)}
        {media[5] && renderMedia(5)}

        {/* 4) Voice Prompt */}
        {voiceUrl && (
          <div className="mx-4 p-5 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-lime-300 font-semibold mb-2">{voiceTitle}</div>
            <audio controls src={voiceUrl} className="w-full" />
          </div>
        )}

      </div>

      {/* UI UPGRADE: Improved Floating Action Bar */}
      <div
        className="fixed left-0 right-0 z-30 pointer-events-none"
        style={{ bottom: `calc(env(safe-area-inset-bottom) + 88px + 16px)` }} // Positioned relative to BottomNav
      >
        <div className="w-full max-w-[480px] mx-auto px-6">
            <div className="flex items-center justify-around p-3 rounded-full bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl pointer-events-auto">
                <button
                    onClick={handlePass}
                    disabled={busy}
                    aria-label={t("home.btn.pass")}
                    className="w-16 h-16 rounded-full bg-white/10 text-white grid place-items-center shadow-lg hover:bg-white/20 active:scale-95 transition-all disabled:opacity-60"
                    title={t("home.btn.pass")}
                >
                    <FaTimes size={30} />
                </button>

                <button
                    onClick={() => openGiftWithOptionalComment("")}
                    disabled={busy}
                    aria-label={t("home.btn.gift")}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white grid place-items-center shadow-2xl shadow-purple-500/30
                                hover:scale-105 active:scale-95 transition-transform disabled:opacity-60"
                    title={t("home.btn.giftTitle")}
                >
                    <FaGift size={28} />
                </button>

                <button
                    onClick={() => likeOrSuper("like")}
                    disabled={busy}
                    aria-label={t("home.btn.like")}
                    className="w-16 h-16 rounded-full bg-white/10 text-white grid place-items-center shadow-lg hover:bg-white/20 active:scale-95 transition-all disabled:opacity-60"
                    title={t("home.btn.like")}
                >
                    <FaHeart className="text-rose-400" size={28} />
                </button>
            </div>
        </div>
      </div>

      {/* MODALS (Your existing modal components are called here) */}
      <PhotoLikeModal
        open={showPhotoModal}
        photo={media[modalPhotoIdx]}
        name={name}
        onClose={() => setShowPhotoModal(false)}
        onLike={(comment) => { setShowPhotoModal(false); likeOrSuper("like", comment || null); }}
        onSuperlike={(comment) => { setShowPhotoModal(false); openGiftWithOptionalComment(comment || ""); }}
      />

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        reporterId={myId}
        reportedUserId={user?.user_id}
        onSubmitted={() => showToast(t("report.toast.ok"), "success")}
        onError={(msg) => showToast(msg || t("report.toast.err"), "error")}
      />
      <MMToast
        open={toastOpen}
        type={toastType}
        text={toastText}
        onClose={() => setToastOpen(false)}
      />
      <GiftSendModal
        open={giftOpen}
        onClose={() => setGiftOpen(false)}
        senderId={myId}
        receiverId={user?.user_id}
        onSent={afterGiftSentAdvance}
        presetComment={giftPresetComment}
      />
    </div>
  );
}