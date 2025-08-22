// src/pages/Download.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../i18n";

export default function DownloadPage() {
  const navigate = useNavigate();
  const { t } = useI18n();

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
      setMsg(t("download.msg.alreadyInstalled"));
      return;
    }
    if (!deferredPrompt) {
      setMsg(t("download.msg.noPrompt"));
      return;
    }
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setMsg(t("download.msg.installing"));
      } else {
        setMsg(t("download.msg.dismissed"));
      }
      setDeferredPrompt(null);
    } catch {
      setMsg(t("download.msg.failed"));
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
            aria-label={t("common.back")}
          >
            ←
          </button>
          <h1 className="text-lg font-extrabold tracking-tight">
            {t("download.title")}
          </h1>
        </div>
      </header>

      <main className="px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+96px)] space-y-6">
        {/* ANDROID */}
        <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur shadow p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl" aria-hidden>
              🤖
            </span>
            <h2 className="text-xl font-extrabold">{t("download.android")}</h2>
          </div>

          <p className="text-white/80 text-sm mb-4">
            {t("download.androidDesc")}
          </p>

          <button
            onClick={handleAndroidInstall}
            type="button"
            className="w-full rounded-full px-5 py-3 text-sm font-bold bg-[#FFD84D] text-black hover:opacity-90"
          >
            {isInstalled ? t("download.already") : t("download.installAndroid")}
          </button>

          {msg && <div className="mt-3 text-xs text-white/80">{msg}</div>}

          <div className="mt-4 text-[12px] text-white/60">
            {t("download.androidTip")}
          </div>
        </section>

        {/* IOS */}
        <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur shadow p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl" aria-hidden>
              🍎
            </span>
            <h2 className="text-xl font-extrabold">{t("download.ios")}</h2>
          </div>

          <p className="text-white/80 text-sm mb-4">{t("download.iosDesc")}</p>

          <ol className="space-y-4">
            <li className="rounded-2xl overflow-hidden border border-white/10 bg-white/5">
              <img
                src="/assets/ios-step1.png"
                alt={t("download.alt.share")}
                className="w-full object-cover"
              />
              <div className="p-3 text-sm">{t("download.iosStep1")}</div>
            </li>
            <li className="rounded-2xl overflow-hidden border border-white/10 bg-white/5">
              <img
                src="/assets/ios-step2.png"
                alt={t("download.alt.addToHome")}
                className="w-full object-cover"
              />
              <div className="p-3 text-sm">{t("download.iosStep2")}</div>
            </li>
            <li className="rounded-2xl overflow-hidden border border-white/10 bg-white/5">
              <img
                src="/assets/ios-step3.png"
                alt={t("download.alt.confirmAdd")}
                className="w-full object-cover"
              />
              <div className="p-3 text-sm">{t("download.iosStep3")}</div>
            </li>
          </ol>

          <div className="mt-4 text-[12px] text-white/60">
            {t("download.iosNote")}
          </div>
        </section>
      </main>
    </div>
  );
}
