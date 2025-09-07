// src/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

export default function ProtectedRoute({ children }) {
  // 1. Get live auth state from our context. This part is correct.
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // 2. While the context is loading, show nothing. This is correct.
  if (loading) {
    return null; 
  }

  // 3. If loading is done and there's no user, redirect to sign-in. This is correct.
  if (!user) {
    return <Navigate to="/SignInPage" state={{ from: location }} replace />;
  }
  
  // [!CRITICAL FIX!]
  // 4. If the user is logged in, but their profile either doesn't exist yet OR
  // it exists but onboarding is not complete, send them to the start of the flow.
  if (!profile || !profile.onboarding_complete) {
    return <Navigate to="/onboarding/terms" replace />;
  }

  // 5. If all checks pass, render the protected page. This is correct.
  return children;
}