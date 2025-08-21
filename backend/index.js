// /backend/index.js  (REPLACE ENTIRE FILE)
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const voice = require("./routes/voice");
const auth = require("./routes/auth");
const likes = require("./routes/likes");
const user = require("./routes/user");
const reportRoutes = require("./routes/report");

const app = express();
const PORT = process.env.PORT || 5050;

// Set CORS_ORIGIN in Render as a comma-separated list, e.g.:
// http://localhost:5173,https://myanmatch.vercel.app,https://myanmatch-api.onrender.com

const ALLOWED = String(process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // curl/postman
      if (ALLOWED.includes(origin)) return cb(null, true);
      // also allow Vercel preview domains
      try {
        const u = new URL(origin);
        if (u.hostname.endsWith(".vercel.app")) return cb(null, true);
      } catch {}
      return cb(new Error("Not allowed by CORS: " + origin), false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use(express.json({ limit: "5mb" }));

// health check for Render
app.get("/healthz", (_req, res) => res.status(200).send("ok"));

// Attach Supabase client for all routes (SERVICE key ONLY on backend)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
app.use((req, _res, next) => {
  req.supabase = supabase;
  next();
});

// Mount routers
app.use("/api", reportRoutes);       // /api/report, /api/admin/*
app.use("/api/voice", voice);
app.use("/api/auth", auth);
app.use("/api/likes", likes);
app.use("/api/users", user);

app.listen(PORT, () => {
  console.log(`MyanMatch backend running on port ${PORT}`);
});
