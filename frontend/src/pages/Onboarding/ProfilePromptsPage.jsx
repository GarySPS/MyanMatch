import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaQuoteLeft } from "react-icons/fa";
import { useOnboarding } from "../../context/OnboardingContext";
import { useI18n } from "../../i18n";

const PROMPT_KEYS = [
  "rant", "keyToHeart", "setupPunchline", "unusualSkills",
  "kindestThing", "nonNegotiable", "changeMyMind",
  "lastHappyTears", "cryInCarSong", "happyPlace",
  "whereIGoMyself", "bffWhyDateMe", "irrationalFear",
  "comfortFood", "mostSpontaneous", "socialCause",
  "factSurprises", "hobbyRecent", "dinnerWithAnyone",
  "knownFor", "wishLanguage", "repeatMovie", "lifeSong",
  "adventurousPlace", "mostUsedApp",
];

// --- MODAL TO CHOOSE PROMPT ---
function PromptModal({ open, onClose, onSelect }) {
  const { t } = useI18n();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-[95vw] max-w-md max-h-[80vh] overflow-y-auto shadow-2xl border-2 border-[#f3d2f7]">
        <div className="flex justify-between items-center px-5 pt-4 pb-3 border-b">
          <h2 className="font-bold text-lg text-[#6e2263]">{t("prompts.modal.title")}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-[#a259c3] text-2xl transition" aria-label={t("common.ok")}>&times;</button>
        </div>
        <div className="px-3 py-2">
          {PROMPT_KEYS.map((k) => {
            const label = t(`prompts.pool.${k}`);
            return (
              <button
                key={k}
                className="w-full text-left py-3 px-2 rounded-lg text-base border-b last:border-b-0 hover:bg-[#f9e6f9] active:bg-[#f2d5f8] text-[#82144d] font-medium transition"
                onClick={() => { onSelect(label); onClose(); }}
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

export default function ProfilePromptsPage() {
  const navigate = useNavigate();
  const { setProfileData } = useOnboarding();
  const { t } = useI18n();

  const [answers, setAnswers] = useState([
    { prompt: "", answer: "" },
    { prompt: "", answer: "" },
    { prompt: "", answer: "" },
  ]);
  const [modalIndex, setModalIndex] = useState(null);

  const isFilled = answers.every(a => a.prompt && a.answer.trim().length > 0);

  function handlePromptSelect(idx, prompt) {
    setAnswers(a => a.map((item, i) => (i === idx ? { ...item, prompt } : item)));
  }
  function handleAnswerChange(idx, val) {
    setAnswers(a => a.map((item, i) => (i === idx ? { ...item, answer: val } : item)));
  }
  function handleNext() {
    if (!isFilled) return;
    setProfileData(prev => ({
      ...prev,
      prompts: answers, // [{prompt, answer}]
    }));
    navigate("/onboarding/voice-prompt");
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-[#fff0fa] via-white to-[#ffe7f5] relative overflow-x-hidden">
      {/* Heart curves */}
      <img src="/images/heart-curve-topleft.png" alt="" className="absolute top-0 left-0 w-20 md:w-28 opacity-30 pointer-events-none select-none z-0" draggable={false} />
      <img src="/images/heart-curve-bottomright.png" alt="" className="absolute bottom-0 right-0 w-24 md:w-36 opacity-40 pointer-events-none select-none z-0" draggable={false} />

      {/* Main content */}
      <div className="flex-1 w-full max-w-md flex flex-col mx-auto items-center justify-start z-10 px-3 pt-9 pb-32">
        {/* Progress bar/dots */}
        <div className="flex gap-1 items-center mb-5 ml-1">
          <span className="block w-2.5 h-2.5 rounded-full bg-[#ae41bc]" />
          <span className="block w-2.5 h-2.5 rounded-full bg-[#ae41bc]" />
          <span className="block w-2.5 h-2.5 rounded-full bg-[#f0c4e8]" />
          <span className="ml-3 text-xs text-gray-400 font-semibold tracking-wide">{t("prompts.step", { cur: 4, total: 6 })}</span>
        </div>

        {/* Title & subtitle */}
        <div className="flex items-center mb-7 z-10">
          <FaQuoteLeft className="text-3xl text-[#ae41bc] mr-3 drop-shadow" />
          <div>
            <span className="text-xl md:text-2xl text-[#82144d] logo-hinge font-bold tracking-wide block">
              {t("prompts.title")}
            </span>
            <span className="block text-sm text-[#ae41bc] font-medium mt-1">
              {t("prompts.subtitle")}
            </span>
          </div>
        </div>

        {/* Prompts cards */}
        <div className="flex flex-col gap-6 w-full z-10">
          {answers.map((item, idx) => (
            <div
              key={idx}
              className="border-2 border-dashed border-[#f0c4e8] rounded-2xl px-5 py-5 bg-white/80 shadow-md hover:shadow-xl transition-all duration-150 group"
            >
              <button
                className="flex items-center text-[#ae41bc] gap-2 mb-2"
                onClick={() => setModalIndex(idx)}
                type="button"
              >
                <span className="font-semibold text-base">
                  {item.prompt ? (
                    <span className="text-[#82144d]">{item.prompt}</span>
                  ) : (
                    <span className="text-gray-400">{t("prompts.selectPrompt")}</span>
                  )}
                </span>
                <FaPlus className={`transition ${item.prompt ? "opacity-40" : ""}`} />
              </button>
              <textarea
                className="w-full bg-transparent outline-none border-none text-base text-[#82144d] placeholder-[#c697c0] resize-none mt-1 font-medium min-h-[36px] max-h-[70px] focus:ring-2 focus:ring-[#ae41bc] rounded-xl px-1 py-1 transition"
                placeholder={item.prompt ? t("prompts.answerPH") : t("prompts.chooseFirstPH")}
                value={item.answer}
                onChange={e => handleAnswerChange(idx, e.target.value)}
                disabled={!item.prompt}
                maxLength={180}
              />
              <div className="flex justify-end mt-1">
                <span className="text-xs text-gray-400">{item.answer.length}/180</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-sm text-gray-400 pl-1 z-10 text-right w-full">{t("prompts.required3")}</div>
      </div>

      {/* NEXT BUTTON */}
      <div className="fixed left-0 right-0 bottom-0 flex items-center justify-end px-7 py-7 pointer-events-none z-40 max-w-md mx-auto w-full">
        <button
          className={`
            bg-gradient-to-r from-[#ae41bc] to-[#82144d] shadow-2xl w-16 h-16 rounded-full flex items-center justify-center transition-all
            pointer-events-auto
            ${isFilled ? "hover:scale-110 active:scale-95" : "opacity-40 pointer-events-none"}
            animate-bounce
          `}
          onClick={handleNext}
          disabled={!isFilled}
          aria-label={t("prompts.nextAria")}
          type="button"
        >
          <svg width={36} height={36} fill="none" aria-hidden="true">
            <circle cx="18" cy="18" r="18" fill="#fff" fillOpacity="0.13" />
            <path
              d="M13 18h10M19 14l4 4-4 4"
              stroke="#fff"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* PROMPT MODAL */}
      <PromptModal
        open={modalIndex !== null}
        onClose={() => setModalIndex(null)}
        onSelect={p => handlePromptSelect(modalIndex, p)}
      />
    </div>
  );
}
