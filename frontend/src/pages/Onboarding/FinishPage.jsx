// src/pages/Onboarding/FinishPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useOnboarding } from "../../context/OnboardingContext";

export default function FinishPage() {
  const navigate = useNavigate();
  const { profileData } = useOnboarding();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Columns that are arrays/jsonb-arrays in public.profiles
  const ARRAY_COLUMNS = new Set([
    "interested_in", // text[]
    "ethnicity",     // text[]
    "family_plans",  // text[]
    "religion",      // text[]
    "photos",        // text[]
    "prompts",       // jsonb[]
    "schools",       // jsonb[]
    "media",         // jsonb[]
    "media_paths",   // jsonb[]
  ]);

  // Onboarding keys -> DB columns
  const KEY_MAP = {
    // names
  first_name: "first_name",
  last_name: "last_name",
  firstName:  "first_name",   // <--- add this
  lastName:   "last_name",    // <--- add this


    // identity / lifestyle
    gender: "gender",
    sexuality: "sexuality",
    interested_in: "interested_in",
    smoking: "smoking",
    drinking: "drinking",
    drugs: "drugs",
    weed_usage: "weed", // legacy -> new
    weed: "weed",

    // dates & numbers
    birthdate: "birthdate",
    age: "age", // if you stored this; if DB computes it you can ignore

    // height
    height: "height",
    height_unit: "height_unit",
    height_ft: "height_ft",
    height_cm: "height_cm",

    // geography
    location: "location",
    hometown: "hometown",
    lat: "lat",
    lng: "lng",

    // work/edu
    job_title: "job_title",
    workplace: "workplace",
    education_level: "education_level",
    schools: "schools",

    // beliefs / plans
    religion: "religion",
    political_belief: "political_belief",
    relationship: "relationship",
    children: "children",
    family_plans: "family_plans",

    // profile content
    ethnicity: "ethnicity",
    prompts: "prompts",
    voicePrompt: "voicePrompt",

    // T&Cs
    agreedToTerms: "agreedToTerms",

    // media
    media: "media",
    media_paths: "media_paths",
    photos: "photos",
    avatar_url: "avatar_url",
    avatar_path: "avatar_path",
    avatar_index: "avatar_index",
  };

  function toArray(val) {
    if (val == null) return [];
    return Array.isArray(val) ? val : [val];
  }

// REPLACE THIS ENTIRE FUNCTION

// REPLACE THE ENTIRE buildPayload FUNCTION WITH THIS

function buildPayload(pd) {
  const out = {};

  // ---- helpers ----
  const toArray = (val) => (val == null ? [] : Array.isArray(val) ? val : [val]);
  const normalizeDate = (val) => {
    if (!val) return null;
    if (val instanceof Date && !isNaN(val)) return val.toISOString().slice(0, 10);
    if (typeof val === "string") {
      const s = val.trim();
      if (!s) return null;
      const d = new Date(s);
      if (isNaN(d)) return null;
      return d.toISOString().slice(0, 10);
    }
    return null;
  };
  const toNum = (v) => {
    if (v === "" || v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const computeAgeFromBirthdate = (bd) => {
    const iso = normalizeDate(bd);
    if (!iso) return null;
    const d = new Date(iso + "T00:00:00Z");
    if (isNaN(d)) return null;
    const today = new Date();
    let age = today.getUTCFullYear() - d.getUTCFullYear();
    const m = today.getUTCMonth() - d.getUTCMonth();
    if (m < 0 || (m === 0 && today.getUTCDate() < d.getUTCDate())) age--;
    return Number.isFinite(age) ? age : null;
  };

  // --- Robust mapping logic using the KEY_MAP ---
  for (const [frontendKey, dbColumn] of Object.entries(KEY_MAP)) {
    if (out[dbColumn] === undefined && pd[frontendKey] !== undefined) {
      out[dbColumn] = pd[frontendKey];
    }
  }

  // ---- Data cleanup and normalization ----
  if ("birthdate" in out) out.birthdate = normalizeDate(out.birthdate);

  const ageNum = toNum(out.age);
  out.age = ageNum == null ? computeAgeFromBirthdate(out.birthdate) : ageNum;

  for (const key of ARRAY_COLUMNS) {
    if (key in out) out[key] = toArray(out[key]);
  }

  const media = Array.isArray(out.media) ? out.media : [];
  const media_paths = Array.isArray(out.media_paths) ? out.media_paths : [];
  out.media = media;
  out.media_paths = media_paths;
  if (!out.avatar_url) out.avatar_url = media?.[0]?.url ?? media?.[0] ?? null;
  if (!out.avatar_path) out.avatar_path = media_paths?.[0]?.path ?? media_paths?.[0] ?? null;
  if (typeof out.avatar_index !== "number") out.avatar_index = 0;

  if ("lat" in out) out.lat = toNum(out.lat);
  if ("lng" in out) out.lng = toNum(out.lng);

  for (const key of ARRAY_COLUMNS) {
    if (key in out && Array.isArray(out[key])) {
      out[key] = out[key].filter((x) => (typeof x === "string" ? x.trim() : x != null));
    }
  }
  if (Array.isArray(out.schools)) {
    out.schools = out.schools.map((s) => (typeof s === "string" ? { name: s.trim() } : s));
  }

  out.agreedToTerms = true;
  out.onboarding_complete = true;
  out.updated_at = new Date().toISOString();

  return out;
}

// --- helpers for safe audio filenames/content-types ---
function safeAudioExt(mime = "") {
  // "audio/webm;codecs=opus" -> "webm"
  const afterSlash = String(mime).split("/")[1] || "";
  const bare = afterSlash.split(";")[0]?.trim();
  if (bare) return bare.replace(/^x-/, ""); // e.g. x-m4a -> m4a
  return "webm";
}
function baseMime(mime = "") {
  // strip parameters: "audio/webm;codecs=opus" -> "audio/webm"
  return String(mime).split(";")[0];
}

// --- joins VITE_API_BASE + path safely (prevents /api/api and //)
function apiUrl(path = "") {
  const base = String(import.meta.env.VITE_API_BASE || "").replace(/\/+$/, ""); // strip trailing /
  const p = String(path || "").replace(/^\/+/, "");                             // strip leading /
  return `${base}/${p}`;
}


const handleFinish = async () => {
  setSaving(true);
  setError("");
  setSuccess(false);

  const { data: { user, session }, error: authErr } = await supabase.auth.getSession();
  if (authErr || !user?.id || !session) {
    setError("You must be logged in to save your profile.");
    setSaving(false);
    return;
  }
  const uid = user.id;

  const payload = buildPayload(profileData || {});
  payload.user_id = uid;

  // Voice Prompt handling can remain as it is
  // ...

  // Upsert the final profile
  const { error: dbErr } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "user_id" });

  if (dbErr) {
    console.error(dbErr);
    setError("Failed to save your profile: " + dbErr.message);
    setSaving(false);
    return;
  }
  
  // [!ADD!] Schedule the welcome likes by calling your backend
  try {
    console.log("Onboarding complete, scheduling welcome likes...");
    // This is a "fire and forget" request. We don't need to wait for it.
    fetch(`/api/user/schedule-welcome-likes`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.access_token}`,
        }
    });
  } catch (e) {
      console.error("Failed to schedule welcome likes:", e);
      // We don't show an error to the user, as this is a background task.
  }

  // Your existing profile caching logic is fine
  // ...
  
  setSaving(false);
  setSuccess(true);

  setTimeout(() => {
    navigate("/HomePage", { replace: true });
  }, 800);
};

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#82142d] relative overflow-hidden">
      {/* Heart curves background */}
      <img
        src="/images/heart-curve-topleft.png"
        alt=""
        className="absolute top-0 left-0 w-36 md:w-44 opacity-90 pointer-events-none select-none z-0"
        draggable={false}
      />
      <img
        src="/images/heart-curve-bottomright.png"
        alt=""
        className="absolute bottom-0 right-0 w-48 md:w-60 opacity-90 pointer-events-none select-none z-0"
        draggable={false}
      />

      {/* Centered content */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 px-4">
        <div className="bg-white/95 border border-[#f7d2ef] rounded-3xl shadow-2xl px-7 py-10 w-full max-w-md flex flex-col items-center card-animate">
          <div className="w-24 h-24 md:w-28 md:h-28 mb-2 animate-bounce-slow">
            <img
              src="/images/bubble.png"
              alt="Mascot"
              className="w-full h-full object-contain"
              style={{ filter: "drop-shadow(0 2px 16px rgba(120,0,120,0.13))" }}
              draggable={false}
            />
          </div>
          <h1 className="text-3xl font-bold logo-hinge mb-2 text-center leading-tight drop-shadow-lg tracking-tight">
            Welcome to <span className="text-[#cf60ed]">MyanMatch!</span>
          </h1>
          <div className="mb-5">
            <p className="text-base text-[#a259c3] text-center font-medium prompt-hinge">
              Your profile is ready!
              <br />
              Start sending likes and see who matches with you.
            </p>
          </div>
          {error && <div className="text-red-500 text-center font-semibold my-2">{error}</div>}
          {success && (
            <div className="text-[#34c759] text-center font-bold my-2 animate-bounce">
              Profile saved! 🎉
            </div>
          )}
        </div>
      </div>

      {/* Sticky Button */}
      <button
        className={`w-full py-5 font-bold text-lg shadow-xl tracking-wide transition duration-150 rounded-t-3xl button-glow fixed left-0 bottom-0 z-20 ${
          saving || success
            ? "bg-gradient-to-r from-[#cf60ed] to-[#a259c3] opacity-60"
            : "bg-gradient-to-r from-[#cf60ed] to-[#a259c3] hover:opacity-90"
        } text-white`}
        onClick={handleFinish}
        disabled={saving || success}
      >
        {saving ? "Saving your profile..." : success ? "Redirecting..." : "Start sending likes"}
      </button>
    </div>
  );
}
