import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useOnboarding } from "../../context/OnboardingContext";
import { useI18n } from "../../i18n";
import { useAuth } from "../../context/AuthContext";

const SLOT_COUNT = 6;

function isVideoType(type) {
  return type?.startsWith("video/");
}

// This is the essential data cleaning logic. It prepares all the data from onboarding to be saved correctly.
function buildFinalPayload(profileDataFromContext, mediaUrls, mediaPaths) {
  const payload = { ...profileDataFromContext };

  // Add media data
  payload.media = mediaUrls;
  payload.media_paths = mediaPaths;
  payload.avatar_url = mediaUrls[0] || null;
  payload.avatar_path = mediaPaths[0] || null;
  payload.avatar_index = 0;

  // Clean and format data for the database
  if (payload.birthdate) {
    try {
      const d = new Date(payload.birthdate);
      if (!isNaN(d)) {
        payload.birthdate = d.toISOString().slice(0, 10);
      } else {
        payload.birthdate = null;
      }
    } catch {
      payload.birthdate = null;
    }
  }

  // Ensure arrays are arrays
  const arrayKeys = ["interested_in", "ethnicity", "family_plans", "religion", "schools", "prompts"];
  arrayKeys.forEach(key => {
    if (payload[key] && !Array.isArray(payload[key])) {
      payload[key] = [payload[key]];
    }
  });

  // Set final flags
  payload.onboarding_complete = true;
  payload.updated_at = new Date().toISOString();

  return payload;
}


export default function OnboardingMediaPage() {
  const navigate = useNavigate();
  const { profileData } = useOnboarding();
  const { t } = useI18n();
  const { user, refreshProfile } = useAuth();
  const uid = user?.id;

  const [files, setFiles] = useState(Array(SLOT_COUNT).fill(null));
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleFileChange = async (index, event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingIndex(index);

    if (!uid) {
      alert(t("media.err.signInAgain"));
      setUploadingIndex(null);
      navigate("/SignInPage");
      return;
    }

    const prevItem = files[index];
    if (prevItem?.path) {
      try { await supabase.storage.from("media").remove([prevItem.path]); } catch {}
    }

    const ext = (file.name.split(".").pop() || "bin").toLowerCase();
    const filePath = `${uid}/media/${Date.now()}_${index}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(filePath, file, { cacheControl: "3600", upsert: true });

    if (uploadError) {
      alert(t("media.err.uploadFailed") + ": " + uploadError.message);
      setUploadingIndex(null);
      return;
    }

    const { data: urlData } = supabase.storage.from("media").getPublicUrl(filePath);

    const updated = [...files];
    updated[index] = {
      file,
      url: urlData?.publicUrl || "",
      path: filePath,
      isVideo: isVideoType(file.type),
    };
    setFiles(updated);
    setUploadingIndex(null);
  };

  const handleRemove = async (index) => {
    const prevItem = files[index];
    if (prevItem?.path) {
      try { await supabase.storage.from("media").remove([prevItem.path]); } catch {}
    }
    const updated = [...files];
    updated[index] = null;
    setFiles(updated);
  };

  const handleFinishOnboarding = async () => {
    const ready = files.filter((f) => f).length >= 1;
    if (!ready || isSaving || !uid) return;
    setIsSaving(true);

    try {
      const urls = files.map((f) => f?.url).filter(Boolean);
      const paths = files.map((f) => f?.path).filter(Boolean);

      const finalProfileData = buildFinalPayload(profileData, urls, paths);
      
      const { error } = await supabase
        .from("profiles")
        .update(finalProfileData)
        .eq("user_id", uid)
        .select();
      
      if (error) throw error;

      await refreshProfile();
      
      navigate("/onboarding/finish", { replace: true });

    } catch (error) {
      console.error("Failed to save final profile:", error);
      alert("There was an error saving your profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const ready = files.filter((f) => f).length >= 1;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#ffe6fa] via-white to-[#fff5fa] px-4 pt-10 pb-24">
      <div className="flex items-center mb-3 mt-2">
        <div className="rounded-full bg-[#6e2263] text-white p-2 shadow-lg mr-2">
          <svg width={24} height={24} fill="none" aria-hidden="true">
            <path d="M5 12h14M12 5v14" stroke="currentColor" strokeWidth={2} />
          </svg>
        </div>
        <span className="text-xl font-bold text-[#82144d]">{t("media.title")}</span>
      </div>
      <div className="mb-3 text-gray-500 text-sm">
        {t("media.subtitle")}<br />
        <span className="text-[#a55596] font-medium">{t("media.subtitleNote")}</span>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-2">
        {files.map((item, idx) => (
          <div
            key={idx}
            className={`relative w-full aspect-square rounded-2xl shadow-md border-2 border-dashed ${item ? "border-[#a55596] bg-[#fff0fa]" : "border-gray-200 bg-white/90"} flex items-center justify-center transition-all duration-150 hover:shadow-lg group`}
          >
            {uploadingIndex === idx ? (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10 rounded-2xl">
                <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[#6e2263] border-b-4 border-[#ffc2ee] mb-2"></div>
                <span className="text-white font-semibold text-sm">{t("media.uploading")}</span>
              </div>
            ) : item ? (
              <>
                {item.isVideo ? (
                  <video src={item.url} className="w-full h-full object-cover rounded-2xl" controls />
                ) : (
                  <img src={item.url} alt="media" className="w-full h-full object-cover rounded-2xl" />
                )}
                <button className="absolute top-2 right-2 bg-white/90 rounded-full px-2 py-1 text-base text-red-500 shadow hover:bg-red-100" onClick={() => handleRemove(idx)} aria-label={t("media.remove")} type="button">
                  ✕
                </button>
              </>
            ) : (
              <label className="flex flex-col items-center cursor-pointer w-full h-full justify-center group-hover:scale-105 transition-all">
                <input type="file" accept="image/*,video/*" onChange={(e) => handleFileChange(idx, e)} className="hidden" />
                <div className="flex flex-col items-center">
                  <svg width={38} height={38} fill="none" aria-hidden="true">
                    <rect width="100%" height="100%" rx={14} fill="#fae7f6" />
                    <path d="M19 26v-7M15 22l4-4 4 4" stroke="#a55596" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    <rect x={11} y={11} width={16} height={16} rx={5} stroke="#a55596" strokeWidth={2} />
                  </svg>
                  <span className="text-[#a55596] text-xl font-bold mt-1">+</span>
                </div>
                <span className="text-[#a55596] text-xs mt-2">{t("media.add")}</span>
              </label>
            )}
          </div>
        ))}
      </div>
      <div className="text-xs text-gray-400 mb-4 mt-2 text-center">{t("media.requiredNote", { count: 1 })}</div>
      <div className="flex items-center gap-2 bg-[#fae7f6] rounded-xl p-3 mb-8 shadow-sm border border-[#ffe6fa]">
        <span role="img" aria-label="bulb" className="text-yellow-400 text-xl">💡</span>
        <span className="text-sm text-[#82144d]">
          {t("media.tip")}{" "}
          <a href="#" className="text-[#a55596] underline font-medium">{t("media.tipLink")}</a>.
        </span>
      </div>
      <button
        className={`fixed bottom-6 right-6 bg-gradient-to-r from-[#a55596] to-[#82144d] rounded-full w-16 h-16 flex items-center justify-center shadow-2xl transition ${ready && !isSaving ? "hover:scale-110 active:scale-95" : "opacity-40 pointer-events-none"} ${isSaving ? 'animate-pulse' : ''}`}
        disabled={!ready || isSaving}
        onClick={handleFinishOnboarding}
        aria-label={t("media.nextAria")}
        type="button"
      >
        {isSaving ? (
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
        ) : (
          <svg width={36} height={36} fill="none" aria-hidden="true">
            <circle cx="18" cy="18" r="18" fill="#fff" fillOpacity="0.13" />
            <path d="M13 18h10M19 14l4 4-4 4" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    </div>
  );
}