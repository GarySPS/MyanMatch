// src/pages/ChatThread.jsx
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { IoArrowBack, IoAttach, IoMic, IoSend, IoTrash } from "react-icons/io5";
import { FaGift } from "react-icons/fa";

function GiftToast({ message, onClose }) {
  if (!message) return null;
  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[70]
                 bottom-[calc(env(safe-area-inset-bottom)+96px)]"
      role="status"
      aria-live="polite"
    >
      <div
        className="flex items-center gap-3 px-4 py-3
                   rounded-2xl shadow-2xl
                   bg-gradient-to-tr from-pink-500 to-[#a259c3]
                   text-white font-semibold
                   ring-1 ring-white/20
                   animate-[fadeInUp_180ms_ease-out]"
        style={{
          // simple keyframe fallback if Tailwind animation utilities aren’t enabled
          animation: "fadeInUp 180ms ease-out",
        }}
      >
        <FaGift size={18} />
        <span>{message}</span>
        <button
          className="ml-1 rounded-full bg-white/20 hover:bg-white/30 px-2 py-1 text-xs"
          onClick={onClose}
          aria-label="Close"
        >
          Close
        </button>
      </div>
<style>{`
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`}</style>
    </div>
  );
}

const FILE_BUCKET = "chat-files";
const VOICE_BUCKET = "chat-voice";
const MAX_BYTES = 10 * 1024 * 1024; // adjust if you want

function VerifiedBadge({ className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold 
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

/* ---------- Gift modal (same logic as Explore/Matches) ---------- */
function GiftSendModal({ open, onClose, senderId, receiverId, receiverName, onSent, presetComment = "" }) {
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
      const { data, error } = await supabase
        .from("user_gifts")
        .select("*")
        .eq("user_id", senderId);
      setInventory(error ? [] : (data || []));
      setLoading(false);
    })();
  }, [open, senderId, presetComment]);

  async function handleSend() {
    if (!selectedGift || loading) return;
    setLoading(true);
    try {
      // remove from sender
      const { error: delErr } = await supabase
        .from("user_gifts")
        .delete()
        .eq("id", selectedGift.id)
        .eq("user_id", senderId);
      if (delErr) throw delErr;

      // add to receiver
      const insertRow = {
        user_id: receiverId,
        gift_id: selectedGift.gift_id,
        name: selectedGift.name,
        image_url: selectedGift.image_url,
        purchase_price: selectedGift.purchase_price,
      };
      const { error: insErr } = await supabase.from("user_gifts").insert([insertRow]);
      if (insErr) throw insErr;

      // visible on receiver's Likes page (gift + comment)
      const { error: likeErr } = await supabase.from("likes").insert([{
        from_user_id: senderId,
        to_user_id: receiverId,
        type: "gift",
        comment: comment || null,
        is_visible: true,
        created_at: new Date().toISOString(),
      }]);
      if (likeErr) throw likeErr;

      onSent?.({ receiverName });
      onClose?.();
    } catch (e) {
      console.error("Send gift failed:", e);
      alert("Could not send gift. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center">
      <div className="w-[92%] max-w-md bg-white rounded-3xl shadow-2xl p-5">
        <div className="text-xl font-extrabold mb-3">Send a Gift</div>

        <div className="max-h-64 overflow-auto rounded-xl border border-gray-100 p-2 mb-4">
          {loading && <div className="p-4 text-gray-500 text-center">Loading your gifts…</div>}
          {!loading && inventory.length === 0 && (
            <div className="p-4 text-gray-500 text-center">You don’t have any gifts. Go to Market to buy.</div>
          )}
          {!loading && inventory.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {inventory.map((g) => {
                const active = selectedGift?.id === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGift(g)}
                    className={`rounded-2xl border p-2 flex flex-col items-center gap-2 transition ${active ? "border-purple-500 ring-2 ring-purple-200" : "border-gray-200 hover:border-gray-300"}`}
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
  placeholder="Add a comment (optional)"
  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 mb-4
             text-[#111] caret-[#111] placeholder-gray-500
             outline-none focus:ring-2 focus:ring-purple-300"
  value={comment}
  onChange={(e) => setComment(e.target.value)}
/>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-gray-300 text-gray-700 font-semibold" disabled={loading}>
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!selectedGift || loading}
            className="flex-1 h-11 rounded-xl bg-gradient-to-tr from-pink-500 to-[#a259c3] text-white font-bold disabled:opacity-60"
          >
            {loading ? "Sending…" : "Send Gift"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ----- avatar resolver (public storage) ----- */
function _pickFirst(arr) { return Array.isArray(arr) && arr.length ? arr[0] : null; }
function _firstFromMedia(media) {
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
  if (profile?.avatar_path) return publicUrl(profile.avatar_path);
  if (typeof profile?.avatar_url === "string" && /^https?:\/\//i.test(profile.avatar_url)) return profile.avatar_url;
  return publicUrl(_firstFromMedia(profile?.media));
}
function UnmatchConfirmModal({ open, onClose, onConfirm, name = "this user", busy = false }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="w-full sm:w-[92%] max-w-sm mx-auto rounded-t-3xl sm:rounded-3xl p-0.5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          background:
            "linear-gradient(135deg, rgba(236,72,153,.9), rgba(168,85,247,.9))",
        }}
      >
        <div className="rounded-t-3xl sm:rounded-3xl bg-[#0b0a12] overflow-hidden">
          <div className="relative px-5 pt-6 pb-4 text-center">
            {/* glow */}
            <div className="pointer-events-none absolute -inset-[30%] bg-[radial-gradient(closest-side,rgba(255,255,255,.06),transparent)]" />
            <h3 className="relative text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-300">
              Unmatch {name}?
            </h3>
            <p className="relative mt-2 text-white/80 text-[15px]">
              This will remove the match and <span className="font-semibold text-white">delete your chat history</span>.
            </p>
          </div>

          <div className="px-5 pb-4 text-left text-white/70 text-sm">
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-white/80 mt-0.5">⚠️</span>
                <span>Action cannot be undone.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-white/80 mt-0.5">💬</span>
                <span>All messages between you will be removed.</span>
              </li>
            </ul>
          </div>

          <div className="px-5 pb-5 flex gap-3">
            <button
              className="flex-1 h-12 rounded-2xl bg-white text-[#0b0a12] font-extrabold shadow active:translate-y-[1px]"
              onClick={onClose}
              disabled={busy}
            >
              Keep Match
            </button>
            <button
              className="flex-1 h-12 rounded-2xl font-extrabold text-white bg-gradient-to-r from-pink-500 to-purple-500 shadow active:translate-y-[1px] disabled:opacity-60"
              onClick={onConfirm}
              disabled={busy}
            >
              {busy ? "Removing…" : "Unmatch"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Chat Thread ---------- */
export default function ChatThread() {
  const { userId: otherUserId } = useParams();
  const navigate = useNavigate();
  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const otherNameRef = useRef("");
    useEffect(() => { otherNameRef.current = otherUser?.first_name || ""; }, [otherUser]);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [giftToast, setGiftToast] = useState(""); // empty = hidden
  const showGiftToast = (msg) => {
   setGiftToast(msg);
   window.clearTimeout(showGiftToast._t);
   showGiftToast._t = window.setTimeout(() => setGiftToast(""), 3500);
};


  // gift modal state
  const [giftOpen, setGiftOpen] = useState(false);

// unmatch state
const [busyUnmatch, setBusyUnmatch] = useState(false);
const [unmatchOpen, setUnmatchOpen] = useState(false);

  const local = JSON.parse(localStorage.getItem("myanmatch_user") || "{}");
  const myId = local.user_id || local.id;

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    if (!myId || !otherUserId) return;

    (async () => {

      // profile
// profile
const { data: prof, error: profErr } = await supabase
  .from("profiles")
  .select("*")            // don't list columns that might not exist
  .eq("user_id", otherUserId)
  .single();

if (profErr) {
  console.error("profiles fetch error:", profErr);
}

if (prof) {
  const isVerified = Boolean(prof.kyc_verified) || Boolean(prof.verified) || Boolean(prof.is_verified);
  setOtherUser({
    ...prof,
    verified: isVerified,
    avatar_url: resolveAvatar(prof), // real public URL
  });
}
      // initial messages
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(match_a.eq.${myId},match_b.eq.${otherUserId}),and(match_a.eq.${otherUserId},match_b.eq.${myId})`
        )
        .order("created_at", { ascending: true });

      setMessages(msgs || []);
      scrollToBottom();
    })();

    // realtime: gift 'likes' -> toast on receiver side
const likesChannel = supabase
  .channel(`likes-gifts-${myId}-${otherUserId}`)
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "likes" },
    (payload) => {
      const r = payload.new;
      // show only if *this* other user sent a gift to *me*
      if (
        r?.type === "gift" &&
        String(r.to_user_id) === String(myId) &&
        String(r.from_user_id) === String(otherUserId)
      ) {
        showGiftToast(`${otherNameRef.current || "Someone"} sent you a gift 🎁`);
      }
    }
  )
  .subscribe();

    // realtime
    const channel = supabase
      .channel(`messages-${myId}-${otherUserId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const m = payload.new;
          const mineA = m.match_a === myId && m.match_b === otherUserId;
          const mineB = m.match_a === otherUserId && m.match_b === myId;
          if (!mineA && !mineB) return;
          if (m.sender_id === myId) return;

          setMessages((prev) => {
            const exists = prev.some(
              (x) =>
                (x.id && m.id && x.id === m.id) ||
                (x.sender_id === m.sender_id &&
                  x.created_at === m.created_at &&
                  (x.content || "") === (m.content || "") &&
                  (x.media_url || "") === (m.media_url || ""))
            );
            return exists ? prev : [...prev, m];
          });
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(likesChannel);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (showGiftToast._t) clearTimeout(showGiftToast._t);
    };
  }, [myId, otherUserId]);

/* ----------------------- Unmatch ----------------------- */
const doUnmatch = async () => {
  if (busyUnmatch) return;
  setBusyUnmatch(true);
  try {
     // Soft-delete both sides' likes so they no longer count as a match
   await supabase
     .from("likes")
     .update({ is_visible: false })
     .or(
       `and(from_user_id.eq.${myId},to_user_id.eq.${otherUserId}),and(from_user_id.eq.${otherUserId},to_user_id.eq.${myId})`
     );
    await supabase
      .from("messages")
      .delete()
      .or(
        `and(match_a.eq.${myId},match_b.eq.${otherUserId}),and(match_a.eq.${otherUserId},match_b.eq.${myId})`
      );

    await supabase
      .from("matches")
      .delete()
      .or(
        `and(match_a.eq.${myId},match_b.eq.${otherUserId}),and(match_a.eq.${otherUserId},match_b.eq.${myId})`
      );

    try {
      await supabase
        .from("matches")
        .delete()
        .or(
          `and(user_a.eq.${myId},user_b.eq.${otherUserId}),and(user_a.eq.${otherUserId},user_b.eq.${myId})`
        );
    } catch {}

   // Go back to list and let it refetch
   navigate(-1);
  } catch (e) {
    console.error("Unmatch failed:", e);
    alert("Could not unmatch. Please try again.");
  } finally {
    setBusyUnmatch(false);
  }
};

  /* ----------------------- Send helpers ----------------------- */
  const insertMessage = async (payload) => {
    setMessages((prev) => [...prev, payload]);
    const { error } = await supabase.from("messages").insert([payload]);
    if (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => prev.filter((m) => m !== payload));
      throw error;
    }
  };

  const handleSendText = async () => {
    const text = message.trim();
    if (!text) return;

    const newMsg = {
      match_a: myId,
      match_b: otherUserId,
      sender_id: myId,
      type: "text",
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessage("");
    try {
      await insertMessage(newMsg);
    } catch {
      setMessage(text);
    }
  };

  const onPickFile = () => fileInputRef.current?.click();

  const handleFileChosen = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > MAX_BYTES) {
      alert(`File must be ${(MAX_BYTES/1024/1024)|0}MB or smaller.`);
      return;
    }

    const ext = file.name.split(".").pop() || "bin";
    const key = `${myId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from(FILE_BUCKET)
      .upload(key, file, { contentType: file.type || "application/octet-stream" });
    if (upErr) {
      console.error("storage upload error", upErr);
      alert(upErr.message || "Upload failed.");
      return;
    }
    const { data: pub } = supabase.storage.from(FILE_BUCKET).getPublicUrl(key);
    const mediaUrl = pub?.publicUrl;

    const isImage = (file.type || "").startsWith("image/");

    const newMsg = {
      match_a: myId,
      match_b: otherUserId,
      sender_id: myId,
      type: "file",
      media_url: mediaUrl,
      media_mime: file.type,
      media_size: file.size,
      content: isImage ? null : file.name, // no filename for images
      created_at: new Date().toISOString(),
    };

    try {
      await insertMessage(newMsg);
    } catch {
      alert("Failed to send file.");
    } finally {
      scrollToBottom();
    }
  };

  const toggleRecord = async () => {
    if (isRecording) {
      try { mediaRecorderRef.current?.stop(); } catch {}
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mr.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        if (blob.size > MAX_BYTES) {
          alert(`Voice message must be ${(MAX_BYTES/1024/1024)|0}MB or smaller.`);
          return;
        }

        const key = `${myId}/${Date.now()}-${Math.random().toString(36).slice(2)}.webm`;
        const { error: upErr } = await supabase.storage
          .from(VOICE_BUCKET)
          .upload(key, blob, { contentType: blob.type || "audio/webm" });
        if (upErr) {
          console.error(upErr);
          alert("Voice upload failed.");
          return;
        }
        const { data: pub } = supabase.storage.from(VOICE_BUCKET).getPublicUrl(key);
        const mediaUrl = pub?.publicUrl;

        const newMsg = {
          match_a: myId,
          match_b: otherUserId,
          sender_id: myId,
          type: "voice",
          media_url: mediaUrl,
          media_mime: blob.type,
          media_size: blob.size,
          content: null,
          created_at: new Date().toISOString(),
        };
        try {
          await insertMessage(newMsg);
          scrollToBottom();
        } catch {
          alert("Failed to send voice message.");
        }
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      alert("Microphone permission needed to record.");
      setIsRecording(false);
    }
  };

  /* ----------------------- Render helpers ----------------------- */
  const renderBubble = (m) => {
    const mine = m.sender_id === myId;

    const base = "rounded-2xl max-w-[78%] leading-relaxed shadow-sm";
    const mineCls = "bg-[#E6FF6A] text-black rounded-br-md";
    const otherCls = "bg-white/10 text-white border border-white/10 rounded-bl-md";

    if (m.type === "file") {
      const isImage = (m.media_mime || "").startsWith("image/");
      if (isImage) {
        return (
          <a href={m.media_url} target="_blank" rel="noreferrer" className="block overflow-hidden" title="Open image">
            <img
              src={m.media_url}
              alt="photo"
              className={`${mine ? "rounded-br-md" : "rounded-bl-md"} rounded-2xl max-w-[78vw] max-h-[60vh] object-cover border border-white/10`}
            />
          </a>
        );
      }
      return (
        <div className={`${base} ${mine ? mineCls : otherCls} px-4 py-2 break-words`}>
          <a className="underline break-all" href={m.media_url} target="_blank" rel="noreferrer">
            {m.content || "Download file"}
          </a>
        </div>
      );
    }

    if (m.type === "voice") {
      return (
        <div className={`${base} ${mine ? mineCls : otherCls} px-4 py-2`}>
          <audio src={m.media_url} controls className="w-56" />
        </div>
      );
    }

    return (
      <div className={`${base} ${mine ? mineCls : otherCls} px-4 py-2 break-words`}>
        {m.content}
      </div>
    );
  };

  return (
   <div className="relative min-h-screen w-full text-white overflow-hidden">
      {/* FULL-PAGE BACKGROUND (overrides Layout) */}
      <div className="fixed inset-0 z-[1] pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#201033] via-[#120f1f] to-[#0a0a12]" />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute -top-28 -left-24 w-[22rem] h-[22rem] rounded-full bg-pink-500/25 blur-[110px]" />
        <div className="absolute -bottom-28 -right-24 w-[22rem] h-[22rem] rounded-full bg-purple-500/25 blur-[110px]" />
      </div>

      {/* PAGE CONTENT */}
      <div className="relative z-[2] flex flex-col min-h-screen">

{/* Header (FIXED TOP) */}
<div className="fixed top-0 left-1/2 -translate-x-1/2 z-[60] w-full max-w-[480px] px-3 py-2 border-b border-white/10 bg-white/5 backdrop-blur supports-[backdrop-filter]:bg-white/10">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3 min-w-0">
      <button
        onClick={() => navigate(-1)}
        className="text-white/90 p-1 -ml-1"
        aria-label="Back"
      >
        <IoArrowBack size={22} />
      </button>

      {otherUser && (
        <button
          type="button"
          onClick={() => navigate(`/profile/${otherUserId}`)}
          className="flex items-center gap-2 min-w-0 group"
          aria-label="Open profile"
        >
<span className="font-semibold text-base truncate group-hover:underline">
  {otherUser.first_name}
</span>
{otherUser.verified && <VerifiedBadge className="ml-2 scale-90" />}
        </button>
      )}
    </div>

    <div className="flex items-center gap-2">
      <button
        onClick={() => setGiftOpen(true)}
        className="px-3 py-2.5 rounded-full bg-[#FFD84D] text-black font-bold hover:opacity-90 active:scale-95 inline-flex items-center gap-2"
        aria-label="Send gift"
        title="Send gift"
      >
        <FaGift size={16} />
        <span className="text-sm">Send Gift</span>
      </button>

<button
  onClick={() => setUnmatchOpen(true)}
  disabled={busyUnmatch}
        className="px-3 py-2.5 rounded-full border border-white/30 text-white/90 hover:bg-white/10 inline-flex items-center gap-2 disabled:opacity-60"
        aria-label="Unmatch"
        title="Unmatch"
      >
        <IoTrash size={16} />
        <span className="text-sm">{busyUnmatch ? "Removing…" : "Unmatch"}</span>
      </button>
    </div>
  </div>
</div>

{/* spacer for fixed header height */}
<div className="h-[56px]" />

{/* Matched banner (COMPACT / CENTERED) */}
{otherUser && (
  <div className="px-4 pt-5 pb-4">
    <div className="mx-auto max-w-[460px] rounded-3xl bg-white/5 border border-white/10 px-5 py-5 text-center shadow-lg">
      <button
        type="button"
        onClick={() => navigate(`/profile/${otherUserId}`)}
        className="mx-auto block w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden ring-4 ring-white/60 shadow focus:outline-none focus:ring-[#FFD84D]"
        aria-label="Open profile"
      >
{otherUser.avatar_url ? (
  <img
    src={otherUser.avatar_url}
    alt={otherUser.first_name}
    className="w-full h-full object-cover"
    draggable={false}
    loading="lazy"
  />
) : (
  <div className="w-full h-full bg-gradient-to-br from-[#2a1938] via-[#1a1324] to-[#0b0a12]" />
)}

      </button>

      <button
        type="button"
        onClick={() => navigate(`/profile/${otherUserId}`)}
        className="mt-3 text-xl md:text-2xl font-extrabold leading-tight hover:underline focus:underline"
        aria-label="Open profile"
      >
        <span className="inline-flex items-center gap-2">
  You matched with {otherUser.first_name}!
  {otherUser.verified && <VerifiedBadge />}
</span>
      </button>

      <div className="mt-2 text-[11px] tracking-[0.22em] text-white/70">LOOKING FOR</div>
      <div className="mt-2 inline-flex items-center justify-center rounded-full px-4 py-1 bg-white text-[#120f1f] font-semibold text-sm">
        Friends
      </div>
    </div>
  </div>
)}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+110px)] space-y-2">
          {messages.map((m) => {
            const key = m.id ?? `${m.sender_id}-${m.created_at}-${m.type}-${m.content || m.media_url}`;
            const mine = m.sender_id === myId;
            return (
              <div key={key} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                {renderBubble(m)}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Composer */}
<form
  onSubmit={(e) => { e.preventDefault(); if (message.trim()) handleSendText(); }}
  className="fixed bottom-[calc(env(safe-area-inset-bottom)+14px)] left-1/2 -translate-x-1/2 w-full max-w-[480px] px-3 pt-2 pb-2 bg-white/5 backdrop-blur border-t border-white/10"
>
          <div className="flex items-center gap-2">
            {/* Attach + Mic when no text */}
            {message.trim().length === 0 && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChosen}
                  accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 rounded-full bg-white/10 hover:bg-white/15"
                  aria-label="Attach file"
                  title={`Attach (≤ ${(MAX_BYTES/1024/1024)|0}MB)`}
                >
                  <IoAttach size={22} />
                </button>
                <button
                  type="button"
                  onClick={toggleRecord}
                  className={`p-3 rounded-full ${isRecording ? "bg-[#FFD84D] text-black animate-pulse" : "bg-white/10 hover:bg-white/15"}`}
                  aria-label="Record voice"
                  title={isRecording ? "Stop recording" : "Record voice"}
                >
                  <IoMic size={22} />
                </button>
              </>
            )}

            <input
              type="text"
              className="flex-1 rounded-full px-4 py-3 bg-white/10 border border-white/15 text-white placeholder-white/60 text-sm outline-none"
              placeholder={isRecording ? "Recording… tap mic to stop" : "Type a message…"}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isRecording}
            />

            {message.trim().length > 0 ? (
              <button
                type="submit"
                className="p-3 rounded-full bg-[#FFD84D] text-black active:scale-95 transition"
                aria-label="Send"
                title="Send"
              >
                <IoSend size={22} />
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <UnmatchConfirmModal
  open={unmatchOpen}
  onClose={() => setUnmatchOpen(false)}
  onConfirm={async () => {
    await doUnmatch();
    setUnmatchOpen(false);
  }}
  name={otherUser?.first_name}
/>

      {/* Inline Gift Modal */}
      <GiftSendModal
        open={giftOpen}
        onClose={() => setGiftOpen(false)}
        senderId={myId}
        receiverId={otherUserId}
   receiverName={otherUser?.first_name}
   onSent={({ receiverName }) => {
     showGiftToast(`You sent a gift to ${receiverName || "this user"} 🎁`);
     setGiftOpen(false);
   }}
      />

      <GiftToast message={giftToast} onClose={() => setGiftToast("")} />

    </div>
  );
}
