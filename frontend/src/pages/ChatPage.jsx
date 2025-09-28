// src/pages/ChatPage.jsx
import { useEffect, useState, useMemo } from "react";
import { supabase } from "../supabaseClient";
import { FaBolt, FaSearch } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useI18n } from "../i18n";
import { useAuth } from "../context/AuthContext";

/* ---------- utils ---------- */
function VerifiedBadge({ className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold
                  bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/30 ${className}`}
      title="Verified profile"
    >
      <svg viewBox="0 0 24 24" width="12" height="12" className="fill-sky-400">
        <path d="M12 2l2.39 2.39 3.38-.49-.49 3.38L20 10l-2.72 1.72.49 3.38-3.38-.49L12 17l-2.39-2.39-3.38.49.49-3.38L4 10l2.72-1.72-.49-3.38 3.38.49L12 2zm-1.2 12.6l5-5-1.4-1.4-3.6 3.6-1.6-1.6-1.4 1.4 3 3z"/>
      </svg>
      Verified
    </span>
  );
}

// normalize possible JSON-string columns into arrays
function coerceArray(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === "string" && v.startsWith("[")) {
    try {
      const a = JSON.parse(v);
      return Array.isArray(a) ? a : [];
    } catch {
      return [];
    }
  }
  return v ? [v] : [];
}

function isHttp(u) {
  return typeof u === "string" && /^https?:\/\//i.test(u);
}

function fmtDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ----- avatar resolver (public storage) ----- */
function _pickFirst(arr) {
  return Array.isArray(arr) && arr.length ? arr[0] : null;
}
function _parseFirstMedia(media) {
  if (Array.isArray(media)) return _pickFirst(media);
  if (typeof media === "string" && media.startsWith("[")) {
    try { const a = JSON.parse(media); return _pickFirst(a); } catch { return null; }
  }
  return typeof media === "string" ? media : null;
}
function publicUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path; // already URL
  const clean = path.replace(/^media\//, ""); // tolerate stored-with-bucket
  const { data } = supabase.storage.from("media").getPublicUrl(clean);
  return data?.publicUrl || null;
}
function resolveAvatar(profile) {
  // prefer explicit avatar_path / avatar_url
  if (profile?.avatar_path) return publicUrl(profile.avatar_path);
  if (typeof profile?.avatar_url === "string" && /^https?:\/\//i.test(profile.avatar_url)) {
    return profile.avatar_url;
  }
  // fallback to first media item
  return publicUrl(_parseFirstMedia(profile?.media));
}

export default function ChatPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { profile } = useAuth();
  const myId = profile?.user_id;
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim()) return matches;
    const t = q.toLowerCase();
    return matches.filter((m) => (m.name || "").toLowerCase().includes(t));
  }, [q, matches]);

  useEffect(() => {
    let alive = true;

    async function fetchMatches() {
      setLoading(true);

      if (!myId) {
        if (alive) {
          setMatches([]);
          setLoading(false);
        }
        return;
      }

      // who I liked
const { data: outgoingLikes, error: outErr } = await supabase
  .from("likes")
  .select("to_user_id, created_at")
  .eq("from_user_id", myId)
  .eq("is_visible", true);

      if (outErr || !outgoingLikes?.length) {
        if (alive) {
          setMatches([]);
          setLoading(false);
        }
        return;
      }

      const toUserIds = [
        ...new Set(outgoingLikes.map((l) => l.to_user_id).filter(Boolean)),
      ];
      if (!toUserIds.length) {
        if (alive) {
          setMatches([]);
          setLoading(false);
        }
        return;
      }

      // who liked me back (mutual)
const { data: incomingLikes, error: inErr } = await supabase
  .from("likes")
  .select("from_user_id")
  .in("from_user_id", toUserIds)
  .eq("to_user_id", myId)
  .eq("is_visible", true);

      if (inErr || !incomingLikes?.length) {
        if (alive) {
          setMatches([]);
          setLoading(false);
        }
        return;
      }

      const matchIds = [
        ...new Set(incomingLikes.map((l) => l.from_user_id).filter(Boolean)),
      ];
      if (!matchIds.length) {
        if (alive) {
          setMatches([]);
          setLoading(false);
        }
        return;
      }

      // pull profiles
      const { data: profs, error: pErr } = await supabase
        .from("profiles")
        .select("user_id, first_name, media, avatar_url, avatar_path, is_verified")
        .in("user_id", matchIds);

      if (pErr || !profs?.length) {
        if (alive) {
          setMatches([]);
          setLoading(false);
        }
        return;
      }

// build rows with real first photo (public URL)
const rows = (profs || []).map((p) => {
  const avatar = resolveAvatar(p);
  const sentLike = outgoingLikes.find((l) => l.to_user_id === p.user_id);
  return {
    user_id: p.user_id,
    name: p.first_name || "Unknown",
    avatar_url: avatar, // may be null if user truly has no media
    matchedAt: sentLike?.created_at || null,
    verified: !!p.is_verified,
  };
});

      // newest first
      rows.sort((a, b) => {
        const ta = a.matchedAt ? new Date(a.matchedAt).getTime() : 0;
        const tb = b.matchedAt ? new Date(b.matchedAt).getTime() : 0;
        return tb - ta;
      });

      if (alive) {
        setMatches(rows);
        setLoading(false);
      }
    }

    fetchMatches();
    return () => {
      alive = false;
    };
  }, [myId]);

  /* ---------- loading skeleton ---------- */
  if (loading) {
    return (
      <div className="relative min-h-[calc(100vh-80px)] w-full text-white overflow-hidden">
        <div className="fixed inset-0 z-[1] pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-[#201033] via-[#120f1f] to-[#0a0a12]" />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute -top-28 -left-24 w-[22rem] h-[22rem] rounded-full bg-pink-500/25 blur-[110px]" />
          <div className="absolute -bottom-28 -right-24 w-[22rem] h-[22rem] rounded-full bg-purple-500/25 blur-[110px]" />
        </div>

        <div className="relative z-[2] p-4 pt-6">
          <div className="flex items-center justify-between mb-4">
            <span className="px-4 py-1.5 rounded-2xl bg-white/10 border border-white/15 font-semibold">
              Messages
            </span>
            <button
              className="px-4 py-2 rounded-xl bg-white text-[#111117] font-bold shadow border border-white"
              onClick={() => navigate("/BoostPage")}
            >
              <FaBolt className="inline-block mr-2" />
              Boost
            </button>
          </div>

          <div className="rounded-3xl px-4 py-3 bg-white/10 border border-white/15 mb-5 animate-pulse" />

          <div className="mb-4">
 <div className="font-bold text-white/90 uppercase text-xs mb-2 pl-1">
   {t("chat.newMatches")}
 </div>
            <div className="flex gap-3 overflow-x-auto pl-1 pb-1">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col items-center animate-pulse">
                  <div className="w-14 h-14 rounded-full bg-white/10 border border-white/15" />
                  <div className="mt-1 h-3 w-12 rounded bg-white/10" />
                </div>
              ))}
            </div>
          </div>

          <div>
 <div className="font-bold text-white/90 uppercase text-xs mb-2 pl-1">
   {t("chat.recent", { heart: "❤️" })}
 </div>
            <ul className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <li
                  key={i}
                  className="flex items-center p-3 bg-white/5 rounded-2xl border border-white/10"
                >
                  <div className="w-12 h-12 rounded-full mr-3 bg-white/10" />
                  <div className="flex-1">
                    <div className="h-4 w-28 bg-white/10 rounded mb-2" />
                    <div className="h-3 w-40 bg-white/10 rounded" />
                  </div>
                  <div className="w-14 h-7 bg-white rounded-full ml-2" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- empty ---------- */
  if (!matches.length) {
    return (
      <div className="relative min-h-[calc(100vh-80px)] w-full text-white overflow-hidden">
        <div className="fixed inset-0 z-[1] pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-[#201033] via-[#120f1f] to-[#0a0a12]" />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute -top-28 -left-24 w-[22rem] h-[22rem] rounded-full bg-pink-500/25 blur-[110px]" />
          <div className="absolute -bottom-28 -right-24 w-[22rem] h-[22rem] rounded-full bg-purple-500/25 blur-[110px]" />
        </div>

        <div className="relative z-[2] flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-white/10 border border-white/15 mb-4">
            <span className="font-semibold">Matches</span>
          </div>
          <div className="text-2xl font-extrabold mb-2">
            You're new here! No matches yet.
          </div>
          <div className="text-white/85 text-base mb-7 max-w-xs">
            When a Like turns into a connection, you can chat here.
          </div>
          <button
            className="bg-white text-[#111117] text-lg font-bold px-8 py-4 rounded-2xl shadow"
            onClick={() => navigate("/BoostPage")}
          >
            <FaBolt className="inline-block mr-2" />
            Try boosting your profile
          </button>
        </div>
      </div>
    );
  }

  /* ---------- content ---------- */
  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full text-white overflow-hidden">
      {/* FULL-PAGE BACKGROUND */}
      <div className="fixed inset-0 z-[1] pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#201033] via-[#120f1f] to-[#0a0a12]" />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute -top-28 -left-24 w-[22rem] h-[22rem] rounded-full bg-pink-500/25 blur-[110px]" />
        <div className="absolute -bottom-28 -right-24 w-[22rem] h-[22rem] rounded-full bg-purple-500/25 blur-[110px]" />
      </div>

      <div className="relative z-[2] px-4 pt-6 pb-24">

         {/* header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Messages
        </h1>
      </div>

        {/* search */}
      <div className="w-full mb-6 relative">
        <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-white/50 z-10" />
        <input
          className="w-full rounded-2xl pl-12 pr-4 py-3 bg-white/5 border border-white/10 text-white placeholder-white/50 backdrop-blur-sm
                     outline-none transition-all duration-300 focus:bg-white/10 focus:ring-2 focus:ring-purple-500/50"
          placeholder="Search Matches"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

        {/* new matches row */}
      <div className="mb-6">
        <div className="font-bold text-white/90 uppercase tracking-wider text-xs mb-3 px-1">
          {t("chat.newMatches")}
        </div>
        {/* Added a 'no-scrollbar' class for cleaner look - you'd add this to your global CSS */}
        <div className="flex gap-4 overflow-x-auto px-1 pb-2 no-scrollbar">
          {filtered.map((m) => (
            <Link
              key={m.user_id}
              to={`/chat/${m.user_id}`}
              className="flex flex-col items-center flex-shrink-0 group"
            >
              <div className="relative">
                {m.avatar_url ? (
                  <img
                    src={m.avatar_url}
                    alt={m.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-pink-500/50 group-hover:border-pink-400 transition-colors"
                    draggable={false}
                    loading="lazy"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2a1938] via-[#1a1324] to-[#0b0a12] border-2 border-pink-500/50" />
                )}
                {m.verified && (
                  <div className="absolute -bottom-1 -right-1 bg-sky-400 rounded-full p-1 border-2 border-[#120f1f]">
                    <svg viewBox="0 0 16 16" width="10" height="10" className="fill-white"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg>
                  </div>
                )}
              </div>
              <div className="mt-2 text-white/80 group-hover:text-white transition-colors text-xs font-semibold truncate w-20 text-center">
                {m.name}
              </div>
            </Link>
          ))}
        </div>
      </div>

        {/* most recent list */}
      <div>
        <div className="font-bold text-white/90 uppercase tracking-wider text-xs mb-3 px-1">
          {t("chat.recent", { heart: "❤️" })}
        </div>
        <ul className="space-y-3">
          {filtered.map((m) => (
            <li key={m.user_id}>
              <Link
                to={`/chat/${m.user_id}`}
                className="flex items-center p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10
                           transition-all duration-300 group"
              >
                {m.avatar_url ? (
                  <img
                    src={m.avatar_url}
                    alt={m.name}
                    className="w-14 h-14 rounded-full mr-4 object-cover"
                    draggable={false}
                    loading="lazy"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full mr-4 bg-gradient-to-br from-[#2a1938] via-[#1a1324] to-[#0b0a12]" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold text-lg truncate flex items-center gap-2">
                    <span className="truncate">{m.name}</span>
                    {m.verified && <VerifiedBadge />}
                  </div>
                  <div className="text-white/70 text-sm truncate">
                    {m.matchedAt
                      ? `Matched • ${fmtDateTime(m.matchedAt)}`
                      : "A new connection awaits ✨"}
                  </div>
                </div>
                <div className="ml-4 px-5 py-2 rounded-full text-white font-bold text-sm
                              bg-gradient-to-tr from-pink-500 to-[#a259c3]
                              shadow-lg shadow-pink-500/20 group-hover:scale-105 transition-transform">
                  Chat
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      </div>
    </div>
  );
}
