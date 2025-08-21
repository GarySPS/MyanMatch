import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useOnboarding } from "../../context/OnboardingContext";
import { useI18n } from "../../i18n";

function getLocalUserId() {
  try {
    const u = JSON.parse(localStorage.getItem("myanmatch_user"));
    return u?.id || null;
  } catch {
    return null;
  }
}

const SLOT_COUNT = 6;

function isVideoType(type) {
  return type?.startsWith("video/");
}

export default function OnboardingMediaPage() {
  const navigate = useNavigate();
  const { setProfileData } = useOnboarding();
  const { t } = useI18n();

  const [files, setFiles] = useState(Array(SLOT_COUNT).fill(null));
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const userId = getLocalUserId();

  useEffect(() => {
    if (!userId) {
      alert(t("media.err.signInFirst"));
      navigate("/SignInPage");
    }
  }, [navigate, userId, t]);

  const handleFileChange = async (index, event) => {
    const file = event.target.files[0];
    if (!file || !userId) {
      alert(t("media.err.signInAgain"));
      return;
    }

    setUploadingIndex(index);

    // DELETE previous photo if exists
    const prevItem = files[index];
    if (prevItem?.path) {
      try { await supabase.storage.from("media").remove([prevItem.path]); } catch {}
    }

    // Upload new file
    const ext = (file.name.split(".").pop() || "bin").toLowerCase();
    const filePath = `${userId}/onboarding/${Date.now()}_${index}.${ext}`;

    const { error } = await supabase.storage
      .from("media")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      alert(t("media.err.uploadFailed") + ": " + error.message);
      setUploadingIndex(null);
      return;
    }

    const { data: urlData } = await supabase.storage
      .from("media")
      .createSignedUrl(filePath, 60 * 60 * 24 * 7);

    const updated = [...files];
    updated[index] = {
      file,
      url: urlData?.signedUrl || "",
      path: filePath,
      isVideo: isVideoType(file.type),
    };
    setFiles(updated);
    setUploadingIndex(null);
  };

  // Remove file
  const handleRemove = async (index) => {
    const prevItem = files[index];
    if (prevItem?.path) {
      try { await supabase.storage.from("media").remove([prevItem.path]); } catch {}
    }
    const updated = [...files];
    updated[index] = null;
    setFiles(updated);
  };

  const ready = files.filter((f) => f).length === SLOT_COUNT;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#ffe6fa] via-white to-[#fff5fa] px-4 pt-10 pb-24">
      {/* Progress Dot */}
      <div className="flex items-center mb-3 mt-2">
        <div className="rounded-full bg-[#6e2263] text-white p-2 shadow-lg mr-2">
          <svg width={24} height={24} fill="none" aria-hidden="true">
            <path d="M5 12h14M12 5v14" stroke="currentColor" strokeWidth={2} />
          </svg>
        </div>
        <span className="text-xl font-bold text-[#82144d]">
          {t("media.title")}
        </span>
      </div>

      <div className="mb-3 text-gray-500 text-sm">
        {t("media.subtitle")}<br />
        <span className="text-[#a55596] font-medium">{t("media.subtitleNote")}</span>
      </div>

      {/* Upload slots */}
      <div className="grid grid-cols-3 gap-4 mb-2">
        {files.map((item, idx) => (
          <div
            key={idx}
            className={`
              relative w-full aspect-square rounded-2xl shadow-md border-2 border-dashed 
              ${item ? "border-[#a55596] bg-[#fff0fa]" : "border-gray-200 bg-white/90"}
              flex items-center justify-center transition-all duration-150
              hover:shadow-lg group
            `}
          >
            {uploadingIndex === idx ? (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10 rounded-2xl">
                <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[#6e2263] border-b-4 border-[#ffc2ee] mb-2"></div>
                <span className="text-white font-semibold text-sm">{t("media.uploading")}</span>
              </div>
            ) : item ? (
              <>
                {item.isVideo ? (
                  <video
                    src={item.url}
                    className="w-full h-full object-cover rounded-2xl"
                    controls
                  />
                ) : (
                  <img
                    src={item.url}
                    alt="media"
                    className="w-full h-full object-cover rounded-2xl"
                  />
                )}
                <button
                  className="absolute top-2 right-2 bg-white/90 rounded-full px-2 py-1 text-base text-red-500 shadow hover:bg-red-100"
                  onClick={() => handleRemove(idx)}
                  aria-label={t("media.remove")}
                  tabIndex={0}
                  type="button"
                >
                  ✕
                </button>
              </>
            ) : (
              <label className="flex flex-col items-center cursor-pointer w-full h-full justify-center group-hover:scale-105 transition-all">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => handleFileChange(idx, e)}
                  className="hidden"
                />
                <div className="flex flex-col items-center">
                  <svg width={38} height={38} fill="none" aria-hidden="true">
                    <rect width="100%" height="100%" rx={14} fill="#fae7f6" />
                    <path
                      d="M19 26v-7M15 22l4-4 4 4"
                      stroke="#a55596"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <rect
                      x={11}
                      y={11}
                      width={16}
                      height={16}
                      rx={5}
                      stroke="#a55596"
                      strokeWidth={2}
                    />
                  </svg>
                  <span className="text-[#a55596] text-xl font-bold mt-1">+</span>
                </div>
                <span className="text-[#a55596] text-xs mt-2">{t("media.add")}</span>
              </label>
            )}
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-400 mb-4 mt-2 text-center">
        {t("media.requiredNote", { count: SLOT_COUNT })}
      </div>

      {/* Helper tip */}
      <div className="flex items-center gap-2 bg-[#fae7f6] rounded-xl p-3 mb-8 shadow-sm border border-[#ffe6fa]">
        <span role="img" aria-label="bulb" className="text-yellow-400 text-xl">💡</span>
        <span className="text-sm text-[#82144d]">
          {t("media.tip")}{" "}
          <a href="#" className="text-[#a55596] underline font-medium">
            {t("media.tipLink")}
          </a>.
        </span>
      </div>

      {/* Next button */}
      <button
        className={`
          fixed bottom-6 right-6
          bg-gradient-to-r from-[#a55596] to-[#82144d]
          rounded-full w-16 h-16 flex items-center justify-center shadow-2xl transition
          ${ready ? "hover:scale-110 active:scale-95" : "opacity-40 pointer-events-none"}
          animate-bounce
        `}
        disabled={!ready}
        onClick={() => {
          // Collect URLs and storage paths
          const urls = files.map((f) => f?.url).filter(Boolean);
          const paths = files.map((f) => f?.path).filter(Boolean);

          // Save to onboarding context so FinishPage can upsert
          setProfileData((prev) => ({
            ...prev,
            media: urls,
            media_paths: paths,
            avatar_url: urls[0] || null,   // First file = avatar
            avatar_path: paths[0] || null, // First file path
            avatar_index: 0,
          }));

          navigate("/onboarding/profile-prompts");
        }}
        aria-label={t("media.nextAria")}
        tabIndex={0}
        type="button"
      >
        <svg width={36} height={36} fill="none" aria-hidden="true">
          <circle cx="18" cy="18" r="18" fill="#fff" fillOpacity="0.13" />
          <path
            d="M13 18h10M19 14l4 4-4 4"
            stroke="#fff"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
