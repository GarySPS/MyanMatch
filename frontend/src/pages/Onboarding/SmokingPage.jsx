// src/pages/Onboarding/SmokingPage.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icons } from "../../components/IconLibrary";
import { useOnboarding } from "../../context/OnboardingContext";
import { useI18n } from "../../i18n";

// 1. UPDATE OPTIONS to include a canonical value to save
const OPTIONS = [
    { key: "smoke.opt.yes",       value: "Yes" },
    { key: "smoke.opt.sometimes", value: "Sometimes" },
    { key: "smoke.opt.no",        value: "No" },
    { key: "smoke.opt.na",        value: "Prefer not to say" },
];

export default function SmokingPage() {
    const navigate = useNavigate();
    const { setProfileData } = useOnboarding();
    const { t } = useI18n();

    // This will now store the canonical value, e.g., "Yes"
    const [value, setValue] = useState("");

    const handleNext = () => {
        if (!value) return;
        setProfileData((prev) => ({
            ...prev,
            smoking: value, // This is now the consistent, non-translated value
        }));
        navigate("/onboarding/weed");
    };

    return (
        <div
            className="min-h-screen w-full flex items-center justify-center relative"
            style={{
                background: `url('/images/myanmatch-bg.jpg') center center / cover no-repeat`,
            }}
        >
            <div className="relative bg-white/95 rounded-3xl shadow-2xl max-w-md w-full px-7 py-10 flex flex-col items-center">
                <div className="flex items-center justify-center w-full mb-7">
                    <div className="w-7 h-7 rounded-full border-2 border-[#6e2263] flex items-center justify-center bg-white shadow">
                        <Icons.fire className="w-5 h-5 text-[#6e2263]" />
                    </div>
                    <div className="flex-1 h-1 mx-2 rounded-full bg-gradient-to-r from-[#ffc2ee] to-[#82144d]" />
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-[#82144d] text-center mb-6">
                    {t("smoke.title")}
                </h1>

                <div className="w-full flex flex-col gap-3 mt-4 mb-6">
   {OPTIONS.map(({ key, value: optionValue }) => { // Renamed 'value' to 'optionValue'
  const label = t(key);
  const selected = value === optionValue; // Correctly compare component state 'value' to the 'optionValue'
  return (
    <button
      key={key}
      type="button"
      className={`w-full flex items-center justify-between px-6 py-4 rounded-xl shadow-sm border-2 transition ${
        selected
          ? "border-[#a55596] bg-[#fae7f6]/80 text-[#6e2263] font-bold scale-105"
          : "border-gray-200 bg-gray-50 text-gray-700"
      }`}
      onClick={() => setValue(optionValue)} // Save the correct 'optionValue'
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

                <button
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition duration-200 mt-10 self-end ${
                        value
                            ? "bg-gradient-to-r from-[#a55596] to-[#82144d] text-white hover:scale-105"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                    onClick={handleNext}
                    disabled={!value}
                    aria-label={t("smoke.nextAria")}
                    style={{ boxShadow: "0 4px 24px 0 rgba(130,20,77,0.13)" }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    );
}