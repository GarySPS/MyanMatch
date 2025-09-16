// src/pages/Onboarding/VoicePromptPage.jsx

import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaMicrophone, FaPen, FaRedo } from "react-icons/fa";
import { useOnboarding } from "../../context/OnboardingContext";
import { supabase } from "../../supabaseClient";
import { useI18n } from "../../i18n";
import { useAuth } from "../../context/AuthContext"; // 1. ADD THIS IMPORT

const VOICE_PROMPT_KEYS = [
  "rant", "favMemory", "lastBigLaugh", "bestAdvice", "hiddenTalent",
  "perfectWeekend", "desertIsland", "superpower", "makesMeSmile", "funFact",
];

// --- (The helper functions like pickMimeType remain the same) ---
function pickMimeType() {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus", "audio/ogg"];
  for (const t of candidates) {
    try { if (window.MediaRecorder?.isTypeSupported?.(t)) return t; } catch {}
  }
  return "";
}

export default function VoicePromptPage() {
  const navigate = useNavigate();
  const { setProfileData } = useOnboarding();
  const { t } = useI18n();
  const { user } = useAuth(); // 2. GET USER FROM THE AUTH CONTEXT

  const [selectedPrompt, setSelectedPrompt] = useState(VOICE_PROMPT_KEYS[0]);
  // ... (all other useState hooks remain the same)
  const [showPromptPicker, setShowPromptPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [duration, setDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const maxDuration = 30;
  const mediaRecorderRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);
  const [level, setLevel] = useState(0);

  // ---- Load existing from DB (Now uses useAuth) ----
  useEffect(() => {
    (async () => {
      const uid = user?.id; // 3. USE THE RELIABLE UID FROM CONTEXT
      if (!uid) { setLoading(false); return; }
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("voicePrompt")
          .eq("user_id", uid)
          .maybeSingle();

        if (!error && data?.voicePrompt) {
          const vp = data.voicePrompt;
          if (vp?.prompt) {
            const maybeKey = VOICE_PROMPT_KEYS.find(k => t(`vp.pool.${k}`) === vp.prompt || k === vp.prompt);
            setSelectedPrompt(maybeKey || VOICE_PROMPT_KEYS[0]);
          }
          if (vp?.url) {
            setAudioURL(vp.url);
            setAudioBlob(null);
            setDuration(vp.duration || 0);
          }
        }
      } catch (e) {
        console.error("Error loading voice prompt:", e);
      } 
      finally {
        setLoading(false);
      }
    })();
  }, [user, t]);

  // ... (All other functions like useEffect cleanup, startMeter, stopMeter, handleRecord, handleDelete remain exactly the same)
  
  useEffect(() => () => stopAll(true), []);

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
        for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
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
      setErrorMsg(t("vp.err.unsupported"));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      const mr = new window.MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data?.size) audioChunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType || "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioURL((prev) => { if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev); return url; });
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
    } catch {
      setErrorMsg(t("vp.err.permission"));
    }
  }

  function handleDelete() {
    stopAll(true);
    if (audioURL && audioURL.startsWith("blob:")) URL.revokeObjectURL(audioURL);
    setAudioURL(null);
    setAudioBlob(null);
    setDuration(0);
  }

  function PromptPickerModal() {
    // ... (This function remains exactly the same, no changes needed)
  }

  const selectedPromptLabel = t(`vp.pool.${selectedPrompt}`);

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative"
      style={{ background: `url('/images/myanmatch-bg.jpg') center/cover no-repeat` }}
    >
      {/* ... (The entire JSX return block remains the same, except for one line) ... */}

      {/* Bottom Buttons */}
      <div className="fixed left-0 right-0 bottom-0 flex items-center justify-between px-5 py-6 pointer-events-none z-40 max-w-md mx-auto w-full">
        <button /* ... skip button ... */ >
          {t("vp.skip")}
        </button>

        <button
          className={`bg-gradient-to-r from-[#ae41bc] to-[#82144d] shadow-2xl w-14 h-14 rounded-full flex items-center justify-center transition-all pointer-events-auto ${audioURL ? "hover:scale-110 active:scale-95" : "opacity-40 pointer-events-none"}`}
          onClick={() => {
            if (!audioURL) return;
            const isBlobUrl = audioURL.startsWith("blob:");
            const file = isBlobUrl && audioBlob
              ? new File([audioBlob], "voice-prompt.webm", { type: audioBlob.type || "audio/webm" })
              : null;

            setProfileData((prev) => ({
              ...prev,
              voicePrompt: file
                    // 4. FIX THIS LINE to save the key, not the translated label
                ? { prompt: selectedPrompt, audioBlob, file, audioURL, duration }
                : { prompt: selectedPrompt, url: audioURL, duration },
            }));
            navigate("/onboarding/finish");
          }}
          disabled={!audioURL}
          aria-label={t("vp.nextAria")}
          type="button"
        >
          <svg width={30} height={30} fill="none" aria-hidden="true">
            <circle cx="15" cy="15" r="15" fill="#fff" fillOpacity="0.13" />
            <path d="M11 15h8M17 11l4 4-4 4" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}