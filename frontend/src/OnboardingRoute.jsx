// src/OnboardingRoute.jsx

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

export default function OnboardingRoute({ children }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // --- Start of Debugging Logs ---
  console.log("--- OnboardingRoute ---");
  console.log("Path:", location.pathname);
  console.log("Auth Loading:", loading);
  console.log("User Exists:", !!user);
  console.log("Profile Exists:", !!profile);
  if (profile) {
    console.log("Onboarding Complete:", profile.onboarding_complete);
  }
  // --- End of Debugging Logs ---

  if (loading) {
    console.log("OnboardingRoute Decision: Return NULL (auth is loading)");
    return null;
  }
  if (!user) {
    console.log("OnboardingRoute Decision: Redirect to /SignInPage (no user)");
    return <Navigate to="/SignInPage" state={{ from: location }} replace />;
  }
  if (!profile) {
    console.log("OnboardingRoute Decision: Return NULL (profile not loaded yet)");
    return null;
  }
  if (profile.onboarding_complete) {
    console.log("OnboardingRoute Decision: Redirect to /HomePage (onboarding is complete)");
    return <Navigate to="/HomePage" replace />;
  }

  console.log("OnboardingRoute Decision: Rendering onboarding page");
  return children;
}