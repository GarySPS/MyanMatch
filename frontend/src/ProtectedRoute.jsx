// The new, corrected ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

export default function ProtectedRoute({ children }) {
  // 1. Get live auth state from our context
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // 2. While the context is loading the session, show nothing.
  // This prevents a flicker from a protected page to the login page.
  if (loading) {
    return null; // Or a loading spinner component
  }

  // 3. If loading is done and there's no user, redirect to sign-in.
  // We save the page they were trying to visit so we can send them back after login.
  if (!user) {
    return <Navigate to="/SignInPage" state={{ from: location }} replace />;
  }
  
  // 4. If the user is logged in but hasn't finished onboarding, send them to the start of that flow.
  // The 'profile' object also comes from our context.
  if (profile && !profile.onboarding_complete) {
    return <Navigate to="/onboarding/terms" replace />;
  }

  // 5. If all checks pass, render the protected page.
  return children;
}