// src/pages/Onboarding/TermsPage.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../../context/OnboardingContext";
import { useI18n } from "../../i18n"; // [!ADD!] Import the i18n hook

// [!MODIFIED!] Section component is now simpler.
function Section({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl bg-white/8 ring-1 ring-white/15 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="font-semibold text-base">{title}</span>
        <span
          className={`transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          ▼
        </span>
      </button>
      {open && <div className="px-5 pb-5 text-sm text-white/90">{children}</div>}
    </div>
  );
}

export default function TermsPage() {
  const navigate = useNavigate();
  const { setProfileData } = useOnboarding();
  const { t } = useI18n(); // [!ADD!] Initialize the translation function
  const [agree, setAgree] = useState(false);

  return (
    <div className="min-h-screen relative flex items-center justify-center px-6 py-10">
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#3a0224] via-[#2a0018] to-[#190011]"
        aria-hidden
      />
      <div className="relative w-full max-w-md text-white">
        <img
          src="/images/myanmatch-logo.png"
          alt="MyanMatch"
          className="mx-auto w-44 h-44 rounded-full shadow-xl ring-1 ring-white/10 mb-6 object-cover"
        />

        {/* [!MODIFIED!] All text now uses the t() function */}
        <h1 className="text-3xl font-extrabold tracking-tight text-center mb-2 whitespace-pre-line">
          {t("terms.title")}
        </h1>
        <p className="text-center text-white/80 mb-6">
          {t("terms.subtitle")}
        </p>

        <div className="space-y-3">
          <Section title={t("terms.s1.title")} defaultOpen>
            <ul className="list-disc pl-5 space-y-2">
              <li>{t("terms.s1.r1")}</li>
              <li>{t("terms.s1.r2")}</li>
              <li>{t("terms.s1.r3")}</li>
              <li>{t("terms.s1.r4")}</li>
              <li>{t("terms.s1.r5")}</li>
            </ul>
          </Section>

          <Section title={t("terms.s2.title")}>
            <ul className="list-disc pl-5 space-y-2">
              <li>{t("terms.s2.r1")}</li>
              <li>{t("terms.s2.r2")}</li>
              <li>{t("terms.s2.r3")}</li>
              <li>{t("terms.s2.r4")}</li>
            </ul>
          </Section>

          <Section title={t("terms.s3.title")}>
            <ul className="list-disc pl-5 space-y-2">
              <li>{t("terms.s3.r1")}</li>
              <li>{t("terms.s3.r2")}</li>
              <li>{t("terms.s3.r3")}</li>
              <li>{t("terms.s3.r4")}</li>
            </ul>
          </Section>

          <Section title={t("terms.s4.title")}>
            <ul className="list-disc pl-5 space-y-2">
              <li>{t("terms.s4.r1")}</li>
              <li>{t("terms.s4.r2")}</li>
              <li>{t("terms.s4.r3")}</li>
              <li>{t("terms.s4.r4")}</li>
            </ul>
          </Section>
        </div>

        <div className="mt-6 space-y-3">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-1 h-5 w-5 rounded accent-pink-500"
            />
            <span className="text-sm text-white/90">{t("terms.agree.checkbox")}</span>
          </label>

          <button
            onClick={() => {
              if (!agree) return;
              setProfileData((prev) => ({ ...prev, agreedToTerms: true }));
              navigate("/onboarding/name");
            }}
            disabled={!agree}
            className={`w-full rounded-full py-4 text-lg font-semibold shadow-lg transition
              ${
                agree
                  ? "bg-gradient-to-r from-pink-500 to-purple-500 active:scale-[0.99]"
                  : "bg-white/20 text-white/60 cursor-not-allowed"
              }`}
          >
            {t("terms.agree.button")}
          </button>
        </div>
      </div>
    </div>
  );
}