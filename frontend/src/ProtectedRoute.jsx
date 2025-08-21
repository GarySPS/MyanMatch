import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [allow, setAllow] = useState(false);
  const [redirect, setRedirect] = useState(null);

  useEffect(() => {
    async function check() {
      const user = JSON.parse(localStorage.getItem("myanmatch_user") || "null");
      if (!user || !user.id) {
        setRedirect("/SignInPage");
        setLoading(false);
        return;
      }
      if (!user.verified) {
        setRedirect("/VerifyCodePage");
        setLoading(false);
        return;
      }
      // Always check onboarding_complete from profiles table
      const userId = user.id;
      const { data, error } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("user_id", userId)
        .single();
      if (error || !data || !data.onboarding_complete) {
        setRedirect("/onboarding/terms");
        setLoading(false);
        return;
      }
      setAllow(true);
      setLoading(false);
    }
    check();
  }, []);

  if (loading) return null;
  if (redirect) return <Navigate to={redirect} replace />;
  return children;
}
