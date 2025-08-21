import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiOutlineBriefcase } from "react-icons/hi";
import { useOnboarding } from "../../context/OnboardingContext";
import { useI18n } from "../../i18n";

export default function WorkPage() {
  const navigate = useNavigate();
  const { setProfileData } = useOnboarding();
  const { t } = useI18n();
  const [workplace, setWorkplace] = useState("");

  const handleNext = () => {
    if (!workplace.trim()) return;
    setProfileData((prev) => ({
      ...prev,
      workplace,
      // workplaceVisible removed!
    }));
    navigate("/onboarding/job-title");
  };

  const canNext = workplace.trim().length > 0;

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
            <HiOutlineBriefcase className="w-5 h-5 text-[#6e2263]" />
          </div>
          <div className="flex-1 h-1 mx-2 rounded-full bg-gradient-to-r from-[#ffc2ee] to-[#82144d]" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-[#82144d] text-center mb-6">
          {t("work.title")}
        </h1>

        <input
          type="text"
          value={workplace}
          onChange={(e) => setWorkplace(e.target.value)}
          placeholder={t("work.placeholder")}
          className="w-full border-b-2 border-[#c48fb4] focus:border-[#6e2263] text-2xl font-semibold py-2 outline-none mb-7 bg-transparent transition"
        />

        {/* Next button */}
        <button
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition duration-200 mt-10 self-end
            ${
              canNext
                ? "bg-gradient-to-r from-[#a55596] to-[#82144d] text-white hover:scale-105"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }
          `}
          onClick={handleNext}
          disabled={!canNext}
          aria-label={t("work.nextAria")}
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
