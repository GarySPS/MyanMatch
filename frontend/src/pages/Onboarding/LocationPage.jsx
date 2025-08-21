import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icons } from "../../components/IconLibrary";
import { useOnboarding } from "../../context/OnboardingContext";
import { useI18n } from "../../i18n";

/* ---------- Pretty popup (bottom-sheet style) ---------- */
function FancyPopup({ open, title, message, onClose, onRetry }) {
  const { t } = useI18n();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      {/* dim */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />
      {/* sheet */}
      <div
        className="relative w-full sm:max-w-md mx-auto rounded-t-3xl sm:rounded-3xl
                   bg-gradient-to-b from-white to-[#fff4fb]
                   shadow-[0_-8px_40px_rgba(130,20,77,0.25)] p-6
                   animate-[slideUp_.24s_ease-out]"
      >
        <div className="mx-auto mb-3 w-12 h-1.5 rounded-full bg-[#e9b8d2]" />
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-br from-[#ffdbef] to-[#ffd7f6] flex items-center justify-center ring-1 ring-white">
            {/* inline warning icon */}
            <svg className="w-6 h-6 text-[#b21c7c]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                d="M12 9v4m0 4h.01M10.29 3.86l-8.5 14.73A2 2 0 003.5 22h17a2 2 0 001.71-3.41l-8.5-14.73a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-[#82144d]">{title}</h3>
            <p className="mt-1 text-sm text-[#6e2263]/80">{message}</p>
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <button onClick={onClose} className="flex-1 h-11 rounded-xl bg-white text-[#6e2263] font-semibold ring-1 ring-[#e9b8d2] shadow-sm active:scale-95">
            {t("common.ok")}
          </button>
          {onRetry && (
            <button onClick={onRetry} className="flex-1 h-11 rounded-xl bg-gradient-to-r from-[#a55596] to-[#82144d] text-white font-semibold shadow-md active:scale-95">
              {t("common.retry")}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp { from { transform: translateY(24px); opacity: .6 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </div>
  );
}

export default function LocationPage() {
  const navigate = useNavigate();
  const { setProfileData } = useOnboarding();
  const { t } = useI18n();

  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);

  // popup state
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupMsg, setPopupMsg] = useState({ title: "", message: "", retry: null });

  const showPopup = (title, message, retry = null) => {
    setPopupMsg({ title, message, retry });
    setPopupOpen(true);
  };

  const reverseGeocode = async (latitude, longitude) => {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&format=jsonv2&zoom=10&accept-language=en`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`Reverse geocode failed (${res.status})`);
    const data = await res.json();
    const a = data.address || {};
    const city = a.city || a.town || a.village || a.county || a.state_district || a.state || "";
    return city;
  };

  const handleCurrentLocation = async () => {
    if (!navigator.geolocation) {
      showPopup(t("loc.pop.unsupported.title"), t("loc.pop.unsupported.msg"));
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const city = await reverseGeocode(latitude, longitude);
          if (!city) {
            showPopup(t("loc.pop.nocity.title"), t("loc.pop.nocity.msg"));
          } else {
            setLocation(city);
            setProfileData((prev) => ({ ...prev, location: city, lat: latitude, lng: longitude }));
          }
        } catch (e) {
          showPopup(t("loc.pop.fetch.title"), t("loc.pop.fetch.msg"), () => {
            setPopupOpen(false);
            handleCurrentLocation();
          });
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        const denied = err.code === 1;
        showPopup(
          t("loc.pop.blocked.title"),
          denied ? t("loc.pop.blocked.denied") : t("loc.pop.blocked.generic"),
          () => {
            setPopupOpen(false);
            handleCurrentLocation();
          }
        );
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const handleNext = () => {
    if (location.trim() === "") return;
    navigate("/onboarding/gender");
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
            <Icons.location className="w-5 h-5 text-[#6e2263]" />
          </div>
          <div className="flex-1 h-1 mx-2 rounded-full bg-gradient-to-r from-[#ffc2ee] to-[#82144d]" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-[#82144d] text-center mb-3">
          {t("loc.title")}
        </h1>
        <div className="mb-4 text-gray-400 text-base text-center">
          {t("loc.subtitle")}
        </div>

        <input
          type="text"
          className="w-full border-b-2 border-[#c48fb4] text-lg py-3 mb-1 bg-transparent outline-none transition text-center"
          placeholder={t("loc.inputPH")}
          value={location}
          readOnly
        />

        <button
          className="mt-5 w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#f7e0fa] to-[#ffe9f5] rounded-xl font-semibold text-[#6e2263] shadow transition hover:scale-105 disabled:opacity-60"
          onClick={handleCurrentLocation}
          type="button"
          disabled={loading}
        >
          <Icons.location className="w-5 h-5" />
          {loading ? t("loc.btn.loading") : t("loc.btn.use")}
        </button>

        <button
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition duration-200 mt-8 self-end
            ${location.trim() !== "" ? "bg-gradient-to-r from-[#a55596] to-[#82144d] text-white hover:scale-105" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
          onClick={handleNext}
          disabled={location.trim() === ""}
          aria-label={t("loc.nextAria")}
          style={{ boxShadow: "0 4px 24px 0 rgba(130,20,77,0.13)" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* popup */}
      <FancyPopup
        open={popupOpen}
        title={popupMsg.title}
        message={popupMsg.message}
        onClose={() => setPopupOpen(false)}
        onRetry={popupMsg.retry}
      />
    </div>
  );
}
