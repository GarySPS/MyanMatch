import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

export default function OnboardingRoute({ children }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null; // Show nothing while checking authentication
  }

  // If NO user is logged in, they cannot be on an onboarding page.
  // Send them to the sign-in page.
  if (!user) {
    return <Navigate to="/SignInPage" state={{ from: location }} replace />;
  }
  
  // If a user IS logged in and HAS finished onboarding,
  // they cannot go back to the onboarding pages. Send them to the main app.
  if (profile && profile.onboarding_complete) {
    return <Navigate to="/HomePage" replace />;
  }

  // If the user is logged in AND has NOT finished onboarding, let them see the page.
  return children;
}