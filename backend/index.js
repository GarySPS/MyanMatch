require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const { verifySupabaseToken } = require("./middleware/auth");

const voice = require("./routes/voice");
const auth  = require("./auth");
const likes = require("./routes/likes");
const user  = require("./routes/user");
const reportRoutes = require("./routes/report");

const app = express();
const PORT = process.env.PORT || 5050;

/** CORS */
const ALLOWED = String(process.env.CORS_ORIGIN || "")
  .split(",").map(s => s.trim()).filter(Boolean);
app.use(cors({ origin: ALLOWED, methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"] }));
app.use(express.json());

/** Attach Supabase client to req */
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
app.use((req, _res, next) => { req.supabase = supabase; next(); });

/** Attach auth (Supabase JWT verification) */
app.use(verifySupabaseToken);

/** Routes */
app.use("/api/auth", auth);

/** Protect the rest: example — likes, user, report expect authenticated user */
app.use("/api/likes", (req,res,next) => {
  if (!req.auth) return res.status(401).json({ error: "Unauthorized" });
  next();
}, likes);

app.use("/api/user", (req,res,next) => {
  if (!req.auth) return res.status(401).json({ error: "Unauthorized" });
  next();
}, user);

app.use("/api/report", (req,res,next) => {
  if (!req.auth) return res.status(401).json({ error: "Unauthorized" });
  next();
}, reportRoutes);

app.get("/", (_req, res) => res.send("MyanMatch API OK"));
app.listen(PORT, () => console.log("Server running on", PORT));
