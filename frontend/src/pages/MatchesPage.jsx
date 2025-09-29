// src/pages/MatchesPages.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useI18n } from "../i18n";
import { useAuth } from "../context/AuthContext";


function normalizePlan(p) {
  const s = String(p || "").toLowerCase().trim();
  if (["plus", "myanmatch+", "myanmatch plus", "myanmatchplus"].includes(s)) return "plus";
  if (["x", "myanmatchx", "myanmatch x"].includes(s)) return "x";
  return "free";
}

export default function MatchesPages() {
  const { profile } = useAuth();
  const myId = profile?.user_id;
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [matchModal, setMatchModal] = useState(null); // { avatar_url, name }
  const navigate = useNavigate();
  const { t } = useI18n();

  useEffect(() => {
    let mounted = true;

    async function fetchLikes() {
      setLoading(true);

      if (!myId) {
        if (mounted) {
          setLikes([]);
          setShowOnboarding(true);
          setLoading(false);
        }
        return;
      }

// A) Premium check (use membership_plan + membership_expires_at)
try {
  const { data: me } = await supabase
    .from("profiles")
    .select("is_plus,membership_plan,membership_expires_at")
    eq("user_id", myId)
    .single();

  const norm = normalizePlan(me?.membership_plan);
  const notExpired =
    !!me?.membership_expires_at &&
    new Date(me.membership_expires_at).getTime() > Date.now();

  // Legacy is_plus kept for safety, but primary source is membership_plan
  const premium = (norm === "plus" || norm === "x") && notExpired || !!me?.is_plus;

  if (mounted) setIsPremium(!!premium);
} catch {
  if (mounted) setIsPremium(false);
}

      // B) Incoming likes (include like row id)
      const { data: incoming, error: inErr } = await supabase
        .from("likes")
        .select("id,from_user_id,created_at,type,comment,is_visible")
        .eq("to_user_id", myId)
        .eq("is_visible", true)
        .order("created_at", { ascending: false });

      if (inErr || !incoming?.length) {
        if (mounted) {
          setLikes([]);
          setShowOnboarding(true);
          setLoading(false);
        }
        return;
      }

      // C) Exclude ones you already liked back (matches)
      const fromIds = [...new Set(incoming.map((l) => l.from_user_id).filter(Boolean))];

 const { data: outgoingToThem } = await supabase
   .from("likes")
   .select("to_user_id,type,is_visible")
   .eq("from_user_id", myId)
   .in("to_user_id", fromIds)
   .eq("is_visible", true);
   // Optional (stricter):
   // .in("type", ["like", "superlike"]);

      const matchedIds = new Set((outgoingToThem || []).map((r) => r.to_user_id));
      const filteredIncoming = incoming.filter((l) => !matchedIds.has(l.from_user_id));

      if (!filteredIncoming.length) {
        if (mounted) {
          setLikes([]);
          setShowOnboarding(true);
          setLoading(false);
        }
        return;
      }

      // D) Load sender profiles
      const needProfiles = [...new Set(filteredIncoming.map((l) => l.from_user_id))];
      const { data: profs, error: pErr } = await supabase
.from("profiles")
.select("user_id,first_name,age,media,media_paths,is_verified")
.in("user_id", needProfiles);

      if (pErr) {
        if (mounted) {
          setLikes([]);
          setShowOnboarding(true);
          setLoading(false);
        }
        return;
      }

      // E) Merge data
      const rows = await Promise.all(
        filteredIncoming.map(async (l) => {
          const p = profs.find((x) => x.user_id === l.from_user_id);

          let avatar = "/images/avatar.jpg";
          try {
            if (Array.isArray(p?.media_paths) && p.media_paths[0]) {
              const { data: s } = await supabase.storage
                .from("media")
                .createSignedUrl(p.media_paths[0], 60 * 60 * 24 * 7);
              if (s?.signedUrl) avatar = s.signedUrl;
            } else if (Array.isArray(p?.media) && p.media[0]) {
              avatar = p.media[0];
            } else if (typeof p?.media === "string" && p.media.startsWith("[")) {
              const arr = JSON.parse(p.media);
              if (arr?.[0]) avatar = arr[0];
            } else if (typeof p?.media === "string" && p.media) {
              avatar = p.media;
            }
          } catch {}

          const type = (l.type || "like").toLowerCase();
          const isSuper = type === "superlike" || type === "gift"; // always visible

return {
  like_id: l.id,
  id: p?.user_id || l.from_user_id,
  first_name: p?.first_name || "Member",
  avatar_url: avatar,
  likedAt: l.created_at,
  type,
  isSuper,
  comment: l.comment || "",
  is_verified: !!p?.is_verified,
};
        })
      );

      if (mounted) {
        setLikes(rows);
        setShowOnboarding(rows.length === 0);
        setLoading(false);
      }
    }

    fetchLikes();
    return () => {
      mounted = false;
    };
  }, [myId]);

  const isEmpty = !likes.length && !loading;

  // Actions
  async function handleSkip(u) {
    try {
      await supabase.from("likes").update({ is_visible: false }).eq("id", u.like_id);
    } catch {}
    setLikes((arr) => arr.filter((x) => x.like_id !== u.like_id));
  }

  async function handleLikeBack(u) {
    if (!myId) return; // <-- Use myId from context directly

    try {
      await supabase.from("likes").insert({
        from_user_id: myId, // <-- Use myId from context
        to_user_id: u.id,
        type: "like",
        is_visible: true,
      });
      setMatchModal({id: u.id, avatar_url: u.avatar_url, name: u.first_name || "New match!" });
    } catch {}
    setLikes((arr) => arr.filter((x) => x.like_id !== u.like_id));
  }

  // NEW: open profile for unlocked cards
  function openProfile(u) {
    if (!u?.id) return;
    navigate(`/profile/${u.id}`);
  }

  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full text-white overflow-hidden">
      {/* FULL-PAGE BACKGROUND (override Layout background) */}
      <div className="fixed inset-0 z-[1] pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#201033] via-[#120f1f] to-[#0a0a12]" />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute -top-28 -left-24 w-[22rem] h-[22rem] rounded-full bg-pink-500/25 blur-[110px]" />
        <div className="absolute -bottom-28 -right-24 w-[22rem] h-[22rem] rounded-full bg-purple-500/25 blur-[110px]" />
      </div>

      {/* HEADER */}
      <div className="relative z-[2] flex items-center justify-between px-4 pt-6 pb-3">
        <span className="px-4 py-1.5 rounded-2xl bg-white/10 border border-white/15 font-semibold">
         {t("matches.header")}
        </span>
        <button
          className="px-4 py-2 rounded-xl bg-white text-[#111117] font-bold shadow border border-white"
          onClick={() => navigate("/PricingPage")}
        >
          Upgrade
        </button>
      </div>

      {/* ONBOARDING */}
      {!loading && showOnboarding && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50"
          onClick={() => setShowOnboarding(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-xs w-[88%] p-6 text-center text-[#120916]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xl font-extrabold mb-2">{t("matches.onboarding.title")}</div>
            <div className="text-sm mb-4">
              {t("matches.onboarding.desc")}
            </div>
            <button
              className="px-6 py-3 rounded-xl bg-[#a259c3] text-white font-bold"
              onClick={() => setShowOnboarding(false)}
            >
              {t("matches.onboarding.gotit")}
            </button>
          </div>
        </div>
      )}

      {/* EMPTY */}
      {isEmpty && !showOnboarding && (
        <div className="relative z-[2] flex flex-col items-center justify-center min-h-[62vh] px-4 pt-10 pb-8 text-center">
          <div className="text-2xl font-extrabold mb-2">{t("matches.empty.title")}</div>
          <p className="text-white/85 max-w-xs">
            {t("matches.empty.desc")}
          </p>
          <button
            className="mt-4 px-7 py-4 rounded-2xl bg-white text-[#111117] font-bold shadow"
            onClick={() => navigate("/BoostPage")}
          >
            {t("matches.empty.tryBoost")}
          </button>
        </div>
      )}

      {/* GRID */}
      {!loading && likes.length > 0 && !showOnboarding && (
        <div className="relative z-[2] grid grid-cols-2 gap-4 px-4 pt-2 pb-28">
          {likes.map((u) => {
            const unlocked = isPremium || u.isSuper;

            return (
              <div
                key={u.like_id}
                className={`relative rounded-[22px] overflow-hidden shadow-xl aspect-[3/4] bg-white/5 border border-white/10 ${
                  unlocked ? "cursor-pointer" : ""
                }`}
                onClick={() => {
                  if (unlocked) openProfile(u);
                }}
              >
                <img
                  src={u.avatar_url}
                  alt=""
                  className={`w-full h-full object-cover transition-transform duration-300 ${
                    unlocked ? "" : "blur-[12px] brightness-75 scale-105"
                  }`}
                  draggable={false}
                />

                {/* Locked overlay for regular likes */}
                {!unlocked && (
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center text-white cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation(); // prevent trying to open profile
                      navigate("/PricingPage");
                    }}
                  >
                    <div className="rounded-full bg-black/60 p-2 mb-2">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <path d="M7 10V7a5 5 0 1110 0v3" stroke="white" strokeWidth="2" strokeLinecap="round" />
                        <rect x="5" y="10" width="14" height="10" rx="2" fill="white" />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold bg-black/50 px-2 py-1 rounded-full">
                      {t("matches.locked")}
                    </span>
                  </div>
                )}

                {/* Name badge + comment (always visible for gift/superlike) */}
                {u.isSuper && (
                  <>
<span className="absolute left-2 top-2 flex items-center gap-1 bg-[#a259c3] text-white text-xs font-bold px-2 py-1 rounded-full shadow">
  {u.first_name || "Member"}
  {u.is_verified && (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-4 h-4 text-blue-400"
    >
      <path
        fillRule="evenodd"
        d="M20.285 6.709a1 1 0 010 1.414l-9.193 9.193a1 1 0 01-1.414 0l-4.193-4.193a1 1 0 011.414-1.414l3.486 3.486 8.486-8.486a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  )}
</span>
                    {u.comment ? (
                      <div className="absolute left-2 right-2 bottom-16 rounded-xl px-3 py-2 bg-white/95 text-[#120916] text-xs font-medium shadow">
                        {u.comment}
                      </div>
                    ) : null}
                  </>
                )}

                {/* Action buttons for unlocked cards */}
                {unlocked && (
                  <div className="absolute left-0 right-0 bottom-2 flex items-center justify-center gap-4">
                    <button
                      aria-label="Skip"
                      className="w-10 h-10 rounded-full bg-white text-[#1f2937] grid place-items-center shadow"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSkip(u);
                      }}
                    >
                      ✕
                    </button>
                    <button
                      aria-label="Like back"
                      className="w-12 h-12 rounded-full bg-[#ef476f] text-white text-lg grid place-items-center shadow"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLikeBack(u);
                      }}
                    >
                      ♥
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* UPGRADE BAR */}
      <div
        className="fixed left-0 right-0 z-50 flex justify-center items-center pointer-events-none"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 7.5rem)" }}
      >
        <div className="pointer-events-auto bg-[#fff8ff] rounded-xl px-4 py-3 flex items-center gap-3 shadow border border-[#a259c3] mx-3">
          <button
            className="bg-[#a259c3] text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-[#7a219e]"
            onClick={() => navigate("/PricingPage")}
          >
            {t("matches.upgradeBar.btn")}
          </button>
          <span className="text-[#a259c3] font-semibold text-sm">
            {t("matches.upgradeBar")}
          </span>
        </div>
      </div>

{/* MATCH MODAL */}
{matchModal && (
  <div
    className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-[2px] flex items-center justify-center"
    onClick={() => setMatchModal(null)}
  >
    <div
      className="relative w-[92%] max-w-sm rounded-[28px] p-0.5 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
      style={{
        background:
          "linear-gradient(135deg, rgba(236,72,153,.9), rgba(168,85,247,.9))",
      }}
    >
      <div className="relative rounded-[26px] bg-[#0b0a12] overflow-hidden">
        {/* soft glow */}
        <div className="absolute -inset-[30%] bg-[radial-gradient(closest-side,rgba(255,255,255,.08),transparent)] pointer-events-none" />

        {/* confetti chips */}
        <div className="absolute top-3 right-3 text-xl animate-[bounce_1.5s_infinite] pointer-events-none">🎉</div>
        <div className="absolute top-6 left-5 text-lg rotate-12 animate-[bounce_1.8s_infinite] pointer-events-none">✨</div>

        {/* header */}
        <div className="text-center pt-6 px-6">
          <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-300 text-3xl font-extrabold tracking-tight drop-shadow">
            {t("matches.modal.title")}
          </h3>
          <p className="mt-2 text-white/80 text-sm">
           {t("matches.modal.desc", { name: matchModal.name })}
          </p>
        </div>

        {/* avatar with gradient ring */}
        <div className="mt-5 mb-2 flex items-center justify-center">
          <div className="p-[3px] rounded-full bg-gradient-to-tr from-pink-500 to-purple-500">
            <img
              src={matchModal.avatar_url}
              alt={matchModal.name}
              className="w-24 h-24 rounded-full object-cover ring-2 ring-[#0b0a12]"
              draggable={false}
            />
          </div>
        </div>

        {/* animated heart */}
        <div className="flex items-center justify-center mb-2">
          <div className="text-pink-400 text-2xl animate-[pulse_1.2s_ease-in-out_infinite]">💖</div>
        </div>

        {/* buttons */}
        <div className="px-5 pb-6 pt-3 flex gap-3">
          <button
            className="flex-1 py-3 rounded-2xl font-extrabold text-[#0b0a12] bg-white shadow hover:brightness-95 active:translate-y-[1px]"
            onClick={() => {
              const id = matchModal.id;
              setMatchModal(null);
              if (id) navigate(`/chat/${id}`);
              else navigate("/Messages");
            }}
          >
            {t("matches.modal.sayhi")}
          </button>
          <button
            className="flex-1 py-3 rounded-2xl font-extrabold text-white bg-gradient-to-r from-pink-500 to-purple-500 shadow hover:opacity-90 active:translate-y-[1px]"
            onClick={() => setMatchModal(null)}
          >
            {t("matches.modal.keep")}
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
