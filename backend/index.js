// backend/index.js

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const { verifySupabaseToken } = require("./middleware/auth");

// --- FIXED REQUIRE PATHS ---
const voice = require("./routes/voice");
const auth = require("./routes/auth"); // Corrected path
const likes = require("./routes/likes"); // Corrected path
const user = require("./routes/user"); // Corrected path
const reportRoutes = require("./routes/report"); // Corrected path
const adminRoutes = require("./routes/admin"); // Added admin routes

const app = express();
const PORT = process.env.PORT || 5050;

/** CORS */
const ALLOWED = String(process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use(cors({ origin: ALLOWED, methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] }));
app.use(express.json());

/** Attach Supabase client to req */
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
app.use((req, _res, next) => {
  req.supabase = supabase;
  next();
});

/** Attach auth (Supabase JWT verification) */
app.use(verifySupabaseToken);

/** --- ROUTES --- */
app.use("/api/auth", auth);

// Middleware to protect routes that require a logged-in user
const requireAuth = (req, res, next) => {
  if (!req.auth) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

// Middleware to protect routes that require an admin user
const requireAdmin = async (req, res, next) => {
    if (!req.auth?.user?.id) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    const { data, error } = await req.supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', req.auth.user.id)
        .single();

    if (error || !data?.is_admin) {
        return res.status(403).json({ error: "Forbidden: Admins only" });
    }
    next();
};


// Public or user-specific routes
app.use("/api/likes", requireAuth, likes);
app.use("/api/user", requireAuth, user);
app.use("/api/report", requireAuth, reportRoutes);

// Admin-only routes
app.use("/api/admin", requireAuth, requireAdmin, adminRoutes);


app.get("/", (_req, res) => res.send("MyanMatch API OK"));
app.listen(PORT, () => console.log("Server running on", PORT));