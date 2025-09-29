// src/ProtectedRoute.jsx

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useState, useEffect } from "react"; // [!ADD!]

export default function ProtectedRoute({ children }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const [mounted, setMounted] = useState(false); // [!ADD!]

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

    // 🔍 ADD THIS DEBUG - RIGHT BEFORE YOUR DECISION LOGIC
  console.log("🛡️ ProtectedRoute Debug:", {
    path: location.pathname,
    loading,
    user: !!user,
    profile: !!profile,
    mounted,
    onboardingComplete: profile?.onboarding_complete
  });

  // --- Start of Debugging Logs ---
  console.log("--- ProtectedRoute ---");
  console.log("Path:", location.pathname);
  console.log("Auth Loading:", loading);
  console.log("User Exists:", !!user);
  console.log("Profile Exists:", !!profile);
  if (profile) {
    console.log("Onboarding Complete:", profile.onboarding_complete);
  }
  // --- End of Debugging Logs ---

  // [!FIX!] Show loading spinner instead of null
  if (loading || !mounted) {
    console.log("ProtectedRoute Decision: Show loading (auth is loading)");
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    console.log("ProtectedRoute Decision: Redirect to /SignInPage (no user)");
    return <Navigate to="/SignInPage" state={{ from: location }} replace />;
  }

  // [!CRITICAL FIX!] Handle profile loading properly
  if (!profile) {
    console.log("ProtectedRoute Decision: Show loading (profile not loaded)");
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!profile.onboarding_complete) {
    console.log("ProtectedRoute Decision: Redirect to /onboarding/terms (onboarding not complete)");
    return <Navigate to="/onboarding/terms" replace />;
  }

  console.log("ProtectedRoute Decision: Rendering protected page");
  return children;
}