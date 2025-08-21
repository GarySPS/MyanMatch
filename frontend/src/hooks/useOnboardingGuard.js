import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient"; // Update path if needed

export default function useOnboardingGuard() {
  const navigate = useNavigate();

  useEffect(() => {
    async function checkUserOnboarding() {
      const user = JSON.parse(localStorage.getItem("myanmatch_user"));
      if (!user || !user.id) {
        navigate("/SignInPage", { replace: true });
        return;
      }
      if (user.verified === false) {
        navigate("/VerifyCodePage", { state: { email: user.email }, replace: true });
        return;
      }

      // Always trust DB, not local user!
      const userId = user.id || user.user_id;
      let data, error;
      try {
        const result = await supabase
          .from("profiles")
          .select("onboarding_complete")
          .eq("user_id", userId)
          .single();
        data = result.data;
        error = result.error;
      } catch {
        data = null;
        error = true;
      }

      // Always route to /onboarding/terms if profile missing or not onboarded
      if (error || !data || !data.onboarding_complete) {
        navigate("/onboarding/terms", { replace: true });
        return;
      }
      // If we reach here, user is good—let the page load!
    }

    checkUserOnboarding();
  }, [navigate]);
}
