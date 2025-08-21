// backend/routes/voice.js
const express = require("express");
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");

const upload = multer(); // memory storage
const router = express.Router();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // service-role
const STORAGE_BUCKET = process.env.STORAGE_BUCKET || "onboarding";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

const baseMime = (m="") => (m.split(";")[0] || "audio/webm");
const safeExt  = (m="") => (m.split("/")[1]||"webm").split(";")[0].replace(/^x-/,"") || "webm";

router.post("/onboarding/voice", upload.single("file"), async (req, res) => {
  try {
    const userId = String(req.body.user_id || "").trim();
    const prompt = String(req.body.prompt || "");
    const duration = req.body.duration ? Number(req.body.duration) : null;
    if (!userId) return res.status(400).send("user_id required");
    if (!req.file) return res.status(400).send("file required");

    const ext = safeExt(req.file.mimetype);
    const mime = baseMime(req.file.mimetype);
    const path = `voice/${userId}/${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, req.file.buffer, { contentType: mime, cacheControl: "3600", upsert: true });
    if (upErr) return res.status(500).send(upErr.message);

    const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    return res.json({ url: pub?.publicUrl || null, path, bucket: STORAGE_BUCKET, mime, duration, prompt });
  } catch (e) {
    console.error(e);
    res.status(500).send("upload failed");
  }
});

module.exports = router;
