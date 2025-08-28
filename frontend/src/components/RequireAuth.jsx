// src/components/RequireAuth.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function RequireAuth({ children }) {
  const [ok, setOk] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) navigate("/SignInPage", { replace: true });
      else setOk(true);
    });
  }, [navigate]);
  return ok ? children : null;
}
