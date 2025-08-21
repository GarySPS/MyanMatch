import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icons } from "../../components/IconLibrary";
import { useOnboarding } from "../../context/OnboardingContext";
import { useI18n } from "../../i18n";

const ETHNICITIES = [
  // Myanmar ethnicities
  { key: "eth.opt.bamar",        valueEn: "Bamar" },
  { key: "eth.opt.karen",        valueEn: "Karen (Kayin)" },
  { key: "eth.opt.shan",         valueEn: "Shan" },
  { key: "eth.opt.kachin",       valueEn: "Kachin" },
  { key: "eth.opt.mon",          valueEn: "Mon" },
  { key: "eth.opt.chin",         valueEn: "Chin" },
  { key: "eth.opt.rakhine",      valueEn: "Rakhine (Arakanese)" },
  { key: "eth.opt.kayah",        valueEn: "Kayah (Karenni)" },
  { key: "eth.opt.mmOther",      valueEn: "Other Myanmar Ethnic" },
  { key: "eth.opt.chinese",      valueEn: "Chinese" },
  { key: "eth.opt.indian",       valueEn: "Indian" },
  // International
  { key: "eth.opt.african",      valueEn: "Black/African Descent" },
  { key: "eth.opt.eastAsian",    valueEn: "East Asian" },
  { key: "eth.opt.southAsian",   valueEn: "South Asian" },
  { key: "eth.opt.hispanic",     valueEn: "Hispanic/Latino" },
  { key: "eth.opt.mideast",      valueEn: "Middle Eastern" },
  { key: "eth.opt.native",       valueEn: "Native American" },
  { key: "eth.opt.pacific",      valueEn: "Pacific Islander" },
  { key: "eth.opt.white",        valueEn: "White/Caucasian" },
  { key: "eth.opt.other",        valueEn: "Other" },
];

export default function EthnicityPage() {
  const navigate = useNavigate();
  const { setProfileData } = useOnboarding();
  const { t } = useI18n();

  // store EN values for DB consistency
  const [selected, setSelected] = useState([]);

  const handleToggle = (valueEn) => {
    setSelected((prev) =>
      prev.includes(valueEn) ? prev.filter((v) => v !== valueEn) : [...prev, valueEn]
    );
  };

  const handleNext = () => {
    if (selected.length === 0) return;
    setProfileData((prev) => ({ ...prev, ethnicity: selected }));
    navigate("/onboarding/children");
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white px-6 pt-10 pb-8">
      <div>
        {/* Progress bar and icon */}
        <div className="flex items-center justify-center mb-7">
          <div className="w-3 h-3 rounded-full border-2 border-gray-800 flex items-center justify-center">
            <Icons.globe className="w-4 h-4 text-gray-700" />
          </div>
          <div className="flex-1 h-1 mx-2 rounded-full bg-gray-300" />
        </div>

        <h1 className="text-2xl font-bold mb-2 text-gray-900">
          {t("eth.title")}
        </h1>

        {/* Multi-select options */}
        <div className="mb-5 mt-4">
          {ETHNICITIES.map(({ key, valueEn }) => {
            const active = selected.includes(valueEn);
            return (
              <label
                key={key}
                className={`flex items-center justify-between px-2 py-3 border-b border-gray-100 cursor-pointer ${
                  active ? "font-semibold text-gray-900" : "text-gray-700"
                }`}
              >
                {t(key)}
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => handleToggle(valueEn)}
                  className="appearance-none w-5 h-5 border-2 border-gray-400 rounded-sm checked:bg-[#6e2263] checked:border-[#6e2263] focus:outline-none"
                  style={{
                    backgroundColor: active ? "#6e2263" : "transparent",
                    borderWidth: 2,
                  }}
                />
              </label>
            );
          })}
        </div>

        {/* Learn more */}
        <div className="mt-6 text-sm">
          <span className="text-gray-400">{t("eth.whyPrefix")} </span>
          <span className="text-[#6e2263] font-semibold cursor-pointer">
            {t("eth.learnMore")}
          </span>
        </div>
      </div>

      {/* Next button */}
      <button
        className={`w-12 h-12 rounded-full flex items-center justify-center shadow transition-colors duration-200 self-end mt-10 ${
          selected.length > 0
            ? "bg-[#6e2263] text-white"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
        onClick={handleNext}
        disabled={selected.length === 0}
        aria-label={t("eth.nextAria")}
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
    </div>
  );
}
