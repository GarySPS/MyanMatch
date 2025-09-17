// src/OnboardingRoute.jsx

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

export default function OnboardingRoute({ children }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // 1. While the context is loading, show nothing.
  if (loading) {
    return null;
  }

  // 2. If loading is done and there is NO user, they cannot be here. Send to sign-in.
  if (!user) {
    return <Navigate to="/SignInPage" state={{ from: location }} replace />;
  }
  
  // 3. [!CRITICAL FIX!]
  // If the user is present but the profile is still loading,
  // continue to show nothing. This prevents rendering the page with incomplete data.
  if (!profile) {
    return null;
  }

  // 4. If the profile IS loaded and onboarding is complete, they cannot go back.
  // Send them to the main app homepage.
  if (profile.onboarding_complete) {
    return <Navigate to="/HomePage" replace />;
  }

  // 5. If all checks pass (loading is done, user and profile exist, onboarding is NOT complete),
  // then it is safe to show the onboarding page.
  return children;
}