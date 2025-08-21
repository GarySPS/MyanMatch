import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { Navigate } from "react-router-dom";

export default function ProtectedAdminRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [allow, setAllow] = useState(false);

  useEffect(() => {
    (async () => {
      const me = JSON.parse(localStorage.getItem("myanmatch_user") || "null");
      if (!me?.id) { setLoading(false); setAllow(false); return; }
      const { data, error } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("user_id", me.id)
        .single();
      setAllow(!error && !!data?.is_admin);
      setLoading(false);
    })();
  }, []);

  if (loading) return null;
  if (!allow) return <Navigate to="/" replace />;
  return children;
}
