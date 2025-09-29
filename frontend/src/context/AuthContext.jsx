// src/context/AuthContext.jsx

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true); // For initial auth check ONLY
  const [isRefreshing, setIsRefreshing] = useState(false);

    // 🔍 ADD DEBUG EFFECT HERE - RIGHT AFTER YOUR STATES
  useEffect(() => {
    console.log("🔄 AuthContext State Update:", {
      loading,
      user: user ? `User(${user.email})` : null,
      profile: profile ? `Profile(${profile.username})` : null,
      session: session ? "Session(exists)" : null
    });
  }, [loading, user, profile, session]); // 👈 ADD THIS WHOLE USEEFFECT

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
      console.error("⛔️ DATABASE ERROR in fetchProfile:", error);
      console.error("Error fetching profile:", error);
      return null;
    }
  }, []);

    useEffect(() => {
    // 1. Set loading to true immediately. We are now checking for a session.
    setLoading(true);

    // 2. onAuthStateChange is the single source of truth.
    //    It runs ONCE on load with the session from storage, and then
    //    again whenever the user logs in or out.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          const currentUser = session?.user ?? null;
          setSession(session ?? null);
          setUser(currentUser);
          
          if (currentUser) {
            // If there's a user, fetch their profile from the database
            console.log(`⏳ Attempting to fetch profile for user: ${currentUser.id}`);
            const fetchedProfile = await fetchProfile(currentUser);
            console.log("✅ Profile fetch completed. Profile data:", fetchedProfile);
            setProfile(fetchedProfile);

            // Your caching logic is good, we'll keep it
            if (fetchedProfile) {
              const cache = {
                id: fetchedProfile.user_id,
                user_id: fetchedProfile.user_id,
                username: fetchedProfile.username,
                first_name: fetchedProfile.first_name,
                last_name: fetchedProfile.last_name,
                avatar_url: fetchedProfile.avatar_url,
                onboarding_complete: !!fetchedProfile.onboarding_complete,
                is_admin: !!fetchedProfile.is_admin,
                verified:
                  !!currentUser.email_confirmed_at ||
                  (currentUser.email && !currentUser.email.endsWith("@myanmatch.user")),
              };
              localStorage.setItem("myanmatch_user", JSON.stringify(cache));
            } else {
              localStorage.removeItem("myanmatch_user");
            }
          } else {
            // If there is no user, clear the profile and cache
            setProfile(null);
            localStorage.removeItem("myanmatch_user");
          }
        } catch (error) {
          console.error("Error in onAuthStateChange:", error);
        } finally {
          // 3. IMPORTANT: Set loading to false only AFTER the entire
          //    process is complete. This fixes the race condition.
          setLoading(false);
        }
      }
    );

    // 4. Cleanup the listener when the component is no longer on screen
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);
  
  // [!START OF FIX 1!]
  const refreshProfile = useCallback(async () => {
    if (user) {
      // Use the new isRefreshing state, not the global loading state
      setIsRefreshing(true);
      const refreshed = await fetchProfile(user);
      setProfile(refreshed);
      setIsRefreshing(false);
    }
  }, [user, fetchProfile]);
  // [!END OF FIX 1!]

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
    isRefreshing, // [!ADD!] Expose the new state
    refreshProfile,
    silentRefreshProfile,
    // [!START OF FIX 2!]
    signOut: () => {
      // This is the primary fix for the logout freeze.
      // It clears React state synchronously with local storage to prevent a race condition.
      localStorage.removeItem("myanmatch_user");
      localStorage.removeItem("onboardingProfile"); 
      setSession(null);
      setUser(null);
      setProfile(null);
      return supabase.auth.signOut();
    },
    // [!END OF FIX 2!]
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