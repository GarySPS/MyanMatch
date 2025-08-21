import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiOutlineAcademicCap } from "react-icons/hi";
import { useOnboarding } from "../../context/OnboardingContext";
import { useI18n } from "../../i18n";

export default function SchoolPage() {
  const navigate = useNavigate();
  const { setProfileData } = useOnboarding();
  const { t } = useI18n();
  const [schools, setSchools] = useState([""]);

  // Handle school input changes
  const handleChange = (idx, val) => {
    const updated = [...schools];
    updated[idx] = val;
    setSchools(updated);
  };

  // Remove a school input
  const handleRemove = (idx) => {
    if (schools.length === 1) return;
    setSchools(schools.filter((_, i) => i !== idx));
  };

  // Add another school input
  const handleAdd = () => {
    setSchools([...schools, ""]);
  };

  const handleNext = () => {
    if (schools.some((s) => !s.trim())) return;
    setProfileData((prev) => ({
      ...prev,
      schools, // array of strings
      // schools_visible removed
    }));
    navigate("/onboarding/education-level");
  };

  const allFilled = schools.every((s) => s.trim());

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
            <HiOutlineAcademicCap className="w-5 h-5 text-[#6e2263]" />
          </div>
          <div className="flex-1 h-1 mx-2 rounded-full bg-gradient-to-r from-[#ffc2ee] to-[#82144d]" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-[#82144d] text-center mb-6">
          {t("school.title")}
        </h1>

        {/* School inputs */}
        <div className="w-full">
          {schools.map((school, idx) => (
            <div key={idx} className="flex items-center mb-2">
              <input
                type="text"
                value={school}
                onChange={(e) => handleChange(idx, e.target.value)}
                placeholder={t("school.inputPH")}
                className="flex-1 border-b-2 border-[#c48fb4] focus:border-[#6e2263] text-2xl font-semibold py-2 outline-none bg-transparent transition"
              />
              {schools.length > 1 && (
                <button
                  onClick={() => handleRemove(idx)}
                  className="ml-2 text-2xl text-gray-400 hover:text-red-400"
                  tabIndex={-1}
                  aria-label={t("school.removeAria")}
                  type="button"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {/* Add another school link */}
          <button
            className="text-lg text-gray-400 italic mt-2 mb-5"
            type="button"
            onClick={handleAdd}
            disabled={schools.length >= 4}
          >
            {t("school.add")}
          </button>
        </div>

        {/* Next button */}
        <button
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition duration-200 mt-10 self-end
            ${
              allFilled
                ? "bg-gradient-to-r from-[#a55596] to-[#82144d] text-white hover:scale-105"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }
          `}
          onClick={handleNext}
          disabled={!allFilled}
          aria-label={t("school.nextAria")}
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
