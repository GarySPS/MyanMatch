// src/pages/VerifyYourIdentityPage.jsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { useI18n } from "../i18n";

/* ----------------- i18n-aware prompts ----------------- */
// Keep prompts as KEYS; UI shows localized text via t()
const PROMPT_KEYS = [
  "verify.p.bigSmile",
  "verify.p.peaceSign",
  "verify.p.thumbsUp",
  "verify.p.turnRight",
  "verify.p.touchNose",
  "verify.p.holdThree",
  "verify.p.lookUpEyes",
];

// sample images are mapped by prompt key (stable)
const SAMPLE_IMAGES = {
  "verify.p.bigSmile": "/images/kyc/big-smile.png",
  "verify.p.peaceSign": "/images/kyc/peace-sign.png",
  "verify.p.thumbsUp": "/images/kyc/thumbs-up.png",
  "verify.p.turnRight": "/images/kyc/look-right.png",
  "verify.p.touchNose": "/images/kyc/touch-nose.png",
  "verify.p.holdThree": "/images/kyc/three-fingers.png",
  "verify.p.lookUpEyes": "/images/kyc/look-up-eyes.png",
};

function sampleForPromptKey(promptKey) {
  return SAMPLE_IMAGES[promptKey] || "/images/kyc/sample-placeholder.jpg";
}

function pickFirstUrl(v) {
  if (!v) return null;
  if (Array.isArray(v)) return v[0] || null;
  if (typeof v === "string") {
    if (v.trim().startsWith("[")) {
      try {
        const arr = JSON.parse(v);
        if (Array.isArray(arr) && arr.length) return arr[0] || null;
      } catch {}
    }
    if (v.includes(",")) {
      const first = v.split(",").map((s) => s.trim()).filter(Boolean)[0];
      if (first) return first;
    }
    return v || null;
  }
  return null;
}

/* ----- avatar resolver: SAME logic as ExplorePage (prefer avatar_path > avatar_url > first media) ----- */
function _pickFirst(arr) {
  return Array.isArray(arr) && arr.length ? arr[0] : null;
}

function _parseFirstMedia(media) {
  if (Array.isArray(media)) return _pickFirst(media);
  if (typeof media === "string" && media.trim().startsWith("[")) {
    try {
      const a = JSON.parse(media);
      return _pickFirst(a);
    } catch {
      return null;
    }
  }
  return typeof media === "string" ? media : null;
}

function publicUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path; // already URL (public/signed)
  const cleanPath = String(path).replace(/^media\//, "");
  try {
    const { data } = supabase.storage.from("media").getPublicUrl(cleanPath);
    return data?.publicUrl || null;
  } catch {
    return null;
  }
}

/** Prefer avatar_path > avatar_url (but never signed) > first media */
function resolveAvatar(profile) {
  if (profile?.avatar_path) return publicUrl(profile.avatar_path);
  if (typeof profile?.avatar_url === "string" && /^https?:\/\//i.test(profile.avatar_url)) {
    if (!/\/object\/sign\//.test(profile.avatar_url)) {
      return profile.avatar_url;
    }
  }
  const first = _parseFirstMedia(profile?.media);
  return publicUrl(first);
}

function getLocalUserId() {
  try {
    const u = JSON.parse(localStorage.getItem("myanmatch_user") || "{}");
    return u.user_id || u.id || null;
  } catch {
    return null;
  }
}

function uuidv4() {
  return URL.createObjectURL(new Blob()).split("/").pop();
}

async function sha256OfBlob(blob) {
  const buf = await blob.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function fetchAsBlob(url) {
  const res = await fetch(url, { credentials: "omit" });
  if (!res.ok) throw new Error("Failed to fetch avatar snapshot");
  return await res.blob();
}

/** Downscale & JPEG-compress to keep uploads fast (≈ 0.85 quality, max 1600px) */
async function compressImage(file, { max = 1600, quality = 0.85 } = {}) {
  const blob = file instanceof Blob ? file : new Blob([file]);
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, w, h);

    const out = await new Promise((res) => canvas.toBlob((b) => res(b || blob), "image/jpeg", quality));
    return out || blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/* ----------------- Page ----------------- */
export default function VerifyYourIdentityPage() {
  const { t } = useI18n();
  const myId = getLocalUserId();

  const [selfie1, setSelfie1] = useState(null);
  const [selfie2, setSelfie2] = useState(null);
  const [hash1, setHash1] = useState("");
  const [hash2, setHash2] = useState("");

  const [userRow, setUserRow] = useState(null); // { kyc_status, avatar_url? }
  const [profileRow, setProfileRow] = useState(null); // raw profile for storage download
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [lastKyc, setLastKyc] = useState(null); // { id, status, notes, created_at }
  const [showDeniedBanner, setShowDeniedBanner] = useState(false);

  // 2 random prompts (stable for this visit)
  const [pKey1, pKey2] = useMemo(() => {
    const a = [...PROMPT_KEYS];
    const first = a.splice(Math.floor(Math.random() * a.length), 1)[0];
    const second = a[Math.floor(Math.random() * a.length)];
    return [first, second];
  }, []);

  // Load kyc fields from users, avatar from profiles (if any) + latest KYC row for banner
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!myId) return;

      const [uRes, pRes, kycRes] = await Promise.all([
        supabase.from("users").select("id, username, kyc_status, verified, verified_at, last_kyc_request_id").eq("id", myId).maybeSingle(),
        supabase.from("profiles").select("user_id, media, avatar_url, avatar_path, is_verified").eq("user_id", myId).maybeSingle(),
        supabase.from("kyc_requests").select("id,status,notes,created_at").eq("user_id", myId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);

      if (!alive) return;

      const u = uRes.data || {};
      const p = pRes.data || {};
      setProfileRow(p);
      const k = kycRes.data || null;

      const avatarUrl = await resolveAvatar(p || {});
      const verified = !!u?.verified_at || !!p?.is_verified;
      const kyc_status = u?.kyc_status || k?.status || null;
      setUserRow({ ...u, kyc_status, verified, avatar_url: avatarUrl });
      setLastKyc(k);

      if (k && k.status === "denied") {
        const seenKey = `seen_kyc_denial_${k.id}`;
        setShowDeniedBanner(!localStorage.getItem(seenKey));
      } else {
        setShowDeniedBanner(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [myId]);

  // compute hashes to prevent submitting identical selfies
  useEffect(() => {
    (async () => {
      setErrorMsg("");
      if (selfie1) setHash1(await sha256OfBlob(selfie1));
      else setHash1("");
      if (selfie2) setHash2(await sha256OfBlob(selfie2));
      else setHash2("");
    })();
  }, [selfie1, selfie2]);

  const kycPending = userRow?.kyc_status === "pending" || lastKyc?.status === "pending";
  const canSubmit = !!selfie1 && !!selfie2 && !loading && !kycPending && hash1 !== hash2;

  async function handleSubmit() {
    try {
      setStatusMsg("");
      setErrorMsg("");
      if (!myId) return setErrorMsg(t("verify.err.signInFirst"));
      if (!selfie1 || !selfie2) return setErrorMsg(t("verify.err.needBoth"));
      if (hash1 && hash2 && hash1 === hash2) {
        return setErrorMsg(t("verify.err.identical"));
      }

      setLoading(true);

      const kycId = uuidv4();
      const base = `kyc/${myId}/${kycId}`;
      const pathSelfie1 = `${base}/selfie1.jpg`;
      const pathSelfie2 = `${base}/selfie2.jpg`;

      const c1 = await compressImage(selfie1);
      const c2 = await compressImage(selfie2);

      const up1 = await supabase.storage.from("kyc").upload(pathSelfie1, c1, { upsert: true, contentType: "image/jpeg" });
      if (up1.error) throw up1.error;

      const up2 = await supabase.storage.from("kyc").upload(pathSelfie2, c2, { upsert: true, contentType: "image/jpeg" });
      if (up2.error) throw up2.error;

      // ----- Avatar snapshot (required by DB) -----
      let pathAvatar = `${base}/avatar.jpg`;
      let avatarHash = null;

      function extractMediaPathFromUrl(u) {
        if (!u || typeof u !== "string") return null;
        const m = u.match(/\/object\/(?:public|sign)\/media\/([^?]+)/);
        return m ? decodeURIComponent(m[1]) : null;
        }

      async function tryDownloadFromMedia(pathOrUrl) {
        if (!pathOrUrl) return null;
        const asPath = extractMediaPathFromUrl(pathOrUrl) || String(pathOrUrl);
        const clean = asPath.replace(/^media\//, "");
        const { data, error } = await supabase.storage.from("media").download(clean);
        return error ? null : data;
      }

      let avatarBlob = null;
      if (profileRow?.avatar_path) {
        avatarBlob = await tryDownloadFromMedia(profileRow.avatar_path);
      }
      if (!avatarBlob && profileRow?.avatar_url) {
        avatarBlob = await tryDownloadFromMedia(profileRow.avatar_url);
        if (!avatarBlob && !extractMediaPathFromUrl(profileRow.avatar_url)) {
          try {
            avatarBlob = await fetchAsBlob(profileRow.avatar_url);
          } catch {}
        }
      }
      if (!avatarBlob) {
        const first = _parseFirstMedia(profileRow?.media);
        if (first) avatarBlob = await tryDownloadFromMedia(first);
      }

      if (avatarBlob) {
        avatarHash = await sha256OfBlob(avatarBlob);
        const upA = await supabase.storage.from("kyc").upload(pathAvatar, avatarBlob, {
          upsert: true,
          contentType: "image/jpeg",
        });
        if (upA.error) throw upA.error;
      } else {
        avatarHash = await sha256OfBlob(c1);
        const upA2 = await supabase.storage.from("kyc").upload(pathAvatar, c1, {
          upsert: true,
          contentType: "image/jpeg",
        });
        if (upA2.error) throw upA2.error;
      }

      const { error: insErr } = await supabase.from("kyc_requests").insert({
        user_id: myId,
        status: "pending",
        selfie1_url: pathSelfie1,
        selfie2_url: pathSelfie2,
        avatar_snapshot_url: pathAvatar,
        avatar_sha256: avatarHash,
      });
      if (insErr) throw insErr;

      await supabase.from("users").update({ kyc_status: "pending" }).eq("id", myId);

      setStatusMsg(t("verify.msg.submitted"));
      setUserRow((u) => (u ? { ...u, kyc_status: "pending" } : u));
      setSelfie1(null);
      setSelfie2(null);
      setHash1("");
      setHash2("");
    } catch (e) {
      console.error(e);
      setErrorMsg(e?.message || t("verify.err.generic"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-dvh w-full overflow-x-hidden"
      style={{
        background:
          "radial-gradient(1200px 500px at 0% -15%, #b51f42 0%, transparent 60%), linear-gradient(145deg,#7d0f2c 0%, #47112d 100%)",
      }}
    >
      {/* Header */}
      <div className="mx-auto max-w-xl px-4 pt-6 pb-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-rose-50">{t("verify.title")}</h1>
        <p className="mt-1 text-[13px] text-rose-100/80">{t("verify.subtitle")}</p>
      </div>

      {/* Card */}
      <div className="mx-auto max-w-xl px-4">
        <div className="rounded-3xl bg-[#fff7ed] ring-1 ring-[#f2ddc6] shadow-[0_10px_40px_rgba(0,0,0,0.08)] overflow-hidden">
          {/* Status row */}
          <div className="px-5 py-3 bg-[#fff1e3] border-b border-[#f2ddc6]">
            <div className="flex items-center justify-between">
              <div className="text-[13px] text-[#8a6a5a]">
                <span className="opacity-80">{t("verify.kycStatus")}: </span>
                <span className="font-semibold">{userRow?.kyc_status || (userRow ? "none" : t("verify.loading"))}</span>
                {userRow?.verified && <span className="ml-2 text-sky-600 font-semibold">{t("verify.verified")}</span>}
              </div>
              {userRow?.avatar_url ? (
                <img
                  src={userRow.avatar_url}
                  alt={t("verify.alt.avatar")}
                  className="h-9 w-9 rounded-lg object-cover ring-1 ring-[#f2ddc6]"
                />
              ) : (
                <span className="text-xs text-[#8a6a5a]">{t("verify.addAvatar")}</span>
              )}
            </div>
            <div className="mt-1 text-[11px] text-[#a58774]">{t("verify.badgeNote")}</div>
          </div>

          {/* Body */}
          <div className="p-5">
            {/* Prompts row */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-1">
              <PromptCard title={t("verify.selfieA")} promptKey={pKey1} file={selfie1} onFile={setSelfie1} />
              <PromptCard title={t("verify.selfieB")} promptKey={pKey2} file={selfie2} onFile={setSelfie2} />
            </div>

            {/* Duplicate warning */}
            {hash1 && hash2 && hash1 === hash2 && (
              <div className="mt-3 rounded-xl bg-amber-100 text-amber-900 text-[13px] px-3 py-2">
                {t("verify.warn.identical")}
              </div>
            )}

            {/* Actions */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`mt-5 w-full rounded-full px-5 py-3 text-sm font-bold shadow ${
                canSubmit ? "bg-[#101010] text-white hover:opacity-90" : "bg-[#e9d8c8] text-[#9b7e6a] cursor-not-allowed"
              }`}
            >
              {kycPending ? t("verify.btn.pending") : loading ? t("verify.btn.submitting") : t("verify.btn.submit")}
            </button>

            {/* Messages */}
            {statusMsg && <div className="mt-3 text-center text-[13px] text-[#7b5f4f]">{statusMsg}</div>}
            {errorMsg && <div className="mt-3 text-center text-[13px] text-[#b23939]">{errorMsg}</div>}

            <div className="mt-2 text-center text-[11px] text-[#a58774]">{t("verify.tip")}</div>
          </div>
        </div>
      </div>

      {/* Samples + small guide */}
      <div className="mx-auto max-w-xl px-4 py-8 pb-[calc(env(safe-area-inset-bottom)+24px)]">
        <div className="grid grid-cols-2 gap-4">
          <SampleCard promptKey={pKey1} />
          <SampleCard promptKey={pKey2} />
        </div>

        <ul className="mt-4 text-rose-50/90 text-[12px] list-disc list-inside space-y-1">
          <li>{t("verify.list.noCover")}</li>
          <li>{t("verify.list.frontCam")}</li>
          <li>{t("verify.list.useOnly")}</li>
        </ul>
      </div>

      {/* ===== POPUP BANNER when KYC denied ===== */}
      {showDeniedBanner && lastKyc?.status === "denied" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl max-w-sm w-full mx-4 p-5 shadow-xl text-center">
            <h2 className="text-lg font-bold text-red-600">{t("verify.denied.title")}</h2>
            <p className="mt-2 text-sm text-gray-600">
              {lastKyc?.notes || t("verify.denied.default")}
            </p>
            <button
              onClick={() => {
                setShowDeniedBanner(false);
                localStorage.setItem(`seen_kyc_denial_${lastKyc.id}`, "1");
              }}
              className="mt-4 w-full rounded-full bg-[#101010] text-white py-2 font-semibold hover:opacity-90"
            >
              {t("verify.denied.ok")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------- Subcomponents ----------------- */
function PromptCard({ title, promptKey, file, onFile }) {
  const { t } = useI18n();
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="rounded-2xl p-4 bg-white ring-1 ring-[#f2ddc6] flex flex-col">
      <div className="text-[11px] uppercase tracking-wide text-[#a58774] mb-1">{title}</div>
      <div className="text-lg font-semibold text-[#2c2420] mb-3 min-h-[28px]">{t(promptKey)}</div>

      <label className="block relative group flex-1">
        <input
          type="file"
          accept="image/*"
          capture="user"
          className="absolute inset-0 opacity-0 cursor-pointer"
          onChange={(e) => onFile(e.target.files?.[0] || null)}
        />
        <div className="flex h-full min-h-[160px] items-center justify-center rounded-xl bg-[#fff7ed] text-[#8a6a5a] group-hover:bg-[#fff1e3] transition overflow-hidden">
          {preview ? (
            <img src={preview} alt={`${title} preview`} className="w-full h-full object-cover" />
          ) : (
            t("verify.tapToTake")
          )}
        </div>
      </label>

      {file && (
        <div className="mt-2 flex items-center justify-between text-[12px] text-[#7b5f4f]">
          <span className="truncate mr-2">{file.name}</span>
          <button
            type="button"
            onClick={() => onFile(null)}
            className="px-3 py-1 rounded-lg border border-[#e6d6c3] text-[#7e5c49] hover:bg-[#fff7ed]"
          >
            {t("verify.remove")}
          </button>
        </div>
      )}
    </div>
  );
}

function SampleCard({ promptKey }) {
  const { t } = useI18n();
  return (
    <figure className="rounded-2xl overflow-hidden ring-1 ring-[#6f1d1d] bg-[#7f1f1f]">
      <img
        src={sampleForPromptKey(promptKey)}
        alt={t("verify.alt.example", { prompt: t(promptKey) })}
        className="h-44 w-full object-cover"
        loading="lazy"
      />
      <figcaption className="px-3 py-2 text-[12px] text-[#ffd7bd]">
        {t("verify.samplePrefix", { prompt: t(promptKey) })}
      </figcaption>
    </figure>
  );
}
