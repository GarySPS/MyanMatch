// backend/routes/auth.js (FULL FILE)

const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

/* ================= EMAIL OTP SENDER ================= */
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: process.env.MAIL_SECURE === 'true',
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
});

async function sendOtpMail(email, code) {
  await transporter.sendMail({
    from: `MyanMatch <${process.env.MAIL_FROM}>`,
    to: email,
    subject: 'Your MyanMatch OTP Code',
    html: `<div>
      <h2>Your OTP Code</h2>
      <p><b>${code}</b></p>
      <p>This code will expire in 5 minutes.</p>
    </div>`,
  });
}

/* ================= SMS OTP SENDER (Twilio by default) =================
   You can switch provider later. Fill env:
   TWILIO_SID, TWILIO_AUTH, TWILIO_FROM  (From number like +15005550006)
======================================================================= */
let smsClient = null;
try {
  const twilio = require('twilio');
  smsClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
} catch (_) {
  console.warn('Twilio not installed. Run: npm i twilio');
}

async function sendOtpSms(phone, code) {
  if (!smsClient) throw new Error('SMS client not configured');
  await smsClient.messages.create({
    to: phone,
    from: process.env.TWILIO_FROM,
    body: `MyanMatch verification code: ${code}`,
  });
}

// === Twilio Verify client (use your existing env names) ===
const twilio = require('twilio');
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN  = process.env.TWILIO_AUTH_TOKEN;
const VERIFY_SID         = process.env.TWILIO_VERIFY_SID;

const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);


/* ================= HELPERS ================= */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function generateUniqueShortId(supabase) {
  let shortId, exists, attempts = 0;
  do {
    shortId = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const { data } = await supabase
      .from('users')
      .select('short_id')
      .eq('short_id', shortId)
      .single();
    exists = !!data;
    attempts++;
    if (attempts > 10) throw new Error('Unable to generate unique short_id');
  } while (exists);
  return shortId;
}

/** Normalize Myanmar local numbers to E.164 (+95...)
 * Accepts:
 *  - +95XXXXXXXXX  -> keep
 *  - 09XXXXXXXXX   -> +959XXXXXXXXX
 *  - 9XXXXXXXXX    -> +959XXXXXXXX
 */
function normalizeMMPhone(input) {
  let p = String(input || '').trim().replace(/[^\d+]/g, '');
  if (!p) return '';
  if (p.startsWith('+95')) return p;
  if (p.startsWith('09')) return '+959' + p.slice(2);
  if (p.startsWith('9')) return '+959' + p.slice(1);
  // As a last resort, if it starts with 95 (no +)
  if (p.startsWith('95')) return '+' + p;
  return p; // let provider validate
}

/* ================= EMAIL REGISTER ================= */
router.post('/register', async (req, res) => {
  const supabase = req.supabase;
  const { email, password, username } = req.body;

  const { data: exist } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  const otp_code = generateOTP();
  const otp_expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  if (exist && exist.verified) {
    return res.status(400).json({ error: 'Email already registered' });
  } else if (exist && !exist.verified) {
    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update({ password, username, otp_code, otp_expires_at, kyc_status: 'pending', verified: false })
      .eq('email', email)
      .select()
      .single();
    if (updateError) return res.status(400).json({ error: updateError.message });
    await sendOtpMail(email, otp_code);
    return res.json({ user: updated, message: 'OTP resent to email.' });
  }

  let short_id;
  try { short_id = await generateUniqueShortId(supabase); }
  catch (err) { return res.status(500).json({ error: 'Could not generate user ID, please try again.' }); }

  const { data, error } = await supabase
    .from('users')
    .insert([{ short_id, email, password, username, kyc_status: 'pending', otp_code, otp_expires_at, verified: false }])
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message, details: error.details });

  await sendOtpMail(email, otp_code);
  res.json({ user: data, message: 'OTP sent to email.' });
});

/* ================= EMAIL VERIFY ================= */
router.post('/verify-otp', async (req, res) => {
  const supabase = req.supabase;
  const { email, otp_code } = req.body;

  const { data: user, error } = await supabase.from('users').select('*').eq('email', email).single();
  if (error || !user) return res.status(404).json({ error: 'User not found.' });

  if (user.verified) {
    return res.status(400).json({ error: 'Already verified.', is_new_user: false, user });
  }

  const expires = new Date((user.otp_expires_at || '') + 'Z').getTime();
  const now = Date.now();
  if (String(user.otp_code).trim() !== String(otp_code).trim() || !user.otp_expires_at || expires < now) {
    return res.status(400).json({ error: 'Invalid or expired OTP code.' });
  }

  const isFirstVerification = !user.verified;
  const { data: updatedUser, error: updateError } = await supabase
    .from('users')
    .update({ verified: true, otp_code: null, otp_expires_at: null })
    .eq('id', user.id)
    .select()
    .single();

  if (updateError) return res.status(500).json({ error: "Failed to set verified.", details: updateError.message });

  return res.json({ message: 'OTP verified. You may now login.', is_new_user: isFirstVerification, user: updatedUser });
});

/* ================= EMAIL RESEND ================= */
router.post('/resend-otp', async (req, res) => {
  const supabase = req.supabase;
  const { email } = req.body;

  const { data: user, error } = await supabase.from('users').select('*').eq('email', email).single();
  if (error || !user) return res.status(404).json({ error: 'User not found.' });
  if (user.verified) return res.status(400).json({ error: 'Already verified.' });

  const now = new Date();
  if (user.otp_expires_at && new Date(user.otp_expires_at) > now) {
    const seconds = Math.round((new Date(user.otp_expires_at) - now) / 1000);
    if (seconds > 240) return res.status(429).json({ error: `Please wait ${seconds - 240}s to resend OTP.` });
  }

  const otp_code = generateOTP();
  const otp_expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  await supabase.from('users').update({ otp_code, otp_expires_at }).eq('id', user.id);
  await sendOtpMail(email, otp_code);
  res.json({ message: 'OTP resent. Please check your email.' });
});

/* ================= EMAIL LOGIN ================= */
router.post('/login', async (req, res) => {
  const supabase = req.supabase;
  const { email, password } = req.body;
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .or(`email.eq.${email},username.eq.${email}`)
    .eq('password', password)
    .single();
  if (error || !user) return res.status(401).json({ error: 'Invalid credentials' });
  if (!user.verified) return res.status(401).json({ error: 'Please verify your email via OTP.' });
  res.json({ user });
});

/* ======================================================================
   ======================  PHONE OTP ENDPOINTS  ==========================
   ====================================================================== */

/* ----- Register with phone ----- */
router.post('/register-phone', async (req, res) => {
  const supabase = req.supabase;
  let { phone, password, username, channel } = req.body || {};
  phone = normalizeMMPhone(phone);
  channel = channel === 'whatsapp' ? 'whatsapp' : 'sms'; // default is SMS

  if (!phone) return res.status(400).json({ error: 'Phone is required.' });

  // Find or create the user row without generating/storing a code
  const { data: exist } = await supabase.from('users').select('*').eq('phone', phone).single();

  if (exist && exist.phone_verified) {
    return res.status(400).json({ error: 'Phone already registered' });
  }

  let userRow = exist;
  if (exist && !exist.phone_verified) {
    const { data: updated, error: uerr } = await supabase
      .from('users')
      .update({ password, username, kyc_status: exist.kyc_status || 'pending' })
      .eq('phone', phone)
      .select()
      .single();
    if (uerr) return res.status(400).json({ error: uerr.message });
    userRow = updated;
  }

  if (!userRow) {
    let short_id;
    try { short_id = await generateUniqueShortId(supabase); }
    catch { return res.status(500).json({ error: 'Could not generate user ID, please try again.' }); }

    const { data, error } = await supabase
      .from('users')
      .insert([{
        short_id,
        phone,
        password,
        username,
        kyc_status: 'pending',
        phone_verified: false,
        verified: false,
      }])
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message, details: error.details });
    userRow = data;
  }

  // Ask Twilio Verify to send the code
  try {
    await twilioClient.verify.v2.services(VERIFY_SID).verifications.create({
      to: phone,
      channel, // 'sms' or 'whatsapp'
    });
    return res.json({ user: userRow, message: `OTP sent via ${channel}.` });
  } catch (e) {
    return res.status(500).json({ error: `Failed to send ${channel} OTP: ${e?.message || e}` });
  }
});

/* ----- Verify phone OTP ----- */
router.post('/verify-otp-phone', async (req, res) => {
  const supabase = req.supabase;
  let { phone, otp_code } = req.body || {};
  phone = normalizeMMPhone(phone);

  if (!phone || !otp_code) return res.status(400).json({ error: 'Phone and code are required.' });

  // Let Twilio Verify confirm the code
  let check;
  try {
    check = await twilioClient.verify.v2.services(VERIFY_SID).verificationChecks.create({
      to: phone,
      code: otp_code,
    });
  } catch (e) {
    return res.status(400).json({ error: `Verification failed: ${e?.message || e}` });
  }

  if (check.status !== 'approved') {
    return res.status(400).json({ error: 'Invalid or expired OTP code.' });
    }

  // Mark user as verified in your DB
  const { data: user, error } = await supabase.from('users').select('*').eq('phone', phone).single();
  if (error || !user) return res.status(404).json({ error: 'User not found.' });

  const { data: updatedUser, error: updateError } = await supabase
    .from('users')
    .update({ phone_verified: true })
    .eq('id', user.id)
    .select()
    .single();

  if (updateError) return res.status(500).json({ error: 'Failed to set phone verified.' });

  return res.json({ message: 'Phone verified. You may now login.', is_new_user: !user.phone_verified, user: updatedUser });
});

/* ----- Resend phone OTP ----- */
router.post('/resend-otp-phone', async (req, res) => {
  let { phone, channel } = req.body || {};
  phone = normalizeMMPhone(phone);
  channel = channel === 'whatsapp' ? 'whatsapp' : 'sms';

  if (!phone) return res.status(400).json({ error: 'Phone is required.' });

  try {
    await twilioClient.verify.v2.services(VERIFY_SID).verifications.create({
      to: phone,
      channel,
    });
    return res.json({ message: `OTP resent via ${channel}.` });
  } catch (e) {
    return res.status(500).json({ error: `Failed to resend ${channel} OTP: ${e?.message || e}` });
  }
});


/* ----- Login with phone ----- */
router.post('/login-phone', async (req, res) => {
  const supabase = req.supabase;
  let { phone, password } = req.body || {};
  phone = normalizeMMPhone(phone);

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('phone', phone)
    .eq('password', password)
    .single();

  if (error || !user) return res.status(401).json({ error: 'Invalid credentials' });
  if (!user.phone_verified) return res.status(401).json({ error: 'Please verify your phone via OTP.' });

  res.json({ user });
});

/* ================= FORGOT PASSWORD (EMAIL) — unchanged ================= */
router.post('/forgot-password/send-otp', async (req, res) => {
  const supabase = req.supabase;
  let { email } = req.body || {};
  email = String(email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  const { data: user, error } = await supabase.from('users').select('id,email').eq('email', email).single();
  if (error || !user) return res.status(404).json({ error: 'User not found.' });

  const otp_code = generateOTP();
  const otp_expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const { error: updErr } = await supabase.from('users').update({ otp_code, otp_expires_at }).eq('id', user.id);
  if (updErr) return res.status(500).json({ error: 'Could not generate OTP.' });

  try { await sendOtpMail(email, otp_code); }
  catch (e) { return res.status(500).json({ error: 'Failed to send email. Try again.' }); }

  res.json({ message: 'OTP sent to email.' });
});

router.post('/forgot-password/verify-otp', async (req, res) => {
  const supabase = req.supabase;
  let { email, otp_code } = req.body || {};
  email = String(email || '').trim().toLowerCase();
  otp_code = String(otp_code || '').trim();
  if (!email || !otp_code) return res.status(400).json({ error: 'Email and code are required.' });

  const { data: user, error } = await supabase.from('users').select('id,otp_code,otp_expires_at').eq('email', email).single();
  if (error || !user) return res.status(404).json({ error: 'User not found.' });

  const expires = new Date(user.otp_expires_at).getTime();
  const now = Date.now();
  if (!user.otp_expires_at || isNaN(expires) || expires < now || String(user.otp_code).trim() !== otp_code) {
    return res.status(400).json({ error: 'Invalid or expired OTP code.' });
  }
  return res.json({ message: 'OTP verified. You may set new password now.' });
});

router.post('/forgot-password/reset', async (req, res) => {
  const supabase = req.supabase;
  let { email, otp_code, new_password } = req.body || {};
  email = String(email || '').trim().toLowerCase();
  otp_code = String(otp_code || '').trim();
  new_password = String(new_password || '').trim();

  if (!email || !otp_code || !new_password) return res.status(400).json({ error: 'Email, code, and new password are required.' });
  if (new_password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  if (!/[A-Za-z]/.test(new_password) || !/[0-9]/.test(new_password)) return res.status(400).json({ error: 'Use letters and numbers.' });

  const { data: user, error } = await supabase.from('users').select('id,otp_code,otp_expires_at').eq('email', email).single();
  if (error || !user) return res.status(404).json({ error: 'User not found.' });

  const expires = new Date(user.otp_expires_at).getTime();
  const now = Date.now();
  if (!user.otp_expires_at || isNaN(expires) || expires < now || String(user.otp_code).trim() !== otp_code) {
    return res.status(400).json({ error: 'Invalid or expired OTP code.' });
  }

  const { error: updErr } = await supabase.from('users').update({ password: new_password, otp_code: null, otp_expires_at: null }).eq('id', user.id);
  if (updErr) return res.status(500).json({ error: 'Failed to update password.' });
  return res.json({ message: 'Password reset successful. Please login.' });
});

module.exports = router;
