// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // This is the core utility to get profile data. It now returns the data.
  const fetchProfile = useCallback(async (user) => {
    if (!user) return null;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  }, []);

  // This effect manages the main auth state and the initial loading screen.
  useEffect(() => {
    setLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setSession(session);
        setUser(currentUser);
        const fetchedProfile = await fetchProfile(currentUser);
        setProfile(fetchedProfile);
        setLoading(false); // We are done with the main loading sequence.
      }
    );
    return () => subscription.unsubscribe();
  }, [fetchProfile]);
  
  // This is the "heavy" refresh for major state changes (e.g., after finishing onboarding).
  // It will show a loading screen.
  const refreshProfile = useCallback(async () => {
    if (user) {
      setLoading(true);
      const refreshed = await fetchProfile(user);
      setProfile(refreshed);
      setLoading(false);
    }
  }, [user, fetchProfile]);

  // [!NEW!] A "silent" refresh that does NOT trigger the main loading screen.
  // We will use this for background data refreshes, like on tab focus.
  const silentRefreshProfile = useCallback(async () => {
    if (user) {
      const refreshed = await fetchProfile(user);
      setProfile(refreshed); // Updates the profile without a loading flash
    }
  }, [user, fetchProfile]);

  const value = {
    session,
    user,
    profile,
    loading,
    refreshProfile,
    silentRefreshProfile, // <-- Export the new silent function
    signOut: () => supabase.auth.signOut(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};