// src/pages/Onboarding/FinishPage.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useOnboarding } from "../../context/OnboardingContext";
import { useAuth } from "../../context/AuthContext";

// This helper function cleans and formats all data to match the database schema.
function buildPayload(profileData) {
    const payload = { ...profileData };

    // --- Ensure all required fields exist ---
    payload.agreedToTerms = true;
    payload.onboarding_complete = true;
    payload.updated_at = new Date().toISOString();

    // --- Format Date ---
    if (payload.birthdate) {
        try {
            payload.birthdate = new Date(payload.birthdate).toISOString().slice(0, 10);
        } catch {
            payload.birthdate = null;
        }
    }

    // --- Ensure Array Fields are Arrays ---
    const arrayFields = ['interested_in', 'ethnicity', 'family_plans', 'religion', 'schools', 'prompts', 'media', 'media_paths'];
    for (const field of arrayFields) {
        if (payload[field] && !Array.isArray(payload[field])) {
            payload[field] = [payload[field]];
        }
    }
    
    // Remove temporary voice prompt file data before saving to DB
    if (payload.voicePrompt?.file) {
        delete payload.voicePrompt.file;
        delete payload.voicePrompt.audioBlob;
    }

    return payload;
}

// --- API Helper ---
function apiUrl(path = "") {
    const base = String(import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");
    const p = String(path || "").replace(/^\/+/, "");
    return `${base}/${p}`;
}

export default function FinishPage() {
    const navigate = useNavigate();
    const { profileData, resetProfileData } = useOnboarding(); 
    const { session, user, refreshProfile } = useAuth(); 
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const handleFinish = async () => {
        if (saving || !user?.id || !session) return;
        setSaving(true);
        setError("");

        try {
            // Start with all the data from the context
            const payload = { ...profileData };

            // --- Step 1: Handle Voice Prompt Upload (if it exists) ---
            const vp = payload.voicePrompt;
            if (vp?.file && vp?.prompt) {
                const formData = new FormData();
                formData.append("user_id", user.id);
                formData.append("prompt", vp.prompt);
                formData.append("duration", vp.duration ?? 0);
                formData.append("file", vp.file, `voice-prompt.${vp.file.type.split('/')[1] || 'webm'}`);
                
                const response = await fetch(apiUrl("voice/onboarding/voice"), { 
                    method: "POST", 
                    headers: { 'Authorization': `Bearer ${session.access_token}` },
                    body: formData,
                });

                if (!response.ok) throw new Error("Voice prompt upload failed.");
                
                const voiceData = await response.json();
                payload.voicePrompt = voiceData; // Replace temporary data with final URLs/paths
            } else if (!vp?.url) {
                // If user skipped or didn't record, ensure it's set to null
                payload.voicePrompt = null;
            }

            // --- Step 2: Clean and Format All Data ---
            const finalPayload = buildPayload(payload);

            // --- Step 3: Save Everything to Supabase ---
            const { error: dbErr } = await supabase
                .from("user_profiles")
                .update(finalPayload)
                .eq("user_id", user.id);

            if (dbErr) throw dbErr;

            // --- Step 4: Finalize Session ---
            await refreshProfile(); // Update the global auth state with the completed profile
            resetProfileData();   // Clear the temporary onboarding data from localStorage

            // --- Step 5: Navigate to the main app ---
            navigate("/HomePage", { replace: true });

        } catch (e) {
            console.error("Failed to finish onboarding:", e);
            setError(e.message || "An unexpected error occurred. Please try again.");
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col justify-between bg-[#82142d] relative overflow-hidden">
            {/* ... (Your existing JSX for the welcome message is perfect, no changes needed there) ... */}
            <div className="flex-1 flex flex-col items-center justify-center z-10 px-4">
               <div className="bg-white/95 border border-[#f7d2ef] rounded-3xl shadow-2xl px-7 py-10 w-full max-w-md flex flex-col items-center card-animate">
                   <div className="w-24 h-24 md:w-28 md:h-28 mb-2 animate-bounce-slow">
                       <img src="/images/bubble.png" alt="Mascot" className="w-full h-full object-contain" style={{ filter: "drop-shadow(0 2px 16px rgba(120,0,120,0.13))" }} draggable={false} />
                   </div>
                   <h1 className="text-3xl font-bold logo-hinge mb-2 text-center leading-tight drop-shadow-lg tracking-tight">
                       Welcome to <span className="text-[#cf60ed]">MyanMatch!</span>
                   </h1>
                   <div className="mb-5">
                       <p className="text-base text-[#a259c3] text-center font-medium prompt-hinge">
                           Your profile is ready!<br />
                           Click below to start matching.
                       </p>
                   </div>
                   {error && <div className="text-red-600 bg-red-100 border border-red-300 p-3 rounded-lg text-sm">{error}</div>}
               </div>
            </div>

            {/* MODIFIED BUTTON to call the save function */}
            <button
                className={`w-full py-5 font-bold text-lg shadow-xl tracking-wide transition duration-150 rounded-t-3xl button-glow ${saving ? "bg-gray-500" : "bg-gradient-to-r from-[#cf60ed] to-[#a259c3] hover:opacity-90"} text-white`}
                onClick={handleFinish}
                disabled={saving}
            >
                {saving ? "Finalizing Profile..." : "Start Matching"}
            </button>
        </div>
    );
}