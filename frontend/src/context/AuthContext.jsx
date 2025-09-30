// src/context/AuthContext.jsx

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    console.log("🔄 AuthContext State Update:", {
      loading,
      user: user ? `User(${user.email})` : null,
      profile: profile ? `Profile(${profile.username})` : null,
      session: session ? "Session(exists)" : null
    });
  }, [loading, user, profile, session]);

const fetchProfile = useCallback(async (user) => {
  if (!user) {
    console.log("fetchProfile: No user provided, returning null.");
    return null;
  }

  try {
    console.log(`fetchProfile (SIMPLE TEST): 🚀 Starting fetch for user ${user.id}...`);
    
    // [!CHANGE!] We are only selecting TWO simple columns to test the query.
    const { data, error, status } = await supabase
      .from("profiles")
      .select("user_id, onboarding_complete") // <-- THE ONLY IMPORTANT CHANGE
      .eq("user_id", user.id)
      .single();

    console.log(`fetchProfile (SIMPLE TEST): 🏁 Query finished with status: ${status}.`);

    if (error && error.code !== 'PGRST116') {
      console.error("fetchProfile (SIMPLE TEST): ❌ Supabase query error:", error);
      throw error;
    }

    console.log("fetchProfile (SIMPLE TEST): ✅ Success. Received profile data:", data);
    
    // If the simple query works but returns partial data, we will need to
    // fetch the full profile later. For now, this is enough for routing.
    return data;

  } catch (error) {
    console.error("fetchProfile (SIMPLE TEST): 💥 CRITICAL ERROR in catch block:", error);
    return null;
  }
}, []);

  useEffect(() => {
    setLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          const currentUser = session?.user ?? null;
          setSession(session ?? null);
          setUser(currentUser);
          
          if (currentUser) {
            const fetchedProfile = await fetchProfile(currentUser);
            setProfile(fetchedProfile);
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.error("Error in onAuthStateChange:", error);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);
  
  const refreshProfile = useCallback(async () => {
    if (user) {
      setIsRefreshing(true);
      const refreshed = await fetchProfile(user);
      setProfile(refreshed);
      setIsRefreshing(false);
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
    isRefreshing,
    refreshProfile,
    silentRefreshProfile,
    signOut: () => {
      localStorage.removeItem("myanmatch_user");
      localStorage.removeItem("onboardingProfile"); 
      setSession(null);
      setUser(null);
      setProfile(null);
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