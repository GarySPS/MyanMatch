import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { HiOutlineLockClosed } from "react-icons/hi2";
import { useOnboarding } from "../../context/OnboardingContext";
import { useI18n } from "../../i18n";

// Localized month labels (short + long) driven by current lang.
// We DO NOT store arrays in STRINGS to avoid t() returning non-strings.
const MONTHS = {
  en: {
    short: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    long:  ["January","February","March","April","May","June","July","August","September","October","November","December"],
  },
  my: {
    // Common Myanmar short forms
    short: ["ဇန်","ဖေ","မတ်","ဧ","မေ","ဇွန်","ဇူ","ဩ","စက်","အောက်","နို","ဒီ"],
    long:  ["ဇန်နဝါရီ","ဖေဖော်ဝါရီ","မတ်","ဧပြီ","မေ","ဇွန်","ဇူလိုင်","ဩဂုတ်","စက်တင်ဘာ","အောက်တိုဘာ","နိုဝင်ဘာ","ဒီဇင်ဘာ"],
  },
};

// Full year range (no 18+ restriction)
function getYearRange() {
  const thisYear = new Date().getFullYear();
  const years = [];
  for (let y = thisYear; y >= thisYear - 100; y--) years.push(y);
  return years;
}

export default function BirthdatePage() {
  const navigate = useNavigate();
  const { setProfileData } = useOnboarding();
  const { t, lang } = useI18n();

  const months = useMemo(() => MONTHS[lang] || MONTHS.en, [lang]);
  const years = useMemo(getYearRange, []);

  // Use month index to avoid locale parsing issues
  const today = new Date();
  const [monthIdx, setMonthIdx] = useState(today.getMonth()); // 0-11
  const [day, setDay] = useState(today.getDate());            // 1-31
  const [year, setYear] = useState(years[0]);                 // current year
  const [age, setAge] = useState(0);
  const [showModal, setShowModal] = useState(false);

  // Recalculate age on change
  useEffect(() => {
    const birth = new Date(year, monthIdx, day);
    const now = new Date();
    let a = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) a--;
    setAge(a);
  }, [monthIdx, day, year]);

  const daysInMonth = useMemo(
    () => new Date(year, monthIdx + 1, 0).getDate(),
    [year, monthIdx]
  );

  const handleNext = (e) => {
    e.preventDefault();
    setShowModal(true);
  };

  const handleConfirm = () => {
    const birthdate = `${year}-${String(monthIdx + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setProfileData(prev => ({ ...prev, birthdate, age }));
    setShowModal(false);
    navigate("/onboarding/details-intro");
    
  };

  const displayDate = `${months.long[monthIdx]} ${day}, ${year}`;

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10 relative z-10">
      <div className="bg-white rounded-3xl shadow-lg max-w-md w-full p-8 relative z-20">

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-30 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-7 w-11/12 max-w-md mx-auto shadow-xl z-40 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{t("dob.confirmTitle")}</h2>
              <div className="text-7xl font-extrabold text-gray-900 my-4 tracking-tight">{age}</div>
              <div className="mb-6 text-gray-500">
                {t("dob.born", { date: displayDate })}
              </div>
              <div className="flex border-t pt-4">
                <button
                  className="flex-1 py-2 text-gray-700 font-medium"
                  onClick={() => setShowModal(false)}
                >
                  {t("dob.edit")}
                </button>
                <button
                  className="flex-1 py-2 text-[#6e2263] font-semibold"
                  onClick={handleConfirm}
                >
                  {t("dob.confirm")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Progress Dots + Lock Icon */}
        <div className="flex items-center justify-center mb-7">
          <div className="w-3 h-3 rounded-full border-2 border-gray-800 flex items-center justify-center">
            <HiOutlineLockClosed className="w-4 h-4 text-gray-700" />
          </div>
          <div className="w-2 h-2 mx-2 rounded-full bg-gray-300" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold mb-8 text-gray-900 text-center">
          {t("dob.title")}
        </h1>

        {/* Selectors */}
        <form className="flex items-center justify-center gap-2 mb-8" onSubmit={handleNext}>
          {/* Month */}
          <select
            value={monthIdx}
            onChange={(e) => setMonthIdx(Number(e.target.value))}
            className="text-lg py-2 px-2 rounded-md border-b-2 border-gray-200 focus:outline-none bg-transparent"
            style={{ minWidth: 60 }}
          >
            {months.short.map((label, i) => (
              <option key={i} value={i}>{label}</option>
            ))}
          </select>

          {/* Day */}
          <select
            value={day}
            onChange={(e) => setDay(Number(e.target.value))}
            className="text-lg py-2 px-2 rounded-md border-b-2 border-gray-200 focus:outline-none bg-transparent"
          >
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
              <option key={d} value={d}>{String(d).padStart(2, "0")}</option>
            ))}
          </select>

          {/* Year */}
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="text-lg py-2 px-2 rounded-md border-b-2 border-gray-200 focus:outline-none bg-transparent"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* Next */}
          <button
            type="submit"
            className="w-12 h-12 rounded-full flex items-center justify-center shadow transition-colors duration-200 bg-[#6e2263] text-white hover:bg-[#5b1b54]"
            aria-label={t("dob.nextAria")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
