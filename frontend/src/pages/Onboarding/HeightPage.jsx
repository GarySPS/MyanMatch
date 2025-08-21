import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icons } from "../../components/IconLibrary";
import { useOnboarding } from "../../context/OnboardingContext";

// FT+IN and CM arrays
const feetOptions = Array.from({ length: 3 }, (_, i) => 4 + i); // 4, 5, 6 feet
const inchOptions = Array.from({ length: 12 }, (_, i) => i);    // 0 - 11 inches
const cmOptions = Array.from({ length: 61 }, (_, i) => 140 + i); // 140-200cm

function formatFeetInches(ft, inch) {
  return `${ft}' ${inch}"`;
}

export default function HeightPage() {
  const navigate = useNavigate();
  const { setProfileData } = useOnboarding();
  const [unit, setUnit] = useState("ft");
  const [feet, setFeet] = useState(5);
  const [inch, setInch] = useState(5);
  const [cm, setCm] = useState(165);

  // Sync values when switching units
  const handleUnit = (u) => {
    if (u === unit) return;
    if (u === "cm") {
      const cmVal = Math.round((feet * 30.48) + (inch * 2.54));
      setCm(cmVal);
    } else {
      const totalInches = cm / 2.54;
      setFeet(Math.floor(totalInches / 12));
      setInch(Math.round(totalInches % 12));
    }
    setUnit(u);
  };

  const handleNext = () => {
    setProfileData(prev => ({
      ...prev,
      height: unit === "ft" ? formatFeetInches(feet, inch) : `${cm} cm`,
      height_unit: unit,
    }));
    navigate("/onboarding/ethnicity");
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative"
      style={{
        background: `url('/images/myanmatch-bg.jpg') center center / cover no-repeat`
      }}
    >
      <div className="relative bg-white/95 rounded-3xl shadow-2xl max-w-md w-full px-7 py-10 flex flex-col items-center">
        {/* Progress bar and icon */}
        <div className="flex items-center justify-center w-full mb-7">
          <div className="w-7 h-7 rounded-full border-2 border-[#6e2263] flex items-center justify-center bg-white shadow">
            <Icons.height className="w-5 h-5 text-[#6e2263]" />
          </div>
          <div className="flex-1 h-1 mx-2 rounded-full bg-gradient-to-r from-[#ffc2ee] to-[#82144d]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#82144d] text-center mb-6">
          How tall are you?
        </h1>
        {/* Height picker */}
        <div className="flex flex-col items-center my-8 w-full">
          {unit === "ft" ? (
            <div className="flex gap-4">
              <select
                className="text-xl px-2 py-2 bg-transparent border-b-2 border-[#c48fb4] focus:border-[#6e2263] transition"
                value={feet}
                onChange={(e) => setFeet(Number(e.target.value))}
              >
                {feetOptions.map(f => (
                  <option key={f} value={f}>{f}'</option>
                ))}
              </select>
              <select
                className="text-xl px-2 py-2 bg-transparent border-b-2 border-[#c48fb4] focus:border-[#6e2263] transition"
                value={inch}
                onChange={(e) => setInch(Number(e.target.value))}
              >
                {inchOptions.map(i => (
                  <option key={i} value={i}>{i}"</option>
                ))}
              </select>
            </div>
          ) : (
            <select
              className="text-xl px-2 py-2 bg-transparent border-b-2 border-[#c48fb4] focus:border-[#6e2263] transition"
              value={cm}
              onChange={(e) => setCm(Number(e.target.value))}
            >
              {cmOptions.map(c => (
                <option key={c} value={c}>{c} cm</option>
              ))}
            </select>
          )}
        </div>
        {/* Unit switch */}
        <div className="flex justify-end items-center mb-7 w-full">
          <button
            className={`px-5 py-1 rounded-full border font-semibold text-sm transition mr-2 ${
              unit === "ft"
                ? "bg-[#a55596] text-white border-[#a55596] shadow"
                : "bg-gray-100 text-gray-700 border-gray-200"
            }`}
            onClick={() => handleUnit("ft")}
          >
            FT
          </button>
          <button
            className={`px-5 py-1 rounded-full border font-semibold text-sm transition ${
              unit === "cm"
                ? "bg-[#a55596] text-white border-[#a55596] shadow"
                : "bg-gray-100 text-gray-700 border-gray-200"
            }`}
            onClick={() => handleUnit("cm")}
          >
            CM
          </button>
        </div>
        {/* Always visible */}
        <div className="flex items-center text-[#6e2263] text-base mb-2">
          <Icons.eye className="w-5 h-5 mr-2" />
          Always visible on profile
        </div>
        {/* Next button */}
        <button
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition duration-200 mt-10 self-end bg-gradient-to-r from-[#a55596] to-[#82144d] text-white hover:scale-105"
          onClick={handleNext}
          aria-label="Next"
          style={{ boxShadow: "0 4px 24px 0 rgba(130,20,77,0.13)" }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
