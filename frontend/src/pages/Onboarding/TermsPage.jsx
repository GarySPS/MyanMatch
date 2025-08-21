import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../../context/OnboardingContext";

function Section({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl bg-white/8 ring-1 ring-white/15 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="font-semibold">{title}</span>
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

        <h1 className="text-3xl font-extrabold tracking-tight text-center mb-2">
          MyanMatch Terms & Policies
        </h1>
        <p className="text-center text-white/80 mb-6">
          MyanMatch is for making friends online. It’s suitable for all ages.
          Please read these short guidelines before continuing.
        </p>

        <div className="space-y-3">
          <Section title="1) Community Guidelines" defaultOpen>
            <ul className="list-disc pl-5 space-y-1">
              <li>Be kind and respectful. No bullying, hate speech, or harassment.</li>
              <li>No nudity, sexual content, or adult services. This is not an 18+ app.</li>
              <li>No threats, violence, scams, or impersonation.</li>
              <li>Use your own photos and only post content you have rights to share.</li>
              <li>Keep conversations friendly and inclusive of all ages and backgrounds.</li>
            </ul>
          </Section>

          <Section title="2) Safety Rules">
            <ul className="list-disc pl-5 space-y-1">
              <li>Protect personal info: don’t share address, school, or financial details.</li>
              <li>Meet new people in public places and tell a trusted person if you plan to meet.</li>
              <li>Report and block anyone who makes you uncomfortable.</li>
              <li>
                If you are under 13, use MyanMatch only with a parent/guardian and never chat
                privately with adults you don’t know.
              </li>
            </ul>
          </Section>

          <Section title="3) Content & Conduct We Don’t Allow">
            <ul className="list-disc pl-5 space-y-1">
              <li>Adult/sexual content, requests for pics, or romantic pressure.</li>
              <li>Spam, misleading links, fake giveaways, or phishing.</li>
              <li>Hate speech, illegal activity, or promotion of self‑harm.</li>
              <li>Buying/selling accounts or using automation/bots.</li>
            </ul>
          </Section>

          <Section title="4) Privacy Policy (Short)">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                We collect basic profile data (name, age range, photos), app usage, and optional
                location (city/township) to improve matches and safety.
              </li>
              <li>
                Your precise GPS is not shown to others; only a city/township label may be shown.
              </li>
              <li>
                We don’t sell your personal data. We may use trusted providers to run the app (e.g.,
                storage/analytics) under confidentiality.
              </li>
              <li>You can request to download or delete your data via Settings.</li>
            </ul>
          </Section>

          <Section title="5) Cookies & Local Storage">
            <ul className="list-disc pl-5 space-y-1">
              <li>We use cookies/local storage to keep you signed in and remember preferences.</li>
              <li>You can clear them in your browser, but some features may stop working.</li>
            </ul>
          </Section>

          <Section title="6) Location Use">
            <ul className="list-disc pl-5 space-y-1">
              <li>Location is optional. If enabled, we convert GPS to city/township only.</li>
              <li>You can turn location off anytime in your device settings.</li>
            </ul>
          </Section>

          <Section title="7) Accounts, Moderation & Enforcement">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                We may remove content, restrict features, or suspend accounts that break these rules.
              </li>
              <li>Repeated or serious violations may lead to permanent bans.</li>
              <li>Appeals can be submitted via Support in the app.</li>
            </ul>
          </Section>

          <Section title="8) Contact & Reporting">
            <ul className="list-disc pl-5 space-y-1">
              <li>Use the in‑app Report/Block tools on any profile or message.</li>
              <li>For urgent safety concerns, contact local authorities first.</li>
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
            <span className="text-sm text-white/90">
              I’ve read and agree to the Terms, Privacy, Cookies, and Safety rules above. I will use
              MyanMatch respectfully. 
              <p>MyanMatch ရဲ့စည်းမျဉ်းစည်းကမ်းများကိုသဘောတူပါသည်ဟု အမှန်ခြစ်ပေးပါ</p>
            </span>
          </label>

          <button
            onClick={() => {
              if (!agree) return;
              setProfileData((prev) => ({ ...prev, agreedToTerms: true }));
              navigate("/onboarding/language");
            }}
            disabled={!agree}
            className={`w-full rounded-full py-4 text-lg font-semibold shadow-lg transition
              ${
                agree
                  ? "bg-gradient-to-r from-pink-500 to-purple-500 active:scale-[0.99]"
                  : "bg-white/20 text-white/60 cursor-not-allowed"
              }`}
          >
            Agree & Continue
          </button>

          <p className="text-xs text-white/55 text-center">
            Note: This summary is for users’ clarity. By continuing, you accept the full Terms and
            Policies as described above.
          </p>
        </div>
      </div>
    </div>
  );
}
