import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiOutlinePencil } from "react-icons/hi2";
import { useOnboarding } from "../../context/OnboardingContext";
import { useI18n } from "../../i18n";

// [!REPLACE THIS ARRAY!]
const OPTION_KEYS = [
  "na",
  "straight",
  "gay",
  "lesbian",
  "bisexual",
];

export default function SexualityPage() {
  const navigate = useNavigate();
  const { setProfileData } = useOnboarding();
  const { t } = useI18n();
  const [sexuality, setSexuality] = useState("");

  const handleNext = () => {
    if (!sexuality) return;
    setProfileData((prev) => ({
      ...prev,
      sexuality, // store displayed label
    }));
    navigate("/onboarding/interested-in");
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative"
      style={{
        background: `url('/images/myanmatch-bg.jpg') center center / cover no-repeat`,
      }}
    >
      <div className="relative bg-white/95 rounded-3xl shadow-2xl max-w-md w-full px-7 py-10 flex flex-col items-center">
        {/* Progress bar and icon */}
        <div className="flex items-center justify-center w-full mb-7">
          <div className="w-7 h-7 rounded-full border-2 border-[#6e2263] flex items-center justify-center bg-white shadow">
            <HiOutlinePencil className="w-5 h-5 text-[#6e2263]" />
          </div>
          <div className="flex-1 h-1 mx-2 rounded-full bg-gradient-to-r from-[#ffc2ee] to-[#82144d]" />
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-[#82144d] text-center mb-2">
          {t("sex.title")}
        </h1>

        {/* Options */}
        <div className="w-full flex flex-col gap-3 mt-4 mb-6">
          {OPTION_KEYS.map((key) => {
            const label = t(`sex.opt.${key}`);
            const selected = sexuality === label;
            return (
              <button
                key={key}
                className={`w-full flex items-center justify-between px-6 py-4 rounded-xl shadow-sm border-2 transition
                  ${
                    selected
                      ? "border-[#a55596] bg-[#fae7f6]/80 text-[#6e2263] font-bold scale-105"
                      : "border-gray-200 bg-gray-50 text-gray-700"
                  }
                `}
                type="button"
                onClick={() => setSexuality(label)}
              >
                <span className="text-lg">{label}</span>
                <span
                  className={`flex items-center justify-center w-6 h-6 rounded-full border-2 ${
                    selected ? "border-[#a55596] bg-[#a55596]" : "border-gray-300 bg-white"
                  }`}
                >
                  {selected && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <circle cx="12" cy="12" r="8" fill="currentColor" />
                    </svg>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Feedback link */}
        <div className="mt-6 text-sm text-center w-full">
          <span className="text-[#6e2263] font-semibold cursor-pointer hover:underline">
            {t("sex.feedback")}
          </span>
        </div>

        {/* Next button */}
        <button
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition duration-200 mt-10 self-end
            ${
              sexuality
                ? "bg-gradient-to-r from-[#a55596] to-[#82144d] text-white hover:scale-105"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }
          `}
          onClick={handleNext}
          disabled={!sexuality}
          aria-label={t("sex.nextAria")}
          style={{ boxShadow: "0 4px 24px 0 rgba(130,20,77,0.13)" }}
          type="button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}