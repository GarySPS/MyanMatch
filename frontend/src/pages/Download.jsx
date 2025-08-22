// src/pages/Download.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// 👉 Replace these with your own images later
import step1 from "../assets/ios-step1.png"; // share button
import step2 from "../assets/ios-step2.png"; // Add to Home Screen
import step3 from "../assets/ios-step3.png"; // confirm Add

export default function DownloadPage() {
  const navigate = useNavigate();

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [msg, setMsg] = useState("");

  // detect installed (PWA standalone)
  useEffect(() => {
    const checkInstalled = () => {
      const standalone =
        window.matchMedia?.("(display-mode: standalone)")?.matches ||
        window.navigator.standalone === true;
      setIsInstalled(!!standalone);
    };
    checkInstalled();
    window.addEventListener("appinstalled", checkInstalled);
    return () => window.removeEventListener("appinstalled", checkInstalled);
  }, []);

  // capture install prompt on Android/Chrome
  useEffect(() => {
    const onBIP = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  async function handleAndroidInstall() {
    setMsg("");
    if (isInstalled) {
      setMsg("✅ Already installed on this device.");
      return;
    }
    if (!deferredPrompt) {
      setMsg(
        "If nothing happens, please open in Chrome on Android or add to Home Screen from the browser menu."
      );
      return;
    }
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setMsg("📲 Installing… check your home screen.");
      } else {
        setMsg("You dismissed the install. You can try again anytime.");
      }
      setDeferredPrompt(null);
    } catch (e) {
      setMsg("Install failed. Please try again.");
    }
  }

  return (
    <div className="relative min-h-dvh w-full text-white overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#201033] via-[#120f1f] to-[#0a0a12]" />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute -top-24 -left-28 w-[22rem] h-[22rem] rounded-full bg-fuchsia-500/25 blur-[110px]" />
        <div className="absolute -bottom-32 -right-24 w-[24rem] h-[24rem] rounded-full bg-violet-500/25 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/5 backdrop-blur border-b border-white/10">
        <div className="px-4 h-[56px] flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-3 py-1.5 rounded-full hover:bg-white/10"
            type="button"
          >
            ←
          </button>
          <h1 className="text-lg font-extrabold tracking-tight">Download MyanMatch</h1>
        </div>
      </header>

      <main className="px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+96px)] space-y-6">

        {/* ANDROID */}
        <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur shadow p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl" aria-hidden>🤖</span>
            <h2 className="text-xl font-extrabold">Android</h2>
          </div>

          <p className="text-white/80 text-sm mb-4">
            Install the app to your home screen for the best experience.
          </p>

          <button
            onClick={handleAndroidInstall}
            type="button"
            className="w-full rounded-full px-5 py-3 text-sm font-bold bg-[#FFD84D] text-black hover:opacity-90"
          >
            {isInstalled ? "Already installed" : "Install on Android"}
          </button>

          {msg && (
            <div className="mt-3 text-xs text-white/80">
              {msg}
            </div>
          )}

          <div className="mt-4 text-[12px] text-white/60">
            Tip: Use Chrome on Android. If the button doesn’t appear, open the ⋮ menu and tap
            <span className="font-semibold"> “Install app”</span> or
            <span className="font-semibold"> “Add to Home screen”</span>.
          </div>
        </section>

        {/* IOS */}
        <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur shadow p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl" aria-hidden>🍎</span>
            <h2 className="text-xl font-extrabold">iOS (iPhone)</h2>
          </div>

          <p className="text-white/80 text-sm mb-4">
            Install from Safari using “Add to Home Screen”.
          </p>

          <ol className="space-y-4">
            <li className="rounded-2xl overflow-hidden border border-white/10 bg-white/5">
              <img src={step1} alt="Tap the Share button in Safari" className="w-full object-cover" />
              <div className="p-3 text-sm">1) In Safari, tap the <strong>Share</strong> button.</div>
            </li>
            <li className="rounded-2xl overflow-hidden border border-white/10 bg-white/5">
              <img src={step2} alt="Choose Add to Home Screen" className="w-full object-cover" />
              <div className="p-3 text-sm">2) Choose <strong>Add to Home Screen</strong>.</div>
            </li>
            <li className="rounded-2xl overflow-hidden border border-white/10 bg-white/5">
              <img src={step3} alt="Confirm Add" className="w-full object-cover" />
              <div className="p-3 text-sm">3) Tap <strong>Add</strong> to finish.</div>
            </li>
          </ol>

          <div className="mt-4 text-[12px] text-white/60">
            Note: iOS installs PWAs from Safari. Open MyanMatch in Safari if you’re using another browser.
          </div>
        </section>
      </main>
    </div>
  );
}
