import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icons } from "../../components/IconLibrary";
import { useOnboarding } from "../../context/OnboardingContext";
import { useI18n } from "../../i18n";

const OPTIONS = [
  { key: "interested.opt.men", value: "men" },
  { key: "interested.opt.women", value: "women" },
  { key: "interested.opt.nb", value: "nonbinary" },
  { key: "interested.opt.everyone", value: "everyone" },
];

export default function InterestedInPage() {
  const navigate = useNavigate();
  const { setProfileData } = useOnboarding();
  const { t } = useI18n();

  const [selected, setSelected] = useState([]);

  const handleToggle = (val) => {
    if (val === "everyone") {
      setSelected(selected.includes("everyone") ? [] : ["everyone"]);
    } else {
      let next = selected.filter((v) => v !== "everyone");
      if (next.includes(val)) next = next.filter((v) => v !== val);
      else next.push(val);
      setSelected(next);
    }
  };

  const handleNext = () => {
    if (selected.length === 0) return;
    setProfileData(prev => ({
      ...prev,
      interested_in: selected, // store canonical values
    }));
    navigate("/onboarding/intention");
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative"
      style={{ background: `url('/images/myanmatch-bg.jpg') center center / cover no-repeat` }}
    >
      <div className="relative bg-white/95 rounded-3xl shadow-2xl max-w-md w-full px-7 py-10 flex flex-col items-center">
        {/* Progress bar and icon */}
        <div className="flex items-center justify-center w-full mb-7">
          <div className="w-7 h-7 rounded-full border-2 border-[#6e2263] flex items-center justify-center bg-white shadow">
            <Icons.heart className="w-5 h-5 text-[#6e2263]" />
          </div>
          <div className="flex-1 h-1 mx-2 rounded-full bg-gradient-to-r from-[#ffc2ee] to-[#82144d]" />
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-[#82144d] text-center mb-2">
          {t("interested.title")}
        </h1>
        <div className="mb-7 text-gray-400 text-base text-center">
          {t("interested.subtitle")}
        </div>

        {/* Multi-select options */}
        <div className="w-full flex flex-col gap-4 mb-2">
          {OPTIONS.map((opt) => {
            const active = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                className={`w-full flex items-center justify-between px-6 py-4 rounded-xl shadow-sm border-2 transition
                  ${
                    active
                      ? "border-[#a55596] bg-[#fae7f6]/80 text-[#6e2263] font-bold scale-105"
                      : "border-gray-200 bg-gray-50 text-gray-700"
                  }
                `}
                onClick={() => handleToggle(opt.value)}
              >
                <span className="text-lg">{t(opt.key)}</span>
                <span
                  className={`flex items-center justify-center w-6 h-6 rounded ${
                    active
                      ? "bg-gradient-to-tr from-[#a55596] to-[#82144d] text-white"
                      : "bg-white border-2 border-gray-300 text-gray-300"
                  }`}
                >
                  {active && (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <circle cx="12" cy="12" r="8" fill="currentColor" />
                    </svg>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Next button */}
        <button
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition duration-200 mt-10 self-end
            ${
              selected.length > 0
                ? "bg-gradient-to-r from-[#a55596] to-[#82144d] text-white hover:scale-105"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }
          `}
          onClick={handleNext}
          disabled={selected.length === 0}
          aria-label={t("interested.nextAria")}
          style={{ boxShadow: "0 4px 24px 0 rgba(130,20,77,0.13)" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
