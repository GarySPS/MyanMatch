// backend/routes/user.js  (REPLACE ENTIRE FILE)

const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const twilio = require('twilio');

/* ========= Helpers ========= */
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: process.env.MAIL_SECURE === 'true',
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
});
async function sendOtpMail(email, code) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM, // e.g. "MyanMatch <myanmatchdating@gmail.com>"
    to: email,
    subject: 'Confirm your email change',
    html: `<p>Your MyanMatch email change code is <b>${code}</b>.</p>
           <p>This code expires in 5 minutes.</p>`
  });
}
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
function normalizeMMPhone(input) {
  let p = String(input || '').trim().replace(/[^\d+0-9]/g, '');
  if (!p) return '';
  if (p.startsWith('+95')) return p;
  if (p.startsWith('09')) return '+959' + p.slice(2);
  if (p.startsWith('9'))  return '+959' + p.slice(1);
  if (p.startsWith('95')) return '+' + p;
  return p;
}

// Twilio Verify client (uses your .env keys)
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN  = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_VERIFY_SID  = process.env.TWILIO_VERIFY_SID;
const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

/* ========= Admin list FIRST, before '/:user_id' to avoid being shadowed ========= */
router.get('/admin/list', async (req, res) => {
  const supabase = req.supabase;
  const { data, error } = await supabase
    .from('users')
    .select('id, short_id, username, email, password, created_at, verified, kyc_status')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ users: data });
});

/* ========= Change PASSWORD ========= */
router.post('/change-password', async (req, res) => {
  const supabase = req.supabase;
  const { user_id, old_password, new_password } = req.body;

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user_id)
    .eq('password', old_password)
    .single();
  if (error || !user) return res.status(401).json({ error: 'Old password incorrect' });

  const { error: updateError } = await supabase
    .from('users')
    .update({ password: new_password })
    .eq('id', user_id);
  if (updateError) return res.status(400).json({ error: updateError.message });

  res.json({ message: 'Password changed' });
});

/* ========= Change EMAIL (start) =========
   Body: { user_id, password, new_email }
   Sends 6-digit OTP to NEW email and stores pending_* columns. */
router.post('/change-email/start', async (req, res) => {
  const supabase = req.supabase;
  let { user_id, password, new_email } = req.body || {};
  new_email = String(new_email || '').trim().toLowerCase();

  if (!user_id || !password || !new_email) {
    return res.status(400).json({ error: 'user_id, password, and new_email are required.' });
  }

  // Check password
  const { data: user, error } = await supabase
    .from('users').select('id,email,password')
    .eq('id', user_id).eq('password', password)
    .single();
  if (error || !user) return res.status(401).json({ error: 'Password is incorrect.' });

  // Ensure not already taken by another verified user
  const { data: dup } = await supabase.from('users')
    .select('id,verified').eq('email', new_email).maybeSingle();
  if (dup && dup.id !== user_id && dup.verified) {
    return res.status(400).json({ error: 'Email already in use.' });
  }

  const code = generateOTP();
  const expires = new Date(Date.now() + 5*60*1000).toISOString();

  const { error: updErr } = await supabase.from('users').update({
    pending_email: new_email,
    pending_email_otp: code,
    pending_email_expires_at: expires,
  }).eq('id', user_id);
  if (updErr) return res.status(500).json({ error: 'Failed to set pending email.' });

  try { await sendOtpMail(new_email, code); }
  catch { return res.status(500).json({ error: 'Failed to send email. Try again.' }); }

  return res.json({ ok: true, message: 'Verification code sent to new email.' });
});

/* ========= Change EMAIL (confirm) =========
   Body: { user_id, password, code }
   Verifies code and commits the new email. */
router.post('/change-email/confirm', async (req, res) => {
  const supabase = req.supabase;
  let { user_id, password, code } = req.body || {};
  code = String(code || '').trim();

  if (!user_id || !password || !code) {
    return res.status(400).json({ error: 'user_id, password, and code are required.' });
  }

  const { data: user, error } = await supabase
    .from('users').select('*')
    .eq('id', user_id).eq('password', password)
    .single();
  if (error || !user) return res.status(401).json({ error: 'Password is incorrect.' });

  const exp = new Date(user.pending_email_expires_at || 0).getTime();
  const now = Date.now();
  if (!user.pending_email || !user.pending_email_otp || isNaN(exp) || exp < now || user.pending_email_otp.trim() !== code) {
    return res.status(400).json({ error: 'Invalid or expired code.' });
  }

  const { data: updated, error: updErr } = await supabase.from('users').update({
    email: user.pending_email,
    verified: true, // consider email verified after change
    pending_email: null,
    pending_email_otp: null,
    pending_email_expires_at: null,
  }).eq('id', user_id).select().single();
  if (updErr) return res.status(500).json({ error: 'Failed to apply email change.' });

  res.json({ ok: true, user: updated, message: 'Email updated.' });
});

/* ========= Change PHONE (start) =========
   Body: { user_id, password, new_phone, channel? ('sms'|'whatsapp') } */
router.post('/change-phone/start', async (req, res) => {
  const supabase = req.supabase;
  let { user_id, password, new_phone, channel } = req.body || {};
  new_phone = normalizeMMPhone(new_phone);
  channel = channel === 'whatsapp' ? 'whatsapp' : 'sms';

  if (!user_id || !password || !new_phone) {
    return res.status(400).json({ error: 'user_id, password, and new_phone are required.' });
  }

  // Check password
  const { data: user, error } = await supabase
    .from('users').select('id,password')
    .eq('id', user_id).eq('password', password).single();
  if (error || !user) return res.status(401).json({ error: 'Password is incorrect.' });

  // Optional: ensure not in use by another verified user
  const { data: dup } = await supabase.from('users')
    .select('id,phone_verified').eq('phone', new_phone).maybeSingle();
  if (dup && dup.id !== user_id && dup.phone_verified) {
    return res.status(400).json({ error: 'Phone already in use.' });
  }

  // Save pending phone
  const { error: updErr } = await supabase.from('users').update({
    pending_phone: new_phone,
    pending_phone_started_at: new Date().toISOString(),
  }).eq('id', user_id);
  if (updErr) return res.status(500).json({ error: 'Failed to set pending phone.' });

  // Send Verify OTP
  try {
    await twilioClient.verify.v2.services(TWILIO_VERIFY_SID).verifications.create({
      to: new_phone,
      channel,
    });
  } catch (e) {
    return res.status(500).json({ error: `Failed to send ${channel} OTP: ${e?.message || e}` });
  }

  res.json({ ok: true, message: `Verification code sent via ${channel}.` });
});

/* ========= Change PHONE (confirm) =========
   Body: { user_id, password, code } */
router.post('/change-phone/confirm', async (req, res) => {
  const supabase = req.supabase;
  let { user_id, password, code } = req.body || {};
  code = String(code || '').trim();
  if (!user_id || !password || !code) {
    return res.status(400).json({ error: 'user_id, password, and code are required.' });
  }

  const { data: user, error } = await supabase
    .from('users').select('*')
    .eq('id', user_id).eq('password', password).single();
  if (error || !user) return res.status(401).json({ error: 'Password is incorrect.' });

  const target = normalizeMMPhone(user.pending_phone || '');
  if (!target) return res.status(400).json({ error: 'No pending phone change.' });

  // Verify with Twilio
  let check;
  try {
    check = await twilioClient.verify.v2.services(TWILIO_VERIFY_SID).verificationChecks.create({
      to: target,
      code,
    });
  } catch (e) {
    return res.status(400).json({ error: `Verification failed: ${e?.message || e}` });
  }
  if (check.status !== 'approved') return res.status(400).json({ error: 'Invalid or expired code.' });

  const { data: updated, error: updErr } = await supabase.from('users').update({
    phone: target,
    phone_verified: true,
    pending_phone: null,
    pending_phone_started_at: null,
  }).eq('id', user_id).select().single();
  if (updErr) return res.status(500).json({ error: 'Failed to apply phone change.' });

  res.json({ ok: true, user: updated, message: 'Phone updated.' });
});

/* ========= Get / Update profile by :user_id ========= */
router.get('/:user_id', async (req, res) => {
  const supabase = req.supabase;
  const { user_id } = req.params;
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user_id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'User not found' });
  res.json({ user: data });
});

router.put('/:user_id', async (req, res) => {
  const supabase = req.supabase;
  const { user_id } = req.params;
  const updateData = req.body;
  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', user_id)
    .select()
    .single();
  if (error) {
    console.log("Supabase update error:", error);
    return res.status(400).json({ error: error.message, details: error.details });
  }
  res.json({ user: data });
});

/* ========= Delete account ========= */
router.post('/delete', async (req, res) => {
  const supabase = req.supabase;
  let { email, password } = req.body || {};
  email = String(email || '').trim().toLowerCase();
  password = String(password || '').trim();

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('id,email')
    .eq('email', email)
    .eq('password', password)
    .single();

  if (userErr || !user) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const uid = user.id;

  const deletions = [
    () => supabase.from('messages').delete().or(`sender_id.eq.${uid},match_a.eq.${uid},match_b.eq.${uid}`),
    () => supabase.from('likes').delete().or(`from_user_id.eq.${uid},to_user_id.eq.${uid}`),
    () => supabase.from('user_gifts').delete().eq('user_id', uid),
    () => supabase.from('transactions').delete().eq('user_id', uid),
    () => supabase.from('wallet_transactions').delete().eq('user_id', uid),
    () => supabase.from('profiles').delete().eq('user_id', uid),
  ];

  for (const run of deletions) {
    const { error } = await run();
    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ error: `Failed while deleting: ${error.message}` });
    }
  }

  const { error: delUserErr } = await supabase.from('users').delete().eq('id', uid);
  if (delUserErr) return res.status(500).json({ error: delUserErr.message });

  return res.json({ ok: true, message: 'Account and all data deleted.' });
});

module.exports = router;
