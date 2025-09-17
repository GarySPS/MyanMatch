import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaMicrophone, FaPen, FaRedo } from "react-icons/fa";
import { useOnboarding } from "../../context/OnboardingContext";
import { useI18n } from "../../i18n";
import { useAuth } from "../../context/AuthContext";

const VOICE_PROMPT_KEYS = [
  "rant", "favMemory", "lastBigLaugh", "bestAdvice", "hiddenTalent",
  "perfectWeekend", "desertIsland", "superpower", "makesMeSmile", "funFact",
];

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
  // 1. Get the full 'profile' object from the context.
  const { user, profile } = useAuth(); 

  const [selectedPrompt, setSelectedPrompt] = useState(VOICE_PROMPT_KEYS[0]);
  const [showPromptPicker, setShowPromptPicker] = useState(false);
  
  // 2. The page is no longer responsible for its own loading state.
  // The route guard handles it.
  const [loading, setLoading] = useState(false); 

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

  // 3. [!REPLACED!] This effect no longer fetches data.
  // It simply reads the 'voicePrompt' info from the already-loaded profile.
  useEffect(() => {
    if (profile?.voicePrompt) {
      const vp = profile.voicePrompt;
      if (vp?.prompt) {
        // Find the key for the prompt. It could be the key itself or the translated text.
        const maybeKey = VOICE_PROMPT_KEYS.find(k => t(`vp.pool.${k}`) === vp.prompt || k === vp.prompt);
        setSelectedPrompt(maybeKey || VOICE_PROMPT_KEYS[0]);
      }
      if (vp?.url) {
        setAudioURL(vp.url);
        setAudioBlob(null);
        setDuration(vp.duration || 0);
      }
    }
  }, [profile, t]); // The effect now depends on the `profile` object.

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
    if (!showPromptPicker) return null;
    return (
      <div className="fixed inset-0 z-50 bg-black/25 flex items-center justify-center backdrop-blur-sm">
        <div className="bg-white rounded-2xl w-[95vw] max-w-xs p-5 shadow-xl border-2 border-[#f3d2f7] relative">
          <button
            className="absolute top-2 right-3 text-xl text-gray-400 hover:text-[#a259c3] font-bold"
            onClick={() => setShowPromptPicker(false)}
            aria-label={t("common.ok")}
          >×</button>
          <h2 className="font-bold text-lg text-[#6e2263] mb-2">{t("vp.pickTitle")}</h2>
          <div className="max-h-64 overflow-auto">
            {VOICE_PROMPT_KEYS.map((k) => {
              const label = t(`vp.pool.${k}`);
              return (
                <button
                  key={k}
                  className="w-full text-left py-2 px-2 rounded text-[15px] border-b last:border-b-0 hover:bg-[#f9e6f9] active:bg-[#f2d5f8] text-[#82144d] font-medium transition"
                  onClick={() => { setSelectedPrompt(k); setShowPromptPicker(false); }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const selectedPromptLabel = t(`vp.pool.${selectedPrompt}`);

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative"
      style={{ background: `url('/images/myanmatch-bg.jpg') center/cover no-repeat` }}
    >
      <img src="/images/heart-curve-topleft.png" alt="" className="absolute top-0 left-0 w-16 opacity-25 pointer-events-none select-none z-0" />
      <img src="/images/heart-curve-bottomright.png" alt="" className="absolute bottom-0 right-0 w-20 opacity-30 pointer-events-none select-none z-0" />

      <div className="relative bg-white/95 rounded-3xl shadow-2xl max-w-md w-full px-7 py-10 flex flex-col items-center">
        <div className="flex gap-1 items-center mb-7 w-full">
          <span className="block w-2.5 h-2.5 rounded-full bg-[#ae41bc]" />
          <span className="block w-2.5 h-2.5 rounded-full bg-[#ae41bc]" />
          <span className="block w-2.5 h-2.5 rounded-full bg-[#f0c4e8]" />
          <span className="ml-3 text-xs text-gray-400 font-semibold tracking-wide">{t("vp.step", { cur: 5, total: 6 })}</span>
        </div>

        <div className="flex items-center mb-4 w-full">
          <div className="rounded-full border-2 border-[#a259c3] bg-[#f8e6fb] text-[#a259c3] p-2 mr-2 shadow">
            <FaMicrophone className="text-lg" />
          </div>
          <span className="text-lg font-bold text-[#82144d] logo-hinge tracking-wide">
            {t("vp.title")}
          </span>
        </div>

        <div className="flex items-center justify-between mb-4 bg-white rounded-xl shadow px-4 py-3 border border-[#ecd8f5] w-full">
          <span className="text-[15px] font-medium text-[#6e2263]">{selectedPromptLabel}</span>
          <button className="p-2 text-gray-400 hover:text-[#a259c3] rounded-full" onClick={() => setShowPromptPicker(true)} aria-label={t("common.retry")}>
            <FaPen className="text-sm" aria-hidden="true" />
          </button>
        </div>

        <div className="rounded-2xl border-2 border-dashed border-[#ecd8f5] px-4 py-7 flex flex-col items-center justify-center bg-white/80 relative min-h-[120px] mb-3 w-full">
          <div className="absolute top-4 right-4 text-xs text-gray-400">
            {`${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, "0")} / 0:30`}
          </div>

          {/* 4. [!REMOVED!] The `loading ? (...)` check is no longer needed here. */}
          {audioURL ? (
            <>
              <audio src={audioURL} controls className="w-full mb-2" />
              <div className="flex items-center justify-between w-full">
                <div className="text-[12px] text-gray-500">{t("vp.ready")}</div>
                <button
                  onClick={handleDelete}
                  className="text-xs inline-flex items-center gap-2 px-3 py-2 rounded-full border border-[#ffd9df] text-[#b02a37] hover:bg-[#fff0f2] transition"
                  type="button"
                >
                  <FaRedo /> {t("vp.rerecord")}
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={handleRecord}
              className="flex flex-col items-center focus:outline-none"
              disabled={recording && duration >= maxDuration}
              type="button"
            >
              <div
                className="relative mb-2 p-1 rounded-full"
                style={{
                  background: `conic-gradient(#ae41bc ${Math.min((duration / maxDuration) * 360, 360)}deg,#eee 0deg)`,
                }}
              >
                <div
                  className={`rounded-full p-6 shadow-lg transition-transform ${recording ? "scale-105" : ""}`}
                  style={{
                    background: "linear-gradient(135deg, #a259c3 0%, #82144d 100%)",
                    boxShadow: recording ? `0 0 ${6 + Math.round(level * 16)}px rgba(162,89,195,0.55)` : undefined,
                  }}
                >
                  <FaMicrophone className="text-3xl text-white" />
                </div>
              </div>
              <span className="text-base text-gray-500">
                {recording ? t("vp.tapStop") : t("vp.tapStart")}
              </span>
            </button>
          )}

          {errorMsg && (
            <div className="absolute left-4 right-4 bottom-3 text-[12px] text-red-500 text-center">
              {errorMsg}
            </div>
          )}
        </div>
      </div>

      <PromptPickerModal />

      <div className="fixed left-0 right-0 bottom-0 flex items-center justify-between px-5 py-6 pointer-events-none z-40 max-w-md mx-auto w-full">
        <button
          className="bg-white border-2 border-[#a259c3] text-[#a259c3] font-semibold py-2 px-8 rounded-full shadow hover:bg-[#faf0ff] transition pointer-events-auto"
          onClick={() => {
            setProfileData((prev) => ({ ...prev, voicePrompt: null }));
            navigate("/onboarding/finish");
          }}
          type="button"
        >
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