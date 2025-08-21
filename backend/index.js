// backend/index.js
require("dotenv").config();
console.log("DEBUG SUPABASE_URL =", process.env.SUPABASE_URL);

const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const voice = require("./routes/voice");
const auth  = require("./routes/auth");
const likes = require("./routes/likes");
const user  = require("./routes/user");
const reportRoutes = require("./routes/report");

const app = express();
const PORT = process.env.PORT || 5050;

// CORS: no credentials needed; allow dev origin
app.use(cors({ origin: ["http://localhost:5173"], methods: ["GET","POST","OPTIONS"] }));
app.use(express.json());

// Attach Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
app.use((req, res, next) => { req.supabase = supabase; next(); });

// Mount routers
app.use("/api", reportRoutes);
app.use("/api/voice", voice);
app.use("/api/auth", auth);
app.use("/api/likes", likes);
app.use("/api/users", user);

app.listen(PORT, () => {
  console.log(`MyanMatch backend running on port ${PORT}`);
});
