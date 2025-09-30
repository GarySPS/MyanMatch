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
    console.log("No user, skipping test.");
    return null;
  }

  console.log(`--- 🧪 ISOLATION TEST START: Attempting to read from test_table ---`);

  try {
    // We are trying to read from 'test_table' instead of 'profiles'
    const { data, error, status } = await supabase
      .from('test_table')
      .select('message')
      .limit(1)
      .single();

    console.log(`--- ISOLATION TEST: Query finished with status: ${status} ---`);

    if (error) {
      // If there's an error, log it and fail the test.
      console.error(`--- ❌ ISOLATION TEST FAILED: Supabase query error:`, error);
      return null;
    }

    console.log(`--- ✅ ISOLATION TEST SUCCESS! Data received:`, data);
    
    // If successful, we return a "fake" profile object just to make the app work.
    // This will let us get past the loading screen.
    return { 
      user_id: user.id, 
      onboarding_complete: false, // Ensures you go to onboarding
      test_message: data.message 
    };

  } catch (error) {
    console.error("--- 💥 ISOLATION TEST FAILED: CRITICAL ERROR in catch block:", error);
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