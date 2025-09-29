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
      console.error("Error fetching profile:", error);
      return null;
    }
  }, []);

useEffect(() => {
  let mounted = true;

  async function init() {
    try {
      setLoading(true);

      // 1) Seed state immediately on mount to avoid infinite "loading"
      const { data: sessionData, error: sessErr } = await supabase.auth.getSession();
      if (sessErr) console.error("getSession error:", sessErr);

      const currentSession = sessionData?.session ?? null;
      const currentUser = currentSession?.user ?? null;

      if (!mounted) return;

      setSession(currentSession);
      setUser(currentUser);

      if (currentUser) {
  const fetchedProfile = await fetchProfile(currentUser);

  if (!mounted) return;
  setProfile(fetchedProfile);

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
        setProfile(null);
        localStorage.removeItem("myanmatch_user");
      }
    } catch (error) {
      console.error("Critical error in AuthProvider (init):", error);
      if (!mounted) return;
      setSession(null);
      setUser(null);
      setProfile(null);
      localStorage.removeItem("myanmatch_user");
    } finally {
      if (mounted) setLoading(false); // IMPORTANT: ensure loading ends on first mount
    }
  }

  init();

  // 2) Keep listening for later auth changes
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  async (_event, session) => {
    // 🔥 ADD THIS LINE - CRITICAL FIX 🔥
    if (!mounted) return;
    
    try {
      const currentUser = session?.user ?? null;
      setSession(session ?? null);
      setUser(currentUser);

        if (currentUser) {
          const fetchedProfile = await fetchProfile(currentUser);
          setProfile(fetchedProfile);

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
          setProfile(null);
          localStorage.removeItem("myanmatch_user");
        }
      } catch (error) {
        console.error("Critical error in AuthProvider (onAuthStateChange):", error);
        setSession(null);
        setUser(null);
        setProfile(null);
        localStorage.removeItem("myanmatch_user");
      } finally {
      }
    }
  );

  return () => {
    mounted = false;
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