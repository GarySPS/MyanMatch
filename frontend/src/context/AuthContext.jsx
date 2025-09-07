// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (user) => {
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
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      setProfile(data);

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
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      fetchProfile(session?.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        // [!CRITICAL FIX!]
        // This makes the loading screen less aggressive. It will only show the full
        // loading state on a major auth change (SIGN_IN/SIGN_OUT), not on a
        // simple token refresh that happens when you refocus the tab.
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
            setLoading(true);
        }
        
        await fetchProfile(currentUser);
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);
  
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};