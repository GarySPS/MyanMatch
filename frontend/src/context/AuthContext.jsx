import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    setLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setSession(session);
        setUser(currentUser);
        
        const fetchedProfile = await fetchProfile(currentUser);
        setProfile(fetchedProfile);

        // [!CRITICAL FIX!] Add this block to keep localStorage in sync
        if (currentUser && fetchedProfile) {
          const cache = {
            id: fetchedProfile.user_id,
            user_id: fetchedProfile.user_id,
            username: fetchedProfile.username,
            first_name: fetchedProfile.first_name,
            last_name: fetchedProfile.last_name,
            avatar_url: fetchedProfile.avatar_url,
            onboarding_complete: !!fetchedProfile.onboarding_complete,
            is_admin: !!fetchedProfile.is_admin,
            verified: !!currentUser.email_confirmed_at || (currentUser.email && !currentUser.email.endsWith('@myanmatch.user')),
          };
          localStorage.setItem("myanmatch_user", JSON.stringify(cache));
        } else if (!currentUser) {
            localStorage.removeItem("myanmatch_user");
        }
        // [!END OF FIX!]

        setLoading(false);
      }
    );
    return () => subscription.unsubscribe();
  }, [fetchProfile]);
  
  const refreshProfile = useCallback(async () => {
    if (user) {
      setLoading(true);
      const refreshed = await fetchProfile(user);
      setProfile(refreshed);
      setLoading(false);
    }
  }, [user, fetchProfile]);

  const silentRefreshProfile = useCallback(async () => {
    if (user) {
      const refreshed = await fetchProfile(user);
      setProfile(refreshed);
    }
  }, [user, fetchProfile]);

  const value = {
    session,
    user,
    profile,
    loading,
    refreshProfile,
    silentRefreshProfile,
    signOut: () => {
      // Also clear local storage on sign out
      localStorage.removeItem("myanmatch_user");
      return supabase.auth.signOut();
    },
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