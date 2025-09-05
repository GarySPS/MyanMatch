// backend/index.js

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const { verifySupabaseToken } = require("./middleware/auth");

// --- CORRECTED REQUIRE PATHS TO MATCH YOUR STRUCTURE ---
const voice = require("./routes/voice");
const auth = require("./auth"); // Fixed: This file is in the root backend folder
const likes = require("./routes/likes");
const user = require("./routes/user");
const reportRoutes = require("./routes/report");

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

// Apply the authentication middleware to protected routes
app.use("/api/likes", requireAuth, likes);
app.use("/api/user", requireAuth, user);
app.use("/api/report", requireAuth, reportRoutes);


app.get("/", (_req, res) => res.send("MyanMatch API OK"));
app.listen(PORT, () => console.log("Server running on", PORT));