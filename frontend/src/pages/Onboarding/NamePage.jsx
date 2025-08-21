import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icons } from "../../components/IconLibrary";
import { useOnboarding } from "../../context/OnboardingContext";
import { useI18n } from "../../i18n";

export default function NamePage() {
  const navigate = useNavigate();
  const { setProfileData } = useOnboarding();
  const { t } = useI18n();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const canContinue = firstName.trim().length > 0;

  const handleNext = (e) => {
    e.preventDefault();
    if (!canContinue) return;
    setProfileData(prev => ({
      ...prev,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
    }));
    navigate("/onboarding/birthdate");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10 relative z-10">
      {/* Card container */}
      <div className="bg-white rounded-3xl shadow-lg max-w-md w-full p-8">

        {/* Progress dots */}
        <div className="flex items-center justify-center mb-7">
          <div className="w-3 h-3 rounded-full border-2 border-gray-800 flex items-center justify-center">
            <Icons.eye className="w-4 h-4 text-gray-700" />
          </div>
          <div className="w-2 h-2 mx-2 rounded-full bg-gray-300" />
          <div className="w-2 h-2 mx-1 rounded-full bg-gray-300" />
          <div className="w-2 h-2 mx-1 rounded-full bg-gray-300" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold mb-5 text-gray-900 text-center">
          {t("name.title")}
        </h1>

        {/* Form */}
        <form onSubmit={handleNext} autoComplete="off">
          <input
            type="text"
            placeholder={t("name.firstPH")}
            className="block w-full text-lg mb-4 bg-transparent border-b border-gray-400 focus:outline-none focus:border-gray-700 placeholder-gray-400 font-light"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            autoFocus
          />

          <input
            type="text"
            placeholder={t("name.lastPH")}
            className="block w-full text-lg mb-2 bg-transparent border-b border-gray-400 focus:outline-none focus:border-gray-700 placeholder-gray-400 font-light"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />

          <div className="text-xs text-gray-500 mb-6">
            {t("name.note")}
            <span className="text-purple-800 font-medium ml-1 cursor-pointer">{t("name.why")}</span>
          </div>

          <div className="flex items-center text-sm text-gray-700 mb-8">
            <Icons.eye className="w-5 h-5 mr-2" />
            {t("name.alwaysVisible")}
          </div>

          {/* Next button */}
          <button
            type="submit"
            disabled={!canContinue}
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow transition-colors duration-200 mx-auto ${
              canContinue
                ? "bg-gray-900 text-white hover:bg-gray-800"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
            aria-label={t("name.nextAria")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
