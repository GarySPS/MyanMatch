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
  
  // 3. If the user IS logged in and HAS finished onboarding,
  // they cannot go back to the onboarding pages. Send them to the main app.
  if (profile && profile.onboarding_complete) {
    return <Navigate to="/HomePage" replace />;
  }

  // 4. If all checks pass (user is logged in and has NOT finished onboarding),
  // then it is safe to show the onboarding page.
  return children;
}