// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get the initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session?.user) {
        setLoading(false);
      }
    });

    // 2. Listen for auth state changes (SIGN_IN, SIGN_OUT, TOKEN_REFRESHED, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (!session?.user) {
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // 3. Fetch the user's profile whenever the user state changes and is not null
  useEffect(() => {
    if (user?.id && !profile) {
      supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single()
        .then(({ data, error }) => {
          if (data) {
            setProfile(data);
            
            // Sync with legacy localStorage for any components not yet refactored
            const cache = {
              id: data.user_id,
              user_id: data.user_id,
              username: data.username,
              first_name: data.first_name,
              last_name: data.last_name,
              avatar_url: data.avatar_url,
              onboarding_complete: !!data.onboarding_complete,
              is_admin: !!data.is_admin,
              verified: !!user.email_confirmed_at || !user.email.endsWith('@myanmatch.user'),
            };
            localStorage.setItem("myanmatch_user", JSON.stringify(cache));
          }
          if (error) {
            console.error("Error fetching profile:", error);
          }
          setLoading(false);
        });
    } else if (!user) {
      // Clear profile when user logs out
      setProfile(null);
    }
  }, [user, profile]);


  const value = {
    session,
    user,
    profile,
    loading,
    signOut: () => supabase.auth.signOut(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};