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

    // [!NEW!] Create an AbortController to add a timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => {
        console.error("fetchProfile: 🚨 TIMEOUT! The database query took too long and was aborted.");
        controller.abort();
    }, 10000); // 10-second timeout

    try {
        console.log(`fetchProfile: 🚀 Starting fetch for user ${user.id}...`);
        
        const { data, error, status } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", user.id)
            .abortSignal(controller.signal) // Pass the abort signal to the query
            .single();

        clearTimeout(timeout); // Clear the timeout if the query succeeds in time

        console.log(`fetchProfile: 🏁 Query finished with status: ${status}.`);

        // Ignore the AbortError we expect on timeout
        if (error && error.name !== 'AbortError') { 
            if (error.code !== 'PGRST116') {
                console.error("fetchProfile: ❌ Supabase query error:", error);
                throw error;
            }
        }

        console.log("fetchProfile: ✅ Success. Received profile data:", data);
        return data;

    } catch (error) {
        // Ignore the AbortError we expect on timeout
        if (error.name !== 'AbortError') {
           console.error("fetchProfile: 💥 CRITICAL ERROR in catch block:", error);
        }
        clearTimeout(timeout); // Always clear timeout in case of other errors
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