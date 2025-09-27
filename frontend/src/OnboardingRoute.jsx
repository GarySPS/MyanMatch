// src/OnboardingRoute.jsx (Corrected)

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

export default function OnboardingRoute({ children }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Return null ONLY while the initial auth check is running.
    return null;
  }

  if (!user) {
    // If the user isn't logged in at all, send them to the sign-in page.
    return <Navigate to="/SignInPage" state={{ from: location }} replace />;
  }

  // This check is now safer and handles the case where profile might be null.
  if (profile && profile.onboarding_complete) {
    // If the user somehow lands here but has already finished onboarding,
    // send them to the main app page.
    return <Navigate to="/HomePage" replace />;
  }

  // If the user is logged in and hasn't completed onboarding, render the onboarding page.
  return children;
}