// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // This function fetches the profile and always ensures loading is finished.
  const fetchProfile = useCallback(async (user) => {
    // If there's no user, there's no profile to fetch. We're done loading.
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      // A "PGRST116" error means no row was found. This is expected right after
      // signup before the profile is created. We treat it as a null profile.
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      setProfile(data); // Set profile to the data found, or null if it doesn't exist yet.

      // [!FIX!] Also update the legacy localStorage cache here.
      if (data) {
        const cache = {
          id: data.user_id,
          user_id: data.user_id,
          username: data.username,
          onboarding_complete: !!data.onboarding_complete,
          is_admin: !!data.is_admin,
          language: data.language,
          verified: !!user.email_confirmed_at || !user.email.endsWith('@myanmatch.user'),
        };
        localStorage.setItem("myanmatch_user", JSON.stringify(cache));
      }

    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
    } finally {
      setLoading(false); // No matter what happens, we are done loading.
    }
  }, []);


  // This effect runs once on mount and sets up the auth listener.
  useEffect(() => {
    // onAuthStateChange is the single source of truth for auth state.
    // It fires immediately with the current session, and then for any changes.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setLoading(true); // Set loading to true while we fetch the profile.
        await fetchProfile(currentUser);
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);
  
  // Function for other components to manually trigger a profile refresh.
  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      setLoading(true);
      await fetchProfile(user);
    }
  }, [user, fetchProfile]);

  const value = {
    session,
    user,
    profile,
    loading,
    refreshProfile,
    signOut: () => supabase.auth.signOut(),
  };

  // Always render children. ProtectedRoute will now handle showing/hiding content.
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};