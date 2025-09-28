// src/pages/DatingPreferencesPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Layout from "../components/Layout";
import { FaChevronLeft, FaFloppyDisk, FaCheck, FaWandMagicSparkles, FaLock } from "react-icons/fa6";
import { useI18n } from "../i18n";
import { useAuth } from "../context/AuthContext";

/* ------------ local user ------------ */
function getLocalUserId() {
  try {
    const u = JSON.parse(localStorage.getItem("myanmatch_user") || "{}");
    return u?.user_id || u?.id || null;
  } catch {
    return null;
  }
}

/* ------------ canonical option values (DO NOT TRANSLATE) ------------ */
const MULTI = {
  genders: ["man", "woman", "nonbinary"],
  relationship: [
    "Life partner",
    "Long-term relationship",
    "Long-term relationship, open to short",
    "Short-term relationship, open to long",
    "Short-term relationship",
    "Friendship",
    "Figuring out my dating goals",
    "Prefer not to say",
  ],
  religion: ["Agnostic","Atheist","Buddhist","Catholic","Christian","Hindu","Jewish","Deity","Muslim"],
  politics: ["Liberal","Moderate","Conservative","Not Political","Other","Prefer not to say"],
  family_plans: ["Don't want children","Want children","Open to children","Not sure yet","Prefer not to say"],
  ethnicity: [
    "Bamar","Karen (Kayin)","Shan","Kachin","Mon","Chin","Rakhine (Arakanese)","Kayah (Karenni)","Other Myanmar Ethnic","Chinese","Indian",
    "Black/African Descent","East Asian","South Asian","Hispanic/Latino","Middle Eastern","Native American","Pacific Islander","White/Caucasian","Other"
  ],
};

const SINGLE = {
  smoking: ["Yes","Sometimes","No","Prefer not to say","No preference"],
  drinking: ["Yes","Sometimes","No","Prefer not to say","No preference"],
  weed: ["Yes","Sometimes","No","Prefer not to say","No preference"],
  drugs: ["Yes","Sometimes","No","Prefer not to say","No preference"],
  education_level: ["High School","Undergrad","Postgrad","Prefer not to say","No preference"],
};

const DEFAULTS = {
  age_min: 0,
  age_max: 80,
  genders: [],
  relationship: [],
  distance_km: 100,
  smoking: "No preference",
  drinking: "No preference",
  weed: "No preference",
  drugs: "No preference",
  religion: [],
  politics: [],
  family_plans: [],
  verified_only: false,
  has_voice: false,
  ethnicity: [],
  education_level: "No preference",
};

/* ------------ small UI components ------------ */
function Section({ title, note, children }) {
  return (
    <div className="mb-5">
      <div className="flex items-end justify-between mb-2">
        <h3 className="text-base font-extrabold text-gray-900 tracking-tight">{title}</h3>
        {note && <span className="text-xs text-gray-400">{note}</span>}
      </div>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-2 rounded-full text-sm font-semibold border transition
      ${disabled ? "opacity-60 cursor-not-allowed" :
        active ? "bg-[#a259c3] text-white border-[#a259c3]" :
        "bg-white text-gray-700 border-gray-200 hover:border-[#a259c3]/50"}`}
    >
      {children}
    </button>
  );
}

function LockCard({ children, onUpgrade }) {
  const { t } = useI18n();
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
      <div className="flex items-start gap-3">
        <div className="mt-1 shrink-0">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-700">
            <FaLock />
          </span>
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-amber-900">{t("prefs.lock.title")}</div>
          <div className="text-xs text-amber-800/80">
            {t("prefs.lock.desc")}
          </div>
          <button
            onClick={onUpgrade}
            className="mt-2 inline-flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-full border border-amber-300 bg-amber-100/60 text-amber-900 hover:bg-amber-100"
            type="button"
          >
            {t("prefs.lock.cta")}
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

/* ------------ label helpers (translate display only) ------------ */
const slug = (s) =>
  String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

function useLabels() {
  const { t } = useI18n();

  const gender = (v) => t(`prefs.opt.gender.${slug(v)}`, v);
  const relationship = (v) => t(`prefs.opt.relationship.${slug(v)}`, v);
  const religion = (v) => t(`prefs.opt.religion.${slug(v)}`, v);
  const politics = (v) => t(`prefs.opt.politics.${slug(v)}`, v);
  const family = (v) => t(`prefs.opt.family.${slug(v)}`, v);
  const ethnicity = (v) => t(`prefs.opt.ethnicity.${slug(v)}`, v);
  const yn = (v) => t(`prefs.opt.yn.${slug(v)}`, v);
  const edu = (v) => t(`prefs.opt.edu.${slug(v)}`, v);

  return { t, gender, relationship, religion, politics, family, ethnicity, yn, edu };
}

/* ------------ page ------------ */
export default function DatingPreferencesPage() {
  const { profile } = useAuth();
  const userId = profile?.user_id;
  const navigate = useNavigate();
  const { t, gender: Lg, relationship: Lrel, religion: Lrelg, politics: Lpol, family: Lfam, ethnicity: Leth, yn: Lyn, edu: Le } = useLabels();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");
  const [form, setForm] = useState(DEFAULTS);

  const [plan, setPlan] = useState(null); // "free" | "plus" | "x" (we'll infer)
  const isX = (plan || "").toLowerCase() === "x";
  const [ageMinStr, setAgeMinStr] = useState(String(DEFAULTS.age_min));
  const [ageMaxStr, setAgeMaxStr] = useState(String(DEFAULTS.age_max));

  function parseClamp(val, min, max, fallback) {
    const n = Number(val);
    if (Number.isFinite(n)) return Math.max(min, Math.min(max, n));
    return fallback;
  }

  // sync text inputs when form loads
  useEffect(() => {
    setAgeMinStr(String(form.age_min ?? 0));
    setAgeMaxStr(String(form.age_max ?? 120));
  }, [form.age_min, form.age_max]);

  const ageError = useMemo(
    () => (form.age_min > form.age_max ? t("prefs.err.ageRange") : ""),
    [form.age_min, form.age_max, t]
  );

  /* ------------ load plan + preferences ------------ */
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!userId) { setLoading(false); return; }
      setLoading(true);

      // 1) plan
      const { data: prof, error: pErr } = await supabase
        .from("profiles")
        .select("membership_plan, is_plus")
        .eq("user_id", userId)
        .maybeSingle();

      if (pErr) console.warn("load plan error:", pErr);
      const planValue = (prof?.membership_plan || "").toLowerCase() || (prof?.is_plus ? "plus" : "free");
      if (alive) setPlan(planValue);

      // 2) preferences
      const { data: pref, error: prefErr } = await supabase
        .from("preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (!alive) return;

      if (prefErr) {
        console.warn("Preferences load error:", prefErr?.message);
        setForm(DEFAULTS);
      } else if (pref) {
        setForm({
          ...DEFAULTS,
          ...Object.fromEntries(Object.entries(pref).filter(([k]) => k in DEFAULTS)),
        });
      } else {
        setForm(DEFAULTS);
      }

      setLoading(false);
    })();

    return () => { alive = false; };
  }, [userId]);

  /* ------------ quick fill (X) ------------ */
  async function prefillFromProfile() {
    if (!userId || !isX) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("age, birthdate, relationship, religion, political_belief, family_plans, ethnicity, interested_in, children, drinking, drugs, education_level, sexuality, gender, voicePrompt, media, kyc_verified")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) return;

    const genders = [];
    if (data.sexuality && data.gender) {
      const g = String(data.gender).toLowerCase();
      const s = String(data.sexuality).toLowerCase();
      if (s.includes("straight")) {
        genders.push(g === "man" ? "woman" : g === "woman" ? "man" : "woman");
      } else if (s.includes("gay") || s.includes("lesbian")) {
        genders.push(g);
      } else if (s.includes("bi")) {
        genders.push("man","woman");
      }
    }

    const newForm = { ...form };

    // interested_in fallback
    if ((!newForm.genders || newForm.genders.length === 0) && data.interested_in) {
      const arr = Array.isArray(data.interested_in)
        ? data.interested_in
        : (typeof data.interested_in === "string" && data.interested_in.startsWith("["))
          ? JSON.parse(data.interested_in)
          : [data.interested_in];

      const lower = arr.map(v => String(v || "").toLowerCase()).filter(Boolean);
      const wantAll = lower.includes("everyone");

      const map = [];
      if (wantAll || lower.includes("men")) map.push("man");
      if (wantAll || lower.includes("women")) map.push("woman");
      if (wantAll || lower.includes("nonbinary")) map.push("nonbinary");

      if (map.length) newForm.genders = Array.from(new Set(map));
    }

    // age prefill
    (function () {
      let a = Number(data.age);
      if (!Number.isFinite(a) && typeof data.birthdate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data.birthdate)) {
        const [yy, mm, dd] = data.birthdate.split("-").map(Number);
        const birth = new Date(yy, mm - 1, dd);
        const today = new Date();
        a = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) a--;
      }
      if (Number.isFinite(a)) {
        newForm.age_min = Math.max(0, a - 5);
        newForm.age_max = Math.min(80, a + 5);
      }
    })();

    if (genders.length) newForm.genders = Array.from(new Set(genders));
    if (data.relationship) newForm.relationship = Array.from(new Set([data.relationship]));
    if (data.religion) {
      const rel = Array.isArray(data.religion)
        ? data.religion
        : typeof data.religion === "string" && data.religion.startsWith("[")
          ? JSON.parse(data.religion) : [data.religion];
      newForm.religion = rel.filter(Boolean);
    }
    if (data.political_belief) newForm.politics = [data.political_belief];

    // family plans
    if (data.family_plans) {
      const fp = Array.isArray(data.family_plans)
        ? data.family_plans
        : (typeof data.family_plans === "string" && data.family_plans.startsWith("["))
          ? JSON.parse(data.family_plans)
          : [data.family_plans];
      newForm.family_plans = fp.filter(Boolean);
    }
    if ((!newForm.family_plans || newForm.family_plans.length === 0) && data.children) {
      const c = String(data.children).toLowerCase();
      if (c.includes("don't have children")) newForm.family_plans = ["Open to children"];
      else if (c.includes("have children")) newForm.family_plans = ["Want children"];
      else if (c.includes("prefer not to say")) newForm.family_plans = ["Prefer not to say"];
    }

    // habits/edu
    const mapYN = (raw, yesWords = ["often","yes","frequently","socially"]) => {
      const allowed = new Set(["Yes","Sometimes","No","Prefer not to say"]);
      const s = String(raw || "").trim().toLowerCase();
      let mapped = raw || "";
      if (yesWords.includes(s)) mapped = "Yes";
      if (s === "never" || s === "no") mapped = "No";
      if (s === "sometimes" || s === "occasionally") mapped = "Sometimes";
      if (s === "prefer not to say" || s === "prefer-not-to-say") mapped = "Prefer not to say";
      return allowed.has(mapped) ? mapped : "";
    };

    if (!newForm.drinking || newForm.drinking === "No preference") newForm.drinking = mapYN(data.drinking);
    if (!newForm.drugs || newForm.drugs === "No preference") newForm.drugs = mapYN(data.drugs, ["often","yes","frequently"]);
    if (!newForm.smoking || newForm.smoking === "No preference") newForm.smoking = mapYN(data.smoking, ["often","yes","frequently","socially"]);
    if (!newForm.weed || newForm.weed === "No preference") {
      const source = (typeof data.weed === "string" ? data.weed : (typeof data.weed_usage === "string" ? data.weed_usage : "")).trim();
      newForm.weed = mapYN(source, ["often","yes","frequently","socially"]);
    }

    if (!newForm.education_level || newForm.education_level === "No preference") {
      const allowed = new Set(["High School","Undergrad","Postgrad","Prefer not to say"]);
      const raw = typeof data.education_level === "string" ? data.education_level.trim() : "";
      if (allowed.has(raw)) newForm.education_level = raw;
    }

    if (data.ethnicity) {
      const eth = Array.isArray(data.ethnicity)
        ? data.ethnicity
        : (typeof data.ethnicity === "string" && data.ethnicity.startsWith("["))
          ? JSON.parse(data.ethnicity)
          : [data.ethnicity];
      newForm.ethnicity = eth.filter(Boolean);
    }

    const vp = data.voicePrompt || data.voiceprompt || data.voice_prompt || null;
    newForm.has_voice = !!(vp && (vp.url || vp.path || vp.audio_path || vp.storagePath));
    newForm.verified_only = !!data.kyc_verified;

    setForm({ ...DEFAULTS, ...newForm });
    setSaved(t("prefs.toast.prefilled"));
    setTimeout(() => setSaved(""), 1800);
  }

  /* ------------ save ------------ */
  async function save() {
    if (!userId || ageError) return;
    setSaving(true);
    setSaved("");

    // Non‑X users can only save age + genders
    const base = {
      user_id: userId,
      age_min: form.age_min,
      age_max: form.age_max,
      genders: form.genders,
      updated_at: new Date().toISOString(),
    };

    const full = {
      ...base,
      relationship: form.relationship,
      distance_km: form.distance_km,
      smoking: form.smoking,
      drinking: form.drinking,
      weed: form.weed,
      drugs: form.drugs,
      religion: form.religion,
      politics: form.politics,
      family_plans: form.family_plans,
      ethnicity: form.ethnicity,
      education_level: form.education_level,
      verified_only: form.verified_only,
      has_voice: form.has_voice,
    };

    const payload = isX ? full : base;

    const { error } = await supabase
      .from("preferences")
      .upsert(payload, { onConflict: "user_id" });

    setSaving(false);
    if (error) {
      console.error(error);
      setSaved(t("prefs.toast.saveFail"));
    } else {
      setSaved(t("prefs.toast.saved"));
      setTimeout(() => setSaved(""), 1500);
    }
  }

  /* ------------ header ------------ */
  const Header = (
    <div
      className="sticky top-0 z-50 flex items-center gap-3 px-4 py-3"
      style={{
        background:
          "linear-gradient(180deg, rgba(141,49,196,0.12) 0%, rgba(141,49,196,0.06) 100%)",
        backdropFilter: "blur(6px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <button
        onClick={() => history.back()}
        className="p-2 rounded-full hover:bg-white/20 active:scale-95 transition"
        aria-label={t("common.back")}
      >
        <FaChevronLeft className="text-white" />
      </button>
      <div className="ml-1">
        <div className="text-white/90 text-xs font-semibold tracking-wider">{t("settings.label")}</div>
        <div className="text-white text-xl font-extrabold -mt-0.5">{t("prefs.title")}</div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        {saved && (
          <span className="text-xs font-bold text-emerald-100 bg-emerald-600/40 px-2 py-1 rounded-full">
            {saved}
          </span>
        )}
        <button
          onClick={save}
          disabled={saving || !!ageError}
          className={`text-white text-sm font-extrabold px-4 py-2 rounded-full flex items-center gap-2 shadow
            ${saving || ageError ? "bg-gray-400 cursor-not-allowed" : "bg-[#a259c3] hover:bg-[#8d31c4]"}`}
        >
          <FaFloppyDisk /> {saving ? t("common.saving") : t("common.save")}
        </button>
      </div>
    </div>
  );

  if (!userId) {
    return (
      <Layout title={t("prefs.title")}>
        {Header}
        <div className="p-6 text-center text-white/90">{t("auth.signInFirst")}</div>
      </Layout>
    );
  }

  const lock = !isX;

  /* ------------ UI ------------ */
  return (
    <Layout title={t("prefs.title")}>
      {Header}

      {/* Cream card on red bg */}
      <div className="px-4 pb-24">
        <div className="max-w-md mx-auto mt-4 rounded-3xl shadow-xl border border-black/5 bg-[#FFF3E6]">
          <div className="p-5 sm:p-6">

            {/* Top actions */}
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={isX ? prefillFromProfile : undefined}
                disabled={lock}
                className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-full border
                 ${isX
                   ? "border-amber-300 bg-amber-100/60 text-amber-900 hover:bg-amber-100"
                   : "border-gray-200 bg-white/70 text-gray-500 cursor-not-allowed"}`}
              >
                <FaWandMagicSparkles /> {t("prefs.quickfill")} {isX ? "" : " (X)"}
              </button>
            </div>

            {/* Age — always available */}
            <Section title={t("prefs.ageRange")} note="18–80">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-xs font-bold text-gray-600">{t("prefs.min")}</div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="\d*"
                    value={ageMinStr}
                    onChange={(e) => setAgeMinStr(e.target.value)}
                    onBlur={() => {
                      const v = parseClamp(ageMinStr, 0, 120, 0);
                      setAgeMinStr(String(v));
                      setForm((f) => ({ ...f, age_min: v }));
                    }}
                    className="w-full mt-1 rounded-xl border border-gray-300 px-3 py-2 bg-white"
                  />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-gray-600">{t("prefs.max")}</div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="\d*"
                    value={ageMaxStr}
                    onChange={(e) => setAgeMaxStr(e.target.value)}
                    onBlur={() => {
                      const v = parseClamp(ageMaxStr, 0, 120, 120);
                      setAgeMaxStr(String(v));
                      setForm((f) => ({ ...f, age_max: v }));
                    }}
                    className="w-full mt-1 rounded-xl border border-gray-300 px-3 py-2 bg-white"
                  />
                </div>
              </div>
              {ageError && <div className="text-xs text-red-600 mt-1">{ageError}</div>}
            </Section>

            {/* Show me — always available */}
            <Section title={t("prefs.showMe")}>
              <div className="flex flex-wrap gap-2">
                {MULTI.genders.map((g) => (
                  <Chip
                    key={g}
                    active={form.genders.includes(g)}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        genders: f.genders.includes(g)
                          ? f.genders.filter((x) => x !== g)
                          : [...f.genders, g],
                      }))
                    }
                  >
                    {Lg(g)}
                  </Chip>
                ))}
              </div>
            </Section>

            {/* Everything below is X-only */}
            {!isX && <LockCard onUpgrade={() => navigate("/PricingPage")} />}

{/* Distance */}
<Section title={t("prefs.distance")}>
  <div className="flex items-center gap-3">
    <input
      type="range"
      min={5}
      max={500}
      step={5}
      value={Math.min(form.distance_km || 100, 500)}
      onChange={(e) => isX && setForm((f) => ({ ...f, distance_km: +e.target.value }))}
      className="w-full"
      disabled={lock || (form.distance_km >= 9999)}
    />
    <div className={`w-28 text-right text-sm font-bold ${lock ? "text-gray-400" : "text-gray-700"}`}>
      {form.distance_km >= 9999 ? (t("prefs.global") || "Global") : `${form.distance_km} ${t("prefs.km")}`}
    </div>
  </div>

  {isX && (
    <div className="mt-2 flex items-center justify-between">
      <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
        <input
          type="checkbox"
          checked={form.distance_km >= 9999}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              distance_km: e.target.checked ? 9999 : Math.min(f.distance_km || 100, 500),
            }))
          }
        />
        {(t("prefs.global") || "Global")}
      </label>
      <div className="text-[11px] text-gray-500">
        {/* simple hint without new i18n key */}
        {form.distance_km >= 9999 ? "Worldwide" : "Up to 500 km"}
      </div>
    </div>
  )}
</Section>

            {/* Relationship goals */}
            <Section title={t("prefs.relationship")}>
              <div className="flex flex-wrap gap-2">
                {MULTI.relationship.map((opt) => (
                  <Chip
                    key={opt}
                    active={form.relationship.includes(opt)}
                    onClick={() =>
                      isX && setForm((f) => ({
                        ...f,
                        relationship: f.relationship.includes(opt)
                          ? f.relationship.filter((x) => x !== opt)
                          : [...f.relationship, opt],
                      }))
                    }
                    disabled={lock}
                  >
                    {Lrel(opt)}
                  </Chip>
                ))}
              </div>
            </Section>

            {/* Education */}
            <Section title={t("prefs.educationOpt")}>
              <div className="flex flex-wrap gap-2">
                {SINGLE.education_level.map((opt) => (
                  <Chip
                    key={opt}
                    active={form.education_level === opt}
                    onClick={() => isX && setForm((f) => ({ ...f, education_level: opt }))}
                    disabled={!isX}
                  >
                    {Le(opt)}
                  </Chip>
                ))}
              </div>
            </Section>

            {/* Ethnicity */}
            <Section title={t("prefs.ethnicityOpt")}>
              <div className="flex flex-wrap gap-2">
                {MULTI.ethnicity.map((opt) => (
                  <Chip
                    key={opt}
                    active={form.ethnicity.includes(opt)}
                    onClick={() =>
                      isX && setForm((f) => ({
                        ...f,
                        ethnicity: f.ethnicity.includes(opt)
                          ? f.ethnicity.filter((x) => x !== opt)
                          : [...f.ethnicity, opt],
                      }))
                    }
                    disabled={!isX}
                  >
                    {Leth(opt)}
                  </Chip>
                ))}
              </div>
            </Section>

            {/* Habits */}
            <Section title={t("prefs.habits")}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {["smoking","drinking","weed","drugs"].map((key) => (
                  <div key={key} className={`rounded-xl border p-3 ${lock ? "bg-white/60 border-gray-200" : "bg-white border-gray-200"}`}>
                    <div className={`text-xs font-bold mb-2 capitalize ${lock ? "text-gray-400" : "text-gray-600"}`}>{t(`prefs.${key}`)}</div>
                    <div className="flex flex-wrap gap-2">
                      {SINGLE[key].map((opt) => (
                        <Chip
                          key={opt}
                          active={form[key] === opt}
                          onClick={() => isX && setForm((f) => ({ ...f, [key]: opt }))}
                          disabled={lock}
                        >
                          {Lyn(opt)}
                        </Chip>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Religion */}
            <Section title={t("prefs.religionOpt")}>
              <div className="flex flex-wrap gap-2">
                {MULTI.religion.map((opt) => (
                  <Chip
                    key={opt}
                    active={form.religion.includes(opt)}
                    onClick={() =>
                      isX && setForm((f) => ({
                        ...f,
                        religion: f.religion.includes(opt)
                          ? f.religion.filter((x) => x !== opt)
                          : [...f.religion, opt],
                      }))
                    }
                    disabled={lock}
                  >
                    {Lrelg(opt)}
                  </Chip>
                ))}
              </div>
            </Section>

            {/* Politics */}
            <Section title={t("prefs.politicsOpt")}>
              <div className="flex flex-wrap gap-2">
                {MULTI.politics.map((opt) => (
                  <Chip
                    key={opt}
                    active={form.politics.includes(opt)}
                    onClick={() =>
                      isX && setForm((f) => ({
                        ...f,
                        politics: f.politics.includes(opt)
                          ? f.politics.filter((x) => x !== opt)
                          : [...f.politics, opt],
                      }))
                    }
                    disabled={lock}
                  >
                    {Lpol(opt)}
                  </Chip>
                ))}
              </div>
            </Section>

            {/* Family plans */}
            <Section title={t("prefs.familyPlansOpt")}>
              <div className="flex flex-wrap gap-2">
                {MULTI.family_plans.map((opt) => (
                  <Chip
                    key={opt}
                    active={form.family_plans.includes(opt)}
                    onClick={() =>
                      isX && setForm((f) => ({
                        ...f,
                        family_plans: f.family_plans.includes(opt)
                          ? f.family_plans.filter((x) => x !== opt)
                          : [...f.family_plans, opt],
                      }))
                    }
                    disabled={lock}
                  >
                    {Lfam(opt)}
                  </Chip>
                ))}
              </div>
            </Section>

            {/* Quality */}
            <Section title={t("prefs.quality")}>
              <div className={`flex items-center justify-between rounded-xl border px-4 py-3 mb-2 ${lock ? "bg-white/60 border-gray-200" : "bg-white border-gray-200"}`}>
                <div className={`text-sm font-semibold ${lock ? "text-gray-500" : "text-gray-800"}`}>{t("prefs.verifiedOnly")}</div>
                <button
                  type="button"
                  onClick={() => isX && setForm((f) => ({ ...f, verified_only: !f.verified_only }))}
                  className={`w-11 h-6 rounded-full relative transition ${form.verified_only ? "bg-[#a259c3]" : "bg-gray-300"} ${lock ? "opacity-60 cursor-not-allowed" : ""}`}
                  disabled={lock}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${form.verified_only ? "right-0.5" : "left-0.5"}`} />
                </button>
              </div>

              <div className={`flex items-center justify-between rounded-xl border px-4 py-3 mb-2 ${lock ? "bg-white/60 border-gray-200" : "bg-white border-gray-200"}`}>
                <div className={`text-sm font-semibold ${lock ? "text-gray-500" : "text-gray-800"}`}>{t("prefs.hasVoice")}</div>
                <button
                  type="button"
                  onClick={() => isX && setForm((f) => ({ ...f, has_voice: !f.has_voice }))}
                  className={`w-11 h-6 rounded-full relative transition ${form.has_voice ? "bg-[#a259c3]" : "bg-gray-300"} ${lock ? "opacity-60 cursor-not-allowed" : ""}`}
                  disabled={lock}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${form.has_voice ? "right-0.5" : "left-0.5"}`} />
                </button>
              </div>
            </Section>

            {/* Save CTA */}
            <button
              onClick={save}
              disabled={saving || !!ageError}
              className={`w-full mt-3 flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-white font-extrabold shadow
                ${saving || ageError ? "bg-gray-400 cursor-not-allowed" : "bg-[#a259c3] hover:bg-[#8d31c4]"}`}
            >
              <FaCheck /> {saving ? t("common.saving") : t("prefs.savePrefs")}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
