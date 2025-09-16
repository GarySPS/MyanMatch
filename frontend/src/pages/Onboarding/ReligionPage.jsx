// src/pages/Onboarding/ReligionPage.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiOutlineBookOpen } from "react-icons/hi";
import { useOnboarding } from "../../context/OnboardingContext";
import { useI18n } from "../../i18n";

// 1. UPDATE OPTIONS to include a canonical value to save
const OPTIONS = [
  { key: "rel.opt.agnostic",  value: "Agnostic" },
  { key: "rel.opt.atheist",   value: "Atheist" },
  { key: "rel.opt.buddhist",   value: "Buddhist" },
  { key: "rel.opt.catholic",   value: "Catholic" },
  { key: "rel.opt.christian",  value: "Christian" },
  { key: "rel.opt.hindu",      value: "Hindu" },
  { key: "rel.opt.jewish",     value: "Jewish" },
  { key: "rel.opt.deity",      value: "Spiritual but not religious" },
  { key: "rel.opt.muslim",     value: "Muslim" },
];

export default function ReligionPage() {
  const navigate = useNavigate();
  const { setProfileData } = useOnboarding();
  const { t } = useI18n();

  // This will now store canonical values, e.g., ["Buddhist", "Christian"]
  const [selected, setSelected] = useState([]);

  const handleToggle = (value) => { // 2. USE THE CANONICAL VALUE
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleNext = () => {
    if (selected.length === 0) return;
    setProfileData((prev) => ({
      ...prev,
      religion: selected, // This is now an array of consistent values
    }));
    navigate("/onboarding/political-belief");
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative"
      style={{ background: `url('/images/myanmatch-bg.jpg') center center / cover no-repeat` }}
    >
      <div className="relative bg-white/95 rounded-3xl shadow-2xl max-w-md w-full px-7 py-10 flex flex-col items-center">
        <div className="flex items-center justify-center w-full mb-7">
          <div className="w-7 h-7 rounded-full border-2 border-[#6e2263] flex items-center justify-center bg-white shadow">
            <HiOutlineBookOpen className="w-5 h-5 text-[#6e2263]" />
          </div>
          <div className="flex-1 h-1 mx-2 rounded-full bg-gradient-to-r from-[#ffc2ee] to-[#82144d]" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-[#82144d] text-center mb-6">
          {t("rel.title")}
        </h1>

        <div className="w-full flex flex-col gap-3 mt-4 mb-6">
          {OPTIONS.map(({ key, value }) => { // 3. DESTRUCTURE 'value'
            const label = t(key);
            const active = selected.includes(value); // 4. COMPARE against 'value'
            return (
              <button
                key={key}
                type="button"
                className={`w-full flex items-center justify-between px-6 py-4 rounded-xl shadow-sm border-2 transition ${
                  active
                    ? "border-[#a55596] bg-[#fae7f6]/80 text-[#6e2263] font-bold scale-105"
                    : "border-gray-200 bg-gray-50 text-gray-700"
                }`}
                onClick={() => handleToggle(value)} // 5. PASS 'value' to the handler
              >
                <span className="text-lg">{label}</span>
                <span
                  className={`flex items-center justify-center w-6 h-6 rounded-full border-2 ${
                    active ? "border-[#a55596] bg-[#a55596]" : "border-gray-300 bg-white"
                  }`}
                >
                  {active && ( <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="currentColor" /></svg> )}
                </span>
              </button>
            );
          })}
        </div>

        <button
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition duration-200 mt-10 self-end ${
            selected.length > 0
              ? "bg-gradient-to-r from-[#a55596] to-[#82144d] text-white hover:scale-105"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
          onClick={handleNext}
          disabled={selected.length === 0}
          aria-label={t("rel.nextAria")}
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