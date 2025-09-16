// src/pages/Onboarding/TermsPage.jsx

import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../context/OnboardingContext";
import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext"; // 1. ADD THIS IMPORT

export default function TermsPage() {
    const navigate = useNavigate();
    const { setProfileData } = useOnboarding();
    const { user } = useAuth(); // 2. GET USER FROM THE AUTH CONTEXT
    const uid = user?.id; // 3. GET THE USER ID FROM THE CONTEXT
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");

    async function onAgree() {
        if (!uid) {
            setErr("Could not find user. Please sign in again.");
            return;
        }
        setBusy(true);
        setErr("");

        // Also update our temporary onboarding state
        setProfileData((prev) => ({ ...prev, agreedToTerms: true }));

        // 4. FIX THE DATABASE CALL to use the correct column name
        const { error } = await supabase
            .from("profiles")
            .update({
                agreedToTerms: true,
                updated_at: new Date().toISOString(),
            })
            .eq("user_id", uid);

        if (error) {
            setErr(error.message);
            setBusy(false);
            return;
        }

        navigate("/onboarding/language");
    }

    // This is a failsafe loading state while the user object is being loaded by the context
    if (!uid) {
        return (
            <div className="min-h-screen relative flex items-center justify-center bg-[#190011]">
                {/* Optional: Add a spinner here */}
            </div>
        );
    }

    return (
        <div className="min-h-screen relative flex items-center justify-center px-6 py-10">
            {/* background */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#3a0224] via-[#2a0018] to-[#190011]" />

            <div className="relative w-full max-w-md text-white">
                <h1 className="text-3xl font-extrabold tracking-tight mb-6">
                    Terms of Service
                </h1>

                <ul className="list-disc list-inside space-y-2 mb-8 text-white/90">
                    <li>You must be at least 18 years old to use MyanMatch.</li>
                    <li>Do not use MyanMatch for any illegal activity.</li>
                    <li>Respect other users and do not harass or spam.</li>
                    <li>We may remove accounts that break the rules.</li>
                </ul>

                <p className="text-white/70 mb-10">
                    We may update these terms at any time. Please check back regularly.
                </p>

                {err && (
                    <div className="mb-4 text-red-400 text-sm">{err}</div>
                )}

                <button
                    onClick={onAgree}
                    disabled={busy}
                    className="w-full rounded-full py-4 text-lg font-semibold
                               bg-gradient-to-r from-pink-500 to-purple-500 shadow disabled:opacity-50"
                >
                    {busy ? "Saving…" : "Agree"}
                </button>
            </div>
        </div>
    );
}