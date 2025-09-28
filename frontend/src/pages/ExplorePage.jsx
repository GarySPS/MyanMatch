// src/pages/ExplorePage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { FaGift, FaBolt, FaCrown, FaCheckCircle } from "react-icons/fa";
import { useI18n } from "../i18n";
import { useAuth } from "../context/AuthContext";

/* ---------- utilities ---------- */
function nowISO() { return new Date().toISOString(); }
function getLocalUser() {
  try { return JSON.parse(localStorage.getItem("myanmatch_user") || "{}"); } catch { return {}; }
}
function calcAge(birthdate) {
  if (!birthdate) return "";
  const d = new Date(birthdate);
  if (isNaN(d)) return "";
  const diff = Date.now() - d.getTime();
  const ageDt = new Date(diff);
  return Math.abs(ageDt.getUTCFullYear() - 1970);
}
/* ---------- avatar resolver: use public storage directly ---------- */
function _pickFirst(arr) {
  return Array.isArray(arr) && arr.length ? arr[0] : null;
}

function _parseFirstMedia(media) {
  let first = Array.isArray(media)
    ? _pickFirst(media)
    : (typeof media === "string" && media.startsWith("["))
      ? (() => { try { return _pickFirst(JSON.parse(media)); } catch { return null; } })()
      : (typeof media === "string" ? media : null);
  return first || null;
}

function publicUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path; // already a URL (maybe signed)
  // Path is stored without bucket (e.g., "userId/onboarding/xxx.png"), bucket is "media"
  const cleanPath = path.replace(/^media\//, ""); // tolerate if someone stored with "media/"
  try {
    const { data } = supabase.storage.from("media").getPublicUrl(cleanPath);
    return data?.publicUrl || null;
  } catch {
    return null;
  }
}

/** Prefer avatar_path > avatar_url > first media */
function resolveAvatar(profile) {
  if (profile?.avatar_path) return publicUrl(profile.avatar_path);
  if (typeof profile?.avatar_url === "string" && /^https?:\/\//i.test(profile.avatar_url)) {
    return profile.avatar_url;
  }
  const first = _parseFirstMedia(profile?.media);
  return publicUrl(first);
}

function timeLeft(iso) {
  const end = new Date(iso);
  const ms = end - new Date();
  if (isNaN(end) || ms <= 0) return "ended";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h >= 24) {
    const d = Math.floor(h / 24);
    const hr = h % 24;
    return `${d}d ${hr}h left`;
  }
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}
function isEndingSoon(iso) {
  const ms = new Date(iso) - new Date();
  return ms > 0 && ms <= 15 * 60 * 1000;
}

/* ---------- Gift modal ---------- */
function GiftSendModal({ open, onClose, senderId, receiverId, onSent, presetComment = "" }) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [selectedGift, setSelectedGift] = useState(null);
  const [comment, setComment] = useState(presetComment);

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

      onSent?.(); onClose?.();
    } catch (e) {
      console.error("Send gift failed:", e);
      alert(t("gift.error"));
    } finally { setLoading(false); }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div className="w-[92%] max-w-md bg-white rounded-3xl shadow-2xl p-5">
        <div className="flex items-center gap-2 text-xl font-extrabold mb-3">
          <FaGift className="text-pink-500" />
          <span>{t("gift.title")}</span>
        </div>

        <div className="max-h-64 overflow-auto rounded-xl border border-gray-100 p-2 mb-4">
 {!loading && inventory.length === 0 && (
   <div className="p-4 text-gray-500 text-center">{t("gift.empty")}</div>
 )}

          {!loading && inventory.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {loading && <div className="p-4 text-gray-500 text-center">{t("gift.loading")}</div>}
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
            {t("gift.cancel")}
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

/* ---------- skeleton ---------- */
function SkeletonCard() {
  return (
    <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-white/5">
      <div className="animate-pulse">
        <div className="aspect-[3/4] bg-white/10" />
        <div className="p-4">
          <div className="h-5 bg-white/10 rounded w-2/3 mb-2" />
          <div className="h-4 bg-white/10 rounded w-1/2" />
          <div className="mt-4 h-10 bg-white/10 rounded" />
        </div>
      </div>
    </div>
  );
}

/* ---------- page ---------- */
export default function ExplorePage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [boosted, setBoosted] = useState([]);
  const [banner, setBanner] = useState("");

  const [giftOpen, setGiftOpen] = useState(false);
  const [receiverId, setReceiverId] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setBanner("");

      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("user_id, first_name, birthdate, media, avatar_url, avatar_path, boosted_until, is_verified")
        .gt("boosted_until", nowISO())
        .order("boosted_until", { ascending: false });

      if (error) {
        setBoosted([]); setBanner(t("explore.banner.error"));
        setLoading(false); return;
      }

const merged = (profiles || []).map((p) => ({
  user_id: p.user_id,
  boosted_until: p.boosted_until,
  first_name: p.first_name || "User",
  age: calcAge(p.birthdate),
  avatar_url: resolveAvatar(p),   // direct public URL
  is_verified: !!p.is_verified,
}));

      setBoosted(merged);
      setLoading(false);
    })();
  }, []);

  const openGift = (e, toUserId) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    setReceiverId(toUserId);
    setGiftOpen(true);
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full text-white overflow-hidden">
      {/* FULL-VIEWPORT BACKGROUND that overrides Layout */}
      <div className="fixed inset-0 z-[1] pointer-events-none">
        {/* gradient base */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#201033] via-[#120f1f] to-[#0a0a12]" />
        {/* soft global scrim for readability */}
        <div className="absolute inset-0 bg-black/30" />
        {/* decorative glows */}
        <div className="absolute -top-28 -left-24 w-[22rem] h-[22rem] rounded-full bg-pink-500/25 blur-[110px]" />
        <div className="absolute -bottom-28 -right-24 w-[22rem] h-[22rem] rounded-full bg-purple-500/25 blur-[110px]" />
      </div>

      {/* CONTENT */}
      <div className="relative z-[2] max-w-6xl mx-auto px-4 pt-10 pb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15">
              <FaCrown className="text-yellow-300" />
              <span className="text-sm font-semibold tracking-wide">{t("explore.ribbon")}</span>
            </div>
            <h1 className="mt-3 text-2xl md:text-3xl font-extrabold tracking-tight">
              {t("explore.title")}
            </h1>
            <p className="mt-1 text-white/85 text-sm">
              {t("explore.subtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/Profile")}
            className="group inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-[#111117] font-bold shadow-lg hover:shadow-xl transition border border-white"
          >
            <FaBolt className="group-hover:animate-pulse" />
            {t("explore.boostMe")}
          </button>
        </div>

        {banner && (
          <div className="mt-4 inline-flex items-center px-4 py-2 rounded-xl bg-white/10 border border-white/15 text-white/80 text-sm">
            {banner}
          </div>
        )}
      </div>

      {/* GRID (ALWAYS 2 COLUMNS) */}
      <div className="relative z-[2] max-w-6xl mx-auto px-4 pb-28">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-5 mt-2">
            {[0,1,2,3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : boosted.length === 0 ? (
          <EmptyState onBoost={() => navigate("/Profile")} />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-5 mt-2">
            {boosted.map((u) => (
              <Link
                key={u.user_id}
                to={`/profile/${u.user_id}`}
                className="block focus:outline-none focus:ring-2 focus:ring-pink-500 rounded-[22px]"
              >
                <ProfileCard user={u} onSendGift={(e) => openGift(e, u.user_id)} />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Gift modal */}
      <GiftSendModal
        open={giftOpen}
        onClose={() => setGiftOpen(false)}
        senderId={profile?.user_id}
        receiverId={receiverId}
        onSent={() => {}}
      />
    </div>
  );
}

/* ---------- boosted profile card ---------- */
function ProfileCard({ user, onSendGift }) {
  const { t } = useI18n();
  return (
    <div className="relative rounded-[22px] overflow-hidden border border-white/10 bg-white/5 backdrop-blur-[2px] shadow-[0_15px_40px_rgba(0,0,0,0.35)] transition hover:shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
      <div className="relative aspect-[3/4]">
{user.avatar_url ? (
  <img
    src={user.avatar_url}
    alt={user.first_name}
    className="w-full h-full object-cover"
    draggable={false}
    loading="lazy"
  />
) : (
  // no fake avatar — show a neutral gradient block
  <div className="w-full h-full bg-gradient-to-br from-[#2a1938] via-[#1a1324] to-[#0b0a12]" />
)}
        {/* Top badges */}
        <div className="absolute top-2 left-2 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold bg-pink-600/90">
            <FaCrown className="text-yellow-300" />
            {t("explore.boosted")}
          </span>
        </div>
        {user.is_verified && (
  <div className="absolute top-2 right-2">
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-sky-600/95 border border-white/20 shadow-md">
      <FaCheckCircle className="text-white" />
    </span>
  </div>
)}

{/* Bottom gradient & info */}
<div className="absolute inset-x-0 bottom-0 p-2.5">
  <div className="rounded-xl p-3 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
    <div className="flex items-end justify-between gap-2">
      {/* ⬇️ REPLACE THIS WHOLE <div> WITH THE ONE BELOW */}
      <div className="leading-tight">
        <div className="text-base font-extrabold tracking-tight truncate max-w-[9rem] sm:max-w-[11rem]">
          {user.first_name}
        </div>
        {user.age ? (
          <div className="text-sm font-semibold text-white/80">
            {user.age}
          </div>
        ) : null}
      </div>

      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSendGift?.(e); }}
        className="shrink-0 inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-gradient-to-tr from-pink-500 to-[#a259c3] text-white font-extrabold shadow-lg hover:shadow-xl transition"
        type="button"
      >
        <FaGift />
        <span className="text-xs">{t("explore.card.gift")}</span>
      </button>
    </div>
  </div>
</div>
      </div>
    </div>
  );
}

/* ---------- empty state ---------- */
function EmptyState({ onBoost }) {
  const { t } = useI18n();
  return (
    <div className="relative z-[2] flex flex-col items-center mt-16 text-center">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 text-white/85">
        <FaCrown className="text-yellow-300" />
        {t("explore.empty.ribbon")}
      </div>
      <h3 className="mt-4 text-xl font-extrabold">{t("explore.empty.title")}</h3>
      <p className="mt-1 text-white/85 text-sm max-w-sm">
        {t("explore.empty.desc")}
      </p>
      <button
        onClick={onBoost}
        className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-[#111117] font-bold shadow-lg hover:shadow-xl transition border border-white"
        type="button"
      >
        <FaBolt />
        {t("explore.boostMe")}
      </button>
    </div>
  );
}
