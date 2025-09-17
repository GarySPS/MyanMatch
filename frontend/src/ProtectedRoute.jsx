// src/ProtectedRoute.jsx

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

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

  if (loading) {
    console.log("ProtectedRoute Decision: Return NULL (auth is loading)");
    return null; 
  }
  if (!user) {
    console.log("ProtectedRoute Decision: Redirect to /SignInPage (no user)");
    return <Navigate to="/SignInPage" state={{ from: location }} replace />;
  }
  if (!profile || !profile.onboarding_complete) {
    console.log("ProtectedRoute Decision: Redirect to /onboarding/terms (onboarding not complete)");
    return <Navigate to="/onboarding/terms" replace />;
  }

  console.log("ProtectedRoute Decision: Rendering protected page");
  return children;
}