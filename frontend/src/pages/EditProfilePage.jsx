import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "../i18n";
import { supabase } from "../supabaseClient";
import {
  FaPlus, FaGripVertical, FaTrash, FaChevronUp, FaChevronDown,
  FaMicrophone, FaRedo, FaPlay, FaSave
} from "react-icons/fa";

// helpers for safe audio filenames/content-types
function safeAudioExt(mime = "") {
  // "audio/webm;codecs=opus" -> "webm"
  const afterSlash = String(mime).split("/")[1] || "";
  const bare = afterSlash.split(";")[0]?.trim();
  return bare ? bare.replace(/^x-/, "") : "webm";
}
function baseMime(mime = "") {
  // "audio/webm;codecs=opus" -> "audio/webm"
  return String(mime).split(";")[0] || "";
}

// ---- media URL helpers (match HomePage behavior) ----
function signedToPublic(u) {
  const s = String(u || "");
  const m = s.match(/storage\/v1\/object\/sign\/([^/]+)\/([^?]+)/);
  if (!m) return s;
  const [, bucket, keyRaw] = m;
  const key = decodeURIComponent(keyRaw);
  const { data } = supabase.storage.from(bucket).getPublicUrl(key);
  return data?.publicUrl || s.replace("/object/sign/", "/object/public/").split("?")[0];
}

function toPublicFromPath(path, bucket = "media") {
  if (!path) return null;
  const key = String(path).replace(/^public\//, "").replace(/^media\//, "");
  const b = (String(path).startsWith("onboarding/") ? "onboarding" : bucket) || "media";
  const { data } = supabase.storage.from(b).getPublicUrl(key);
  return data?.publicUrl || null;
}

function toUrl(item) {
  if (!item) return null;

  // object forms: { url }, { publicUrl }, { signedUrl }, { path }
  if (typeof item === "object") {
    const u = item.url || item.publicUrl || item.signedUrl;
    if (u) return /^https?:\/\//i.test(u) ? signedToPublic(u) : toPublicFromPath(u);
    if (item.path) return toPublicFromPath(item.path);
  }

  const s = String(item).trim();
  if (!s) return null;

  // already a URL (maybe signed) -> make public
  if (/^https?:\/\//i.test(s)) return signedToPublic(s);

  // treat as storage key
  return toPublicFromPath(s);
}


/** ---------- Config ---------- */
// i18n prompt keys (stable ids)
const PROMPT_KEYS = [
  "prompts.pool.rant",
  "prompts.pool.keyToHeart",
  "prompts.pool.setupPunchline",
  "prompts.pool.unusualSkills",
  "prompts.pool.kindestThing",
  "prompts.pool.nonNegotiable",
  "prompts.pool.changeMyMind",
  "prompts.pool.lastHappyTears",
  "prompts.pool.cryInCarSong",
  "prompts.pool.happyPlace",
  "prompts.pool.whereIGoMyself",
  "prompts.pool.bffWhyDateMe",
  "prompts.pool.irrationalFear",
  "prompts.pool.comfortFood",
  "prompts.pool.mostSpontaneous",
  "prompts.pool.socialCause",
  "prompts.pool.factSurprises",
  "prompts.pool.hobbyRecent",
  "prompts.pool.dinnerWithAnyone",
  "prompts.pool.knownFor",
  "prompts.pool.wishLanguage",
  "prompts.pool.repeatMovie",
  "prompts.pool.lifeSong",
  "prompts.pool.adventurousPlace",
  "prompts.pool.mostUsedApp",
];

// Voice prompt keys (stable ids)
const VOICE_PROMPT_KEYS = [
  "vp.pool.rant",
  "vp.pool.favMemory",
  "vp.pool.lastBigLaugh",
  "vp.pool.bestAdvice",
  "vp.pool.hiddenTalent",
  "vp.pool.perfectWeekend",
  "vp.pool.desertIsland",
  "vp.pool.superpower",
  "vp.pool.makesMeSmile",
  "vp.pool.funFact",
];



const SEXUALITIES = [
  "Prefer not to say","Straight","Gay","Lesbian","Bisexual","Allosexual","Androsexual",
];

const RELIGION_OPTIONS = [
  "Agnostic","Atheist","Buddhist","Catholic","Christian","Hindu","Jewish","Deity","Muslim",
];

const ETHNICITY_OPTIONS = [
  "Bamar","Chin","Kachin","Kayah","Kayin","Mon","Rakhine","Shan","Other Myanmar Ethnic",
];

const EDUCATION_LEVEL_OPTIONS = ["High School","Undergrad","Postgrad","Prefer not to say"];
const GENDERS = ["man", "woman", "nonbinary"];

const CHILDREN_OPTIONS = [
  "Don't have children","Have children","Have dog","Have cat","Have pet","Prefer not to say",
];

const FAMILY_PLANS_OPTIONS = [
  "Don't want children","Want children","Open to children","Not sure yet","Prefer not to say",
];

const POLITICAL_BELIEF_OPTIONS = [
  "Liberal","Moderate","Conservative","Not Political","Other","Prefer not to say",
];

const YES_SOMETIMES_NO = ["Yes","Sometimes","No","Prefer not to say"];

const INTENTIONS = [
  "Life partner","Long-term relationship","Long-term relationship, open to short",
  "Short-term relationship, open to long","Short-term relationship","Figuring out my dating goals","Prefer not to say",
];

const EMPTY_PROMPT = { prompt: "", answer: "" };

const EMPTY_VITALS = {
  first_name: "",
  last_name: "",
  gender: "",
  birthdate: "",
  age: "",
  height: "",
  hometown: "",
  location: "",
  schools: [],
  ethnicity: [],
  children: "",
  family_plans: "",
  sexuality: "",
  religion: [],
  job_title: "",
  workplace: "",
  education_level: "",
  political_belief: "",
  relationship: "",   // text column
  drinking: "",
  smoking: "",
  weed: "",           // text column
  drugs: "",
};

/** ---------- Small UI helpers (Dark theme) ---------- */
function Card({ title, right, children, className = "" }) {
  return (
    <div className={`rounded-2xl bg-[#1b0f24]/95 border border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.35)] p-5 sm:p-6 ${className}`}>
      {(title || right) && (
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-extrabold tracking-tight text-white">{title}</div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

function Field({ label, hint, ...props }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1">
        <div className="text-sm font-semibold text-white/90">{label}</div>
        {hint && <div className="text-xs text-white/40">{hint}</div>}
      </div>
      <input
        className="w-full rounded-xl border border-white/10 bg-[#241230] text-white px-4 py-3 outline-none
                   placeholder:text-white/40 focus:border-pink-400/60 focus:ring-2 focus:ring-pink-400/20"
        {...props}
      />
    </label>
  );
}

function Select({
  label,
  options,
  value,
  onChange,
  placeholder = "Select…",
  hint,
  mobileSheet = false,
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  // normalize: accept ["A", "B"] or [{value, label}]
  const normOptions = (options || []).map(o =>
    typeof o === "string" ? { value: o, label: o } : o
  );
  const current = normOptions.find(o => o.value === value);
  const currentLabel = current?.label || "";

  const pick = (v) => { onChange({ target: { value: v } }); setOpen(false); };

  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1">
        <div className="text-sm font-semibold text-white/90">{label}</div>
        {hint && <div className="text-xs text-white/40">{hint}</div>}
      </div>

      {/* Desktop / tablet */}
      <select
        className="hidden sm:block w-full rounded-xl border border-white/10 bg-[#241230] text-white px-4 py-3 outline-none
                   focus:border-pink-400/60 focus:ring-2 focus:ring-pink-400/20"
        value={value}
        onChange={onChange}
      >
        <option value="">{placeholder}</option>
        {normOptions.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Mobile */}
      {mobileSheet ? (
        <>
          <button
            type="button"
            className="sm:hidden w-full rounded-xl border border-white/10 bg-[#241230] text-white px-4 py-3 text-left"
            onClick={() => setOpen(true)}
          >
            {currentLabel || placeholder}
          </button>

          {open && (
            <div className="sm:hidden fixed inset-0 z-50">
              <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
              <div className="absolute inset-x-0 bottom-0 bg-[#1b0f24] rounded-t-2xl p-4 max-h-[75vh] overflow-y-auto border-t border-white/10">
                <div className="h-1.5 w-10 bg-white/10 rounded-full mx-auto mb-3" />
                <div className="text-center font-semibold text-white mb-2">{label}</div>

                <button
                  className={`w-full text-left px-3 py-3 rounded-lg mb-1 ${value === "" ? "bg-white/5" : "hover:bg-white/5"} text-white`}
                  onClick={() => pick("")}
                >
                  {placeholder}
                </button>

                {normOptions.map(o => (
                  <button
                    key={o.value}
                    className={`w-full text-left px-3 py-3 rounded-lg mb-1 ${
                      o.value === value ? "bg-white/10 font-semibold text-pink-200" : "hover:bg-white/5 text-white"
                    }`}
                    onClick={() => pick(o.value)}
                  >
                    {o.label}
                  </button>
                ))}

                <button
                  className="mt-2 w-full py-2 rounded-xl border border-white/10 text-white/80"
                  onClick={() => setOpen(false)}
                >
                  {t("common.ok")}
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <select
          className="sm:hidden w-full rounded-xl border border-white/10 bg-[#241230] text-white px-4 py-3 outline-none
                     focus:border-pink-400/60 focus:ring-2 focus:ring-pink-400/20"
          value={value}
          onChange={onChange}
        >
          <option value="">{placeholder}</option>
          {normOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )}
    </label>
  );
}

function MultiSelectChips({ label, options, value = [], onChange, hint }) {
  const norm = (options || []).map(o => (typeof o === "string" ? { value: o, label: o } : o));
  const byVal = useMemo(() => Object.fromEntries(norm.map(o => [o.value, o.label])), [options]);
  const toggle = (val) => onChange(value.includes(val) ? value.filter(v => v !== val) : [...value, val]);

  return (
    <div className="block">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold text-white/90">{label}</div>
        {hint && <div className="text-xs text-white/40">{hint}</div>}
      </div>
      <div className="flex flex-wrap gap-2">
        {norm.map((o) => {
          const active = value.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => toggle(o.value)}
              className={`px-3 py-1.5 rounded-full border text-sm transition
                ${active
                  ? "bg-white/10 border-pink-300/40 text-pink-200 font-semibold"
                  : "bg-[#241230] border-white/10 text-white/85 hover:border-pink-300/30"}`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {value.length > 0 && (
        <div className="mt-2 text-xs text-white/60">
          Selected: {value.map(v => byVal[v] ?? v).join(", ")}
        </div>
      )}
    </div>
  );
}

/** ---------- Photo Slot ---------- */
 function PhotoSlot({ url, onChange, onRemove, onMoveUp, onMoveDown, draggableProps }) {
  const { t } = useI18n();
  const inputRef = useRef(null);
  const src = typeof url === "string" ? url : (url?.preview || url?.url || "");

  return (
    <div
      className="relative group rounded-2xl overflow-hidden border border-white/10 bg-[#241230] aspect-square"
      {...draggableProps}
    >
      {src ? (
        <>
          {/* Click image to REPLACE */}
          <img
            src={src}
            alt=""
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => inputRef.current?.click()}
            title={t("edit.photos.replaceTip")}
          />
          {/* hover tools */}
          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition">
            <span className="inline-flex items-center gap-1 text-xs bg-white/95 border border-gray-200 rounded-md px-2 py-1">
              <FaGripVertical /> {t("edit.photos.drag")}
            </span>
          </div>
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
            <button type="button" onClick={onMoveUp} className="p-1.5 rounded-md bg-white/95 border border-gray-200">
              <FaChevronUp />
            </button>
            <button type="button" onClick={onMoveDown} className="p-1.5 rounded-md bg-white/95 border border-gray-200">
              <FaChevronDown />
            </button>
            <button type="button" onClick={onRemove} className="p-1.5 rounded-md bg-white/95 border border-gray-200">
              <FaTrash />
            </button>
          </div>
          <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition">
            <span
              onClick={() => inputRef.current?.click()}
              className="cursor-pointer inline-flex items-center text-xs bg-white/95 border border-gray-200 rounded-md px-2 py-1"
            >
              {t("edit.common.change")}
            </span>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full h-full flex items-center justify-center text-sm text-gray-500"
        >
          <FaPlus className="mr-2" /> {t("edit.photos.add")}
        </button>
      )}

      {/* hidden file input used by both Add and Change */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const preview = URL.createObjectURL(file);
          onChange(preview, file);
        }}
      />
    </div>
  );
}

/** ---------- Utils ---------- */
function computeAge(iso) {
  if (!iso) return "";
  const birth = new Date(iso);
  if (isNaN(birth.getTime())) return "";
  const today = new Date();
  let a = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) a--;
  return a;
}

/* --- Pretty toast for notices --- */
function MMToast({ open, type = "success", text = "", onClose }) {
  if (!open) return null;
  const isErr = type === "error";
  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[90]
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


/** ---------- Main ---------- */
export default function EditProfilePage() {
  const { t } = useI18n()
  ;

  // --- Translated options (labels), canonical values unchanged ---
const GENDER_OPTIONS = useMemo(() => [
  { value: "man",       label: t("gender.opt.man") },
  { value: "woman",     label: t("gender.opt.woman") },
  { value: "nonbinary", label: t("gender.opt.nonbinary") },
], [t]);

const SEXUALITY_OPTIONS = useMemo(() => [
  { value: "Prefer not to say", label: t("sex.opt.na") },
  { value: "Straight",          label: t("sex.opt.straight") },
  { value: "Gay",               label: t("sex.opt.gay") },
  { value: "Lesbian",           label: t("sex.opt.lesbian") },
  { value: "Bisexual",          label: t("sex.opt.bisexual") },
  { value: "Allosexual",        label: t("sex.opt.allosexual") },
  { value: "Androsexual",       label: t("sex.opt.androsexual") },
], [t]);

const RELIGION_OPTIONS_T = useMemo(() => [
  { value: "Agnostic",  label: t("rel.opt.agnostic") },
  { value: "Atheist",   label: t("rel.opt.atheist") },
  { value: "Buddhist",  label: t("rel.opt.buddhist") },
  { value: "Catholic",  label: t("rel.opt.catholic") },
  { value: "Christian", label: t("rel.opt.christian") },
  { value: "Hindu",     label: t("rel.opt.hindu") },
  { value: "Jewish",    label: t("rel.opt.jewish") },
  { value: "Deity",     label: t("rel.opt.deity") },
  { value: "Muslim",    label: t("rel.opt.muslim") },
], [t]);

const ETHNICITY_OPTIONS_T = useMemo(() => [
  { value: "Bamar",                 label: t("eth.opt.bamar") },
  { value: "Chin",                  label: t("eth.opt.chin") },
  { value: "Kachin",                label: t("eth.opt.kachin") },
  { value: "Kayah",                 label: t("eth.opt.kayah") },
  { value: "Kayin",                 label: t("eth.opt.karen") },
  { value: "Mon",                   label: t("eth.opt.mon") },
  { value: "Rakhine",               label: t("eth.opt.rakhine") },
  { value: "Shan",                  label: t("eth.opt.shan") },
  { value: "Other Myanmar Ethnic",  label: t("eth.opt.mmOther") },
], [t]);

const CHILDREN_OPTIONS_T = useMemo(() => [
  { value: "Don't have children", label: t("children.opt.none") },
  { value: "Have children",       label: t("children.opt.have") },
  { value: "Have dog",            label: t("children.opt.dog") },
  { value: "Have cat",            label: t("children.opt.cat") },
  { value: "Have pet",            label: t("children.opt.pet") },
  { value: "Prefer not to say",   label: t("children.opt.na") },
], [t]);

const FAMILY_PLANS_OPTIONS_T = useMemo(() => [
  { value: "Don't want children", label: t("fam.opt.dont") },
  { value: "Want children",       label: t("fam.opt.want") },
  { value: "Open to children",    label: t("fam.opt.open") },
  { value: "Not sure yet",        label: t("fam.opt.unsure") },
  { value: "Prefer not to say",   label: t("fam.opt.na") },
], [t]);

const INTENTIONS_T = useMemo(() => [
  { value: "Life partner",                                label: t("intent.opt.lifePartner") },
  { value: "Long-term relationship",                      label: t("intent.opt.long") },
  { value: "Long-term relationship, open to short",       label: t("intent.opt.longOpenShort") },
  { value: "Short-term relationship, open to long",       label: t("intent.opt.shortOpenLong") },
  { value: "Short-term relationship",                     label: t("intent.opt.short") },
  { value: "Figuring out my dating goals",                label: t("intent.opt.figuring") },
  { value: "Prefer not to say",                           label: t("intent.opt.na") },
], [t]);

const EDUCATION_OPTIONS_T = useMemo(() => [
  { value: "High School",          label: t("edu.opt.highschool") },
  { value: "Undergrad",            label: t("edu.opt.undergrad") },
  { value: "Postgrad",             label: t("edu.opt.postgrad") },
  { value: "Prefer not to say",    label: t("edu.opt.na") },
], [t]);

const POLITICAL_OPTIONS_T = useMemo(() => [
  { value: "Liberal",             label: t("pol.opt.liberal") },
  { value: "Moderate",            label: t("pol.opt.moderate") },
  { value: "Conservative",        label: t("pol.opt.conservative") },
  { value: "Not Political",       label: t("pol.opt.notPolitical") },
  { value: "Other",               label: t("pol.opt.other") },
  { value: "Prefer not to say",   label: t("pol.opt.na") },
], [t]);

const DRINK_OPTIONS = useMemo(() => [
  { value: "Yes", label: t("drink.opt.yes") },
  { value: "Sometimes", label: t("drink.opt.sometimes") },
  { value: "No", label: t("drink.opt.no") },
  { value: "Prefer not to say", label: t("drink.opt.na") },
], [t]);

const SMOKE_OPTIONS = useMemo(() => [
  { value: "Yes", label: t("smoke.opt.yes") },
  { value: "Sometimes", label: t("smoke.opt.sometimes") },
  { value: "No", label: t("smoke.opt.no") },
  { value: "Prefer not to say", label: t("smoke.opt.na") },
], [t]);

const WEED_OPTIONS = useMemo(() => [
  { value: "Yes", label: t("weed.opt.yes") },
  { value: "Sometimes", label: t("weed.opt.sometimes") },
  { value: "No", label: t("weed.opt.no") },
  { value: "Prefer not to say", label: t("weed.opt.na") },
], [t]);

const DRUGS_OPTIONS = useMemo(() => [
  { value: "Yes", label: t("drugs.opt.yes") },
  { value: "Sometimes", label: t("drugs.opt.sometimes") },
  { value: "No", label: t("drugs.opt.no") },
  { value: "Prefer not to say", label: t("drugs.opt.na") },
], [t]);

  // Build translated prompt options [{ value: key, label: t(key) }]
  const PROMPTS = useMemo(
  () => PROMPT_KEYS.map((k) => ({ value: k, label: t(k) })),
  [t]
);
const VOICE_PROMPTS = useMemo(
  () => VOICE_PROMPT_KEYS.map((k) => ({ value: k, label: t(k) })),
  [t]
);
  const deletedPathsRef = useRef([]); // collect paths to delete on save
  const currentUser = useMemo(() => JSON.parse(localStorage.getItem("myanmatch_user") || "{}"), []);
  const userId = currentUser?.user_id || currentUser?.id || null;
  const [saving, setSaving] = useState(false);
  // each slot: { url?: string, path?: string, preview?: string, file?: File }
  const [photos, setPhotos] = useState(Array(6).fill(null));
  const [prompts, setPrompts] = useState([{ ...EMPTY_PROMPT }, { ...EMPTY_PROMPT }, { ...EMPTY_PROMPT }]);
  const [voiceUrl, setVoiceUrl] = useState("");
  const [voiceMeta, setVoiceMeta] = useState(null); // { url?, path?, bucket?, mime?, seconds? }
  const [voicePromptKey, setVoicePromptKey] = useState("");

  // voice state
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [duration, setDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const maxDuration = 30;

  // refs
  const mediaRecorderRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  // meter
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);
  const [level, setLevel] = useState(0);

    // toast
  const [toastOpen, setToastOpen] = useState(false);
  const [toastType, setToastType] = useState("success"); // 'success' | 'error'
  const [toastText, setToastText] = useState("");

  function showToast(text, type = "success") {
    setToastText(text);
    setToastType(type);
    setToastOpen(true);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToastOpen(false), 2200);
  }


  function pickMimeType() {
    const candidates = [
      "audio/webm;codecs=opus","audio/webm","audio/mp4","audio/ogg;codecs=opus","audio/ogg",
    ];
    for (const t of candidates) {
      try { if (window.MediaRecorder?.isTypeSupported?.(t)) return t; } catch {}
    }
    return "";
  }
  function startMeter(stream) {
    try {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtxRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      source.connect(analyserRef.current);
      const buf = new Uint8Array(analyserRef.current.fftSize);
      const tick = () => {
        analyserRef.current.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        setLevel(rms);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {}
  }
  function stopMeter() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    try { audioCtxRef.current?.close(); } catch {}
    audioCtxRef.current = null;
    analyserRef.current = null;
    setLevel(0);
  }
  function stopAll(skipSetRecording = false) {
    try { mediaRecorderRef.current?.stop(); } catch {}
    clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = null;
    if (!skipSetRecording) setRecording(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    stopMeter();
  }
  async function handleRecord() {
    if (recording) { stopAll(); return; }
    setErrorMsg("");
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setErrorMsg(t("edit.voice.err.unsupported"));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }});
      streamRef.current = stream;
      const mimeType = pickMimeType();
      const mr = new window.MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mr;

      audioChunksRef.current = [];
      mr.ondataavailable = (e) => e.data?.size && audioChunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType || "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioURL((prev) => { if (prev) URL.revokeObjectURL(prev); return url; });
        clearInterval(timerIntervalRef.current);
        setRecording(false);
        stopMeter();
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      setRecording(true);
      setDuration(0);
      startMeter(stream);
      mr.start(250);

      timerIntervalRef.current = setInterval(() => {
        setDuration((d) => {
          const next = d + 1;
          if (next >= maxDuration) { stopAll(); return maxDuration; }
          return next;
        });
      }, 1000);
    } catch (e) {
      console.error(e);
      setErrorMsg(t("edit.voice.err.permission"));
    }
  }
  function handleDeleteRecording() {
    stopAll(true);
    if (audioURL) URL.revokeObjectURL(audioURL);
    setAudioURL(null);
    setAudioBlob(null);
    setDuration(0);
  }

  function handlePlaySample() {
  const topic = voicePromptKey ? t(voicePromptKey) : "";
  const samplePrefix = topic ? `${topic}. ` : "";
  const sample = `${samplePrefix}Here’s a sample voice prompt. Talk naturally for twenty to thirty seconds.`;
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel?.();
    const u = new SpeechSynthesisUtterance(sample);
    u.lang = "en-US";
    window.speechSynthesis.speak(u);
  } else {
    showToast(sample, "success");
  }
}


  async function handleUploadToProfile() {
  if (!audioBlob || !userId) return;
  try {
    // Create a File with clean MIME (no parameters in name/MIME)
    const mime = baseMime(audioBlob.type) || "audio/webm";
    const ext = safeAudioExt(mime); // e.g., webm, ogg, mp4, m4a
    const file = new File([audioBlob], `voice-prompt.${ext}`, { type: mime });

    const bucket = "onboarding";
    const path = `voice/${userId}/${Date.now()}.${ext}`;

    const { error: upErr } = await supabase
      .storage
      .from(bucket)
      .upload(path, file, {
        upsert: true,
        cacheControl: "3600",
        contentType: mime,
      });

    if (upErr) throw upErr;

    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
    const publicUrl = pub?.publicUrl || null;

    setVoiceUrl(publicUrl || "");
setVoiceMeta({
  url: publicUrl,    // convenient direct URL
  path,              // persistent storage key
  bucket,            // 'onboarding'
  mime,              // base MIME only
  duration,          // seconds
  prompt: voicePromptKey || "",      // store the i18n key (for back-compat too)
  prompt_key: voicePromptKey || "",  // explicit key
});

    showToast(t("edit.voice.toast.uploaded"), "success")
  } catch (e) {
    console.error(e);
    showToast(t("edit.voice.toast.fail"), "error")
  }
}


  const [vitals, setVitals] = useState({ ...EMPTY_VITALS });

  /** Load existing profile */
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!userId) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (!alive || error) return;

      if (data) {
        setVitals((v) => ({ ...v, ...data }));

// photos/media (make display URLs like HomePage) — KEEP PATHS for future deletes/replacements
try {
  const parseArr = (v) =>
    Array.isArray(v)
      ? v
      : (typeof v === "string" && v.trim().startsWith("["))
        ? (() => { try { const a = JSON.parse(v); return Array.isArray(a) ? a : []; } catch { return []; } })()
        : v ? [v] : [];

  // prefer persisted storage paths if present
  const mediaPaths = parseArr(data.media_paths);
  const medias     = parseArr(data.media ?? data.photos);

  const merged = [...new Set([...mediaPaths, ...medias])]; // keep order, de-dupe

  const slots = merged
    .map((item) => {
      const display = toUrl(item); // public URL (string) or null
      let path = null;

      if (typeof item === "object" && item?.path) {
        path = String(item.path).replace(/^public\//, "").replace(/^media\//, "");
      } else if (typeof item === "string" && !/^https?:\/\//i.test(item)) {
        // raw storage key
        path = String(item).replace(/^public\//, "").replace(/^media\//, "");
      }

      return display ? { url: display, path } : null;
    })
    .filter(Boolean);

  setPhotos([...slots, null, null, null, null, null].slice(0, 6));
} catch {}

        // prompts
        try {
          const pr = Array.isArray(data.prompts)
            ? data.prompts
            : typeof data.prompts === "string" && data.prompts.startsWith("[")
            ? JSON.parse(data.prompts)
            : [];
          setPrompts([pr[0] || EMPTY_PROMPT, pr[1] || EMPTY_PROMPT, pr[2] || EMPTY_PROMPT]);
        } catch {}

// voicePrompt (jsonb) — supports json string, {url}, or {bucket,path}
try {
  let vp = data?.voicePrompt ?? data?.voiceprompt ?? data?.voice_prompt ?? null;
  if (vp && typeof vp === "string") { try { vp = JSON.parse(vp); } catch {} }
  if (vp?.url) setVoiceUrl(vp.url);
  if (vp) {
    setVoiceMeta(vp);
    const k = vp.prompt_key || vp.prompt || "";
    setVoicePromptKey(VOICE_PROMPT_KEYS.includes(k) ? k : "");
  }
} catch {}

        // normalize text/array fields (ethnicity, religion, schools)
        setVitals((v) => ({
          ...v,
          ethnicity: Array.isArray(data.ethnicity)
            ? data.ethnicity
            : (typeof data.ethnicity === "string" && data.ethnicity.startsWith("[")) // FIX: was "[)"
              ? JSON.parse(data.ethnicity)
              : (data.ethnicity ? [data.ethnicity] : []),
          religion: Array.isArray(data.religion)
            ? data.religion
            : (typeof data.religion === "string" && data.religion.startsWith("["))
              ? JSON.parse(data.religion)
              : (data.religion ? [data.religion] : []),
          schools: Array.isArray(data.schools)
            ? data.schools
            : (typeof data.schools === "string" && data.schools.startsWith("["))
              ? JSON.parse(data.schools)
              : (data.schools ? [data.schools] : []),
        }));
      }
    })();
    return () => { alive = false; };
  }, [userId]);

  useEffect(() => {
    return () => {
      try { mediaRecorderRef.current?.stop(); } catch {}
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (audioURL) URL.revokeObjectURL(audioURL);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Drag reorder (native) */
  const dragIndex = useRef(null);
  const onDragStart = (i) => (e) => { dragIndex.current = i; e.dataTransfer.effectAllowed = "move"; };
  const onDragOver = (i) => (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const onDrop = (i) => (e) => {
    e.preventDefault();
    const from = dragIndex.current;
    if (from === null || from === i) return;
    setPhotos((arr) => {
      const next = [...arr];
      const [moved] = next.splice(from, 1);
      next.splice(i, 0, moved);
      return next.slice(0, 6);
    });
    dragIndex.current = null;
  };

  const updatePhoto = (i, preview, file) =>
    setPhotos((arr) => {
      const next = [...arr];
      const oldPath = next[i]?.path || null; // keep existing path to delete if replaced
      next[i] = { ...(next[i] || {}), preview, file, path: oldPath };
      return next;
    });

  const removePhoto = (i) =>
    setPhotos((arr) =>
      arr.map((v, idx) => {
        if (idx !== i) return v;
        if (v?.path) deletedPathsRef.current.push(v.path); // schedule delete on save
        return null;
      })
    );

  const moveUp = (i) => setPhotos((arr) => (i === 0 ? arr : swap(arr, i, i - 1)));
  const moveDown = (i) => setPhotos((arr) => (i === arr.length - 1 ? arr : swap(arr, i, i + 1)));
  const swap = (arr, i, j) => { const next = [...arr]; [next[i], next[j]] = [next[j], next[i]]; return next; };

  const setPromptAt = (i, field, value) => setPrompts((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)));
  const setVital = (k, v) => setVitals((prev) => ({ ...prev, [k]: v }));

  const handleBirthdate = (iso) => {
    setVitals((prev) => ({ ...prev, birthdate: iso, age: computeAge(iso) }));
  };

// src/pages/EditProfilePage.jsx

// REPLACE THIS ENTIRE FUNCTION

const handleSave = async () => {
  if (!userId) return;
  setSaving(true);

  // 1) Upload any new files and produce final media/path lists
  const uploadedUrls = [];
  const nextPhotosState = [...photos]; // Clone to update paths after upload
  const mediaPaths = [];

  for (let i = 0; i < nextPhotosState.length; i++) {
    const slot = nextPhotosState[i];
    if (!slot) continue;

    if (slot.file) { // This is a new file that needs uploading
      if (slot.path) { // If it's replacing an old photo, delete the old one
        try {
          await supabase.storage.from("media").remove([slot.path]);
        } catch (e) {
          console.warn("Could not remove previous file:", slot.path, e);
        }
      }

      const ext = (slot.file.name.split(".").pop() || "jpg").toLowerCase();
      const newPath = `${userId}/media/${Date.now()}_${i}.${ext}`;

      const { error: upErr } = await supabase.storage.from("media").upload(newPath, slot.file, { upsert: true });

      if (upErr) {
        showToast(t("edit.toast.photoFail"), "error");
        setSaving(false);
        return;
      }

      const { data: pub } = supabase.storage.from("media").getPublicUrl(newPath);
      uploadedUrls.push(pub.publicUrl);
      mediaPaths.push(newPath);
      nextPhotosState[i] = { url: pub.publicUrl, path: newPath }; // Update the cloned state
    } else if (slot.url) { // This is an existing photo
      uploadedUrls.push(slot.url);
      if (slot.path) mediaPaths.push(slot.path);
    }
  }

  // Delete any photos explicitly removed via the trash icon
  if (deletedPathsRef.current.length) {
    try {
      await supabase.storage.from("media").remove(deletedPathsRef.current);
    } catch (e) {
      console.warn("Some photo deletes failed:", e);
    } finally {
      deletedPathsRef.current = [];
    }
  }
  
  setPhotos(nextPhotosState); // Update UI state with new paths/urls

  // 2) Build the final payload for the database
  const voiceBlock = voiceMeta
    ? { ...voiceMeta, prompt: voicePromptKey || voiceMeta.prompt || "", prompt_key: voicePromptKey || voiceMeta.prompt_key || "" }
    : (voiceUrl ? { url: voiceUrl, prompt: voicePromptKey || "", prompt_key: voicePromptKey || "" } : null);

  const safePayload = {
    ...vitals, // Spreads all the simple text fields like first_name, gender, etc.
    
    // [!THE BUG FIX IS HERE!]
    // Ensure arrays are saved as native text arrays, not JSON strings.
    ethnicity: Array.isArray(vitals.ethnicity) ? vitals.ethnicity : [],
    religion: Array.isArray(vitals.religion) ? vitals.religion : [],
    family_plans: Array.isArray(vitals.family_plans) ? vitals.family_plans : [],
    schools: Array.isArray(vitals.schools) ? vitals.schools : [],

    // Update media fields
    media: uploadedUrls,       // For compatibility, stores public URLs
    media_paths: mediaPaths,   // Stores storage paths for easier management
    photos: uploadedUrls,      // Legacy text[] field for photos

    // Update other fields
    prompts,
    voicePrompt: voiceBlock,
    onboarding_complete: true,
    updated_at: new Date().toISOString(),
  };

  // 3) Update the database
  const { error } = await supabase
    .from("profiles")
    .update(safePayload)
    .eq("user_id", userId);

  setSaving(false);

  if (error) {
    console.error("Save error:", error);
    showToast(t("edit.toast.saveFail"), "error");
  } else {
    showToast(t("edit.toast.saveOk"), "success");
  }
};

  // gender UI capitalized
  const genderUiValue = vitals.gender ? vitals.gender.charAt(0).toUpperCase() + vitals.gender.slice(1) : "";
  const genderUiOptions = GENDERS.map(g => g.charAt(0).toUpperCase() + g.slice(1));

  // Schools handlers
  const addSchool = () =>
    setVitals(prev => ({ ...prev, schools: [...(prev.schools || []), ""] }));
  const updateSchool = (idx, value) =>
    setVitals(prev => {
      const next = [...(prev.schools || [""])];
      next[idx] = value;
      return { ...prev, schools: next };
    });
  const removeSchool = (idx) =>
    setVitals(prev => {
      const next = [...(prev.schools || [])];
      if (next.length <= 1) return prev;
      next.splice(idx, 1);
      return { ...prev, schools: next };
    });

return (
  <div className="relative min-h-dvh w-full text-white overflow-x-hidden isolate">
    {/* PAGE BACKGROUND (fixed, full-screen) */}
    <div className="fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-gradient-to-b from-[#201033] via-[#120f1f] to-[#0a0a12]" />
      <div className="absolute -top-24 -left-28 w-[22rem] h-[22rem] rounded-full bg-fuchsia-500/25 blur-[110px]" />
      <div className="absolute -bottom-32 -right-24 w-[24rem] h-[24rem] rounded-full bg-violet-500/25 blur-[120px]" />
    </div>

    {/* HEADER (sticky) */}
    <div className="sticky top-0 z-30 border-b border-white/10 bg-white/5 backdrop-blur">
      <div className="max-w-5xl mx-auto px-5 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">{t("edit.title")}</h1>
            <p className="text-xs text-white/60">{t("edit.subtitle")}</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold bg-[#ffd159] text-black hover:brightness-105 disabled:opacity-60"
          >
            <FaSave className="opacity-90" />
            {saving ? t("edit.saving") : t("edit.save")}
          </button>
        </div>
      </div>
    </div>

    {/* CONTENT */}
    <main className="px-5 py-6 pb-28">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Photos */}
{/* Photos */}
<Card
  title={t("edit.photos.title")}
  right={<span className="text-xs text-white/60">{t("edit.photos.hint")}</span>}
>
  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
    {photos.map((item, i) => (
      <div
        key={i}
        draggable
        onDragStart={onDragStart(i)}
        onDragOver={onDragOver(i)}
        onDrop={onDrop(i)}
      >
        <PhotoSlot
          url={item}
          onChange={(preview, file) => updatePhoto(i, preview, file)}
          onRemove={() => removePhoto(i)}
          onMoveUp={() => moveUp(i)}
          onMoveDown={() => moveDown(i)}
          draggableProps={{}}
        />
      </div>
    ))}
  </div>
  <div className="mt-3 text-xs text-white/60">{t("edit.photos.caption")}</div>
</Card>

{/* Prompts */}
<Card
  title={
    <div className="flex items-center gap-2">
      <span>{t("edit.prompts.title")}</span>
      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-pink-200">
        {t("edit.prompts.required")}
      </span>
    </div>
  }
>
  <div className="space-y-5">
    {prompts.map((p, i) => (
      <div key={i} className="rounded-2xl border border-white/10 bg-[#1b0f24]/70 p-4 sm:p-5">
        <div className="grid sm:grid-cols-2 gap-3">
<Select
  label={`${t("edit.prompts.prompt")} ${i + 1}`}
  options={PROMPTS}                 // [{ value: key, label: t(key) }]
  value={p.prompt}                  // store the i18n key in state/DB
  onChange={(e) => setPromptAt(i, "prompt", e.target.value)}
  placeholder={t("edit.common.selectPH")}
  mobileSheet
/>
          <label className="block sm:col-span-1">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm font-semibold text-white/90">
                {t("edit.prompts.answer")}
              </div>
              <div className="text-xs text-white/40">{(p.answer || "").length}/220</div>
            </div>
            <textarea
              className="w-full rounded-xl border border-white/10 bg-[#241230] text-white
                         px-4 py-3 min-h-[88px] outline-none
                         placeholder:text-white/40 focus:border-pink-400/60 focus:ring-2 focus:ring-pink-400/20"
              maxLength={220}
              placeholder={t("edit.prompts.answerPH")}
              value={p.answer}
              onChange={(e) => setPromptAt(i, "answer", e.target.value)}
            />
          </label>
        </div>
      </div>
    ))}
  </div>
</Card>

{/* Voice Prompt */}
<Card
  title={t("edit.voice.title")}
  right={<span className="text-xs text-white/60">{t("edit.voice.hint")}</span>}
>
  <div className="space-y-4">
    {/* title input */}
<Select
  label={t("edit.voice.title")}
  options={VOICE_PROMPTS}
  value={voicePromptKey}
  onChange={(e) => setVoicePromptKey(e.target.value)}
  placeholder={t("edit.common.selectPH")}
  mobileSheet
/>

    <div className="flex items-center justify-between">
      <button
        onClick={handlePlaySample}
        type="button"
        className="text-xs inline-flex items-center gap-2 px-3 py-2 rounded-full
                   border border-white/10 text-white hover:bg-white/5 transition"
      >
        <FaPlay /> {t("edit.voice.sample")}
      </button>

      <div className="flex items-center gap-2">
        {audioURL && (
          <button
            onClick={handleDeleteRecording}
            type="button"
            className="text-xs inline-flex items-center gap-2 px-3 py-2 rounded-full
                       border border-white/10 text-white hover:bg-white/5 transition"
          >
            <FaRedo /> {t("edit.voice.rerecord")}
          </button>
        )}
        {(voiceUrl || voiceMeta) && (
          <button
            type="button"
            onClick={() => { setVoiceUrl(""); setVoiceMeta(null); handleDeleteRecording(); }}
            className="text-xs inline-flex items-center gap-2 px-3 py-2 rounded-full
                       border border-white/10 text-white/80 hover:bg-white/5 transition"
          >
            <FaTrash /> {t("edit.voice.remove")}
          </button>
        )}
      </div>
    </div>

    <div className="rounded-2xl border-2 border-dashed border-white/10 px-4 py-6 bg-[#1b0f24]/80 relative w-full">
      <div className="absolute top-3 right-4 text-xs text-white/50">
        {`${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, "0")} / 0:30`}
      </div>

      {audioURL ? (
        <>
          <audio src={audioURL} controls className="w-full mb-2" />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleUploadToProfile}
              type="button"
              className="inline-flex items-center justify-center px-4 py-2 rounded-full
                         text-black bg-[#ffd159] hover:brightness-105 font-semibold shadow"
            >
              {t("edit.voice.useRecording")}
            </button>
            {voiceUrl && (
              <a
                href={voiceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-white/70 underline"
              >
                {t("edit.voice.currentAudio")}
              </a>
            )}
          </div>
        </>
      ) : (
        <button
          onClick={handleRecord}
          type="button"
          className="flex flex-col items-center w-full focus:outline-none"
          disabled={recording && duration >= maxDuration}
        >
          <div
            className="relative mb-2 p-1 rounded-full"
            style={{
              background: `conic-gradient(#ae41bc ${Math.min((duration / maxDuration) * 360, 360)}deg, rgba(255,255,255,0.08) 0deg)`,
            }}
          >
            <div
              className={`rounded-full p-6 shadow-lg transition-transform ${recording ? "scale-105" : ""}`}
              style={{
                background: "linear-gradient(135deg, #a259c3 0%, #82144d 100%)",
                boxShadow: recording
                  ? `0 0 ${6 + Math.round(level * 16)}px rgba(162,89,195,0.55)`
                  : undefined,
              }}
            >
              <FaMicrophone className="text-3xl text-white" />
            </div>
          </div>
          <span className="text-base text-white/70">
            {recording ? t("edit.voice.tapStop") : t("edit.voice.tapStart")}
          </span>
        </button>
      )}
      {errorMsg && <div className="mt-2 text-[12px] text-red-400 text-center">{errorMsg}</div>}
    </div>
  </div>
</Card>

        {/* Vitals */}
         <Card title={t("edit.vitals.title")}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t("edit.vitals.firstName")} value={vitals.first_name} onChange={(e) => setVital("first_name", e.target.value)} />
            <Field label={t("edit.vitals.lastName")} value={vitals.last_name} onChange={(e) => setVital("last_name", e.target.value)} />

 <Select label={t("edit.vitals.gender")}    options={GENDER_OPTIONS}    value={vitals.gender || ""}    onChange={(e) => setVital("gender", e.target.value)}    placeholder={t("edit.common.selectPH")} />
 <Select label={t("edit.vitals.sexuality")} options={SEXUALITY_OPTIONS} value={vitals.sexuality || ""} onChange={(e) => setVital("sexuality", e.target.value)} placeholder={t("edit.common.selectPH")} />

<label className="block">
  <div className="text-sm font-semibold text-white/90 mb-1">{t("edit.vitals.birthdate")}</div>
  <input
    type="date"
    value={vitals.birthdate || ""}
    onChange={(e) => handleBirthdate(e.target.value)}
    className="w-full rounded-xl border border-white/10 bg-[#241230] text-white px-4 py-3
               outline-none placeholder:text-white/40 focus:border-pink-400/60 focus:ring-2 focus:ring-pink-400/20"
  />
</label>
            <Field label={t("edit.vitals.ageAuto")} value={vitals.age || ""} onChange={() => {}} readOnly />

            <Field label={t("edit.vitals.height")} hint={t("edit.vitals.heightHint")} value={vitals.height} onChange={(e) => setVital("height", e.target.value)} />
            <Field label={t("edit.vitals.location")} value={vitals.location} onChange={(e) => setVital("location", e.target.value)} />
            <Field label={t("edit.vitals.hometown")} value={vitals.hometown} onChange={(e) => setVital("hometown", e.target.value)} />

 <MultiSelectChips label={t("edit.vitals.ethnicity")} options={ETHNICITY_OPTIONS_T} value={vitals.ethnicity || []} onChange={(arr) => setVital("ethnicity", arr)} />
 <MultiSelectChips label={t("edit.vitals.religion")}  options={RELIGION_OPTIONS_T}  value={vitals.religion  || []} onChange={(arr) => setVital("religion",  arr)} />

 <Select label={t("edit.vitals.children")}    options={CHILDREN_OPTIONS_T}      value={vitals.children || ""}     onChange={(e) => setVital("children", e.target.value)}       placeholder={t("edit.common.selectPH")} />
 <Select label={t("edit.vitals.familyPlans")} options={FAMILY_PLANS_OPTIONS_T}  value={vitals.family_plans || ""} onChange={(e) => setVital("family_plans", e.target.value)}   placeholder={t("edit.common.selectPH")} />

 <Select label={t("edit.vitals.intention")}
   options={INTENTIONS_T}
              value={vitals.relationship || ""}
              onChange={(e) => setVital("relationship", e.target.value)}
            />

            {/* Schools */}
<div className="sm:col-span-2">
  <div className="text-sm font-semibold text-white/90 mb-1">{t("edit.vitals.schools")}</div>
  {(vitals.schools && vitals.schools.length ? vitals.schools : [""]).map((s, idx) => (
    <div key={idx} className="flex items-center mb-2">
      <input
        type="text"
        value={s}
        onChange={(e) => updateSchool(idx, e.target.value)}
        placeholder={t("edit.vitals.schoolPH")}
        className="flex-1 rounded-xl border border-white/10 bg-[#241230] text-white px-4 py-3
                   outline-none placeholder:text-white/40 focus:border-pink-400/60 focus:ring-2 focus:ring-pink-400/20"
      />
      {(vitals.schools?.length ?? 0) > 1 && (
        <button
          type="button"
          onClick={() => removeSchool(idx)}
          className="ml-2 px-3 py-2 text-sm rounded-lg border border-white/10 text-white/70 hover:bg-white/5"
          aria-label={t("edit.vitals.removeSchoolAria")}
        >
          {t("edit.common.remove")}
        </button>
      )}
    </div>
  ))}
  <button
    type="button"
    onClick={addSchool}
    className="text-sm text-pink-200 hover:underline mt-1"
    disabled={(vitals.schools?.length ?? 0) >= 4}
  >
    {t("edit.vitals.addSchool")}
  </button>
</div>


 <Select
  label={t("edit.vitals.education")}
  options={EDUCATION_OPTIONS_T}
              value={vitals.education_level || ""}
              onChange={(e) => setVital("education_level", e.target.value)}
              placeholder={t("edit.common.selectPH")}
            />
            <Field label={t("edit.vitals.job")} value={vitals.job_title} onChange={(e) => setVital("job_title", e.target.value)} />
            <Field label={t("edit.vitals.workplace")} value={vitals.workplace} onChange={(e) => setVital("workplace", e.target.value)} />

 <Select label={t("edit.vitals.drinking")} options={DRINK_OPTIONS} value={vitals.drinking || ""} onChange={(e) => setVital("drinking", e.target.value)} />
 <Select label={t("edit.vitals.smoking")}  options={SMOKE_OPTIONS} value={vitals.smoking  || ""} onChange={(e) => setVital("smoking",  e.target.value)} />
 <Select label={t("edit.vitals.weed")}     options={WEED_OPTIONS}  value={vitals.weed     || ""} onChange={(e) => setVital("weed",     e.target.value)} />
 <Select label={t("edit.vitals.drugs")}    options={DRUGS_OPTIONS} value={vitals.drugs    || ""} onChange={(e) => setVital("drugs",    e.target.value)} />

 <Select
  label={t("edit.vitals.politics")}
  options={POLITICAL_OPTIONS_T}
              value={vitals.political_belief || ""}
              onChange={(e) => setVital("political_belief", e.target.value)}
              placeholder={t("edit.common.selectPH")}
            />
          </div>
        </Card>

{/* Save CTA */}
<div className="pb-2">
  <button
    onClick={handleSave}
    disabled={saving}
    className="w-full inline-flex items-center justify-center gap-2 px-5 py-4 rounded-2xl
               text-black text-lg font-bold bg-[#ffd159] hover:brightness-105 disabled:opacity-60"
  >
    <FaSave className="opacity-90" />
    {saving ? t("edit.saving") : t("edit.saveProfile")}
  </button>
</div>
      <MMToast
        open={toastOpen}
        type={toastType}
        text={toastText}
        onClose={() => setToastOpen(false)}
      />

      </div>
       </main>
    </div>
  );
}
