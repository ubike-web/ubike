const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const supabase = require('../config/supabase');

// One-time setup: creates the first admin account. Disabled once any admin exists.
module.exports.adminSetup = asyncHandler(async (req, res) => {
  const { email, password, name, setupSecret } = req.body;

  if (setupSecret !== (process.env.ADMIN_SETUP_SECRET || 'ubike-setup-2024')) {
    return res.status(403).json({ message: 'Invalid setup secret' });
  }

  // Check if any admin already exists
  const { data: existing } = await supabase.from('qr_admins').select('id').limit(1).maybeSingle();
  if (existing) {
    return res.status(400).json({ message: 'Admin already exists. Setup is disabled.' });
  }

  if (!email || !password || password.length < 8) {
    return res.status(400).json({ message: 'Email and password (min 8 chars) required' });
  }

  const password_hash = await bcrypt.hash(password, 12);
  const { data, error } = await supabase.from('qr_admins').insert({
    email: email.toLowerCase().trim(),
    password_hash,
    name: name || 'Super Admin',
  }).select('id, email, name').single();

  if (error) return res.status(500).json({ message: error.message });

  res.json({ message: 'Admin created successfully', admin: data });
});

module.exports.adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  const { data: admin, error } = await supabase
    .from('qr_admins')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  if (error || !admin) {
    return res.status(401).json({ message: 'Invalid admin credentials' });
  }

  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid admin credentials' });
  }

  const token = jwt.sign(
    { role: 'admin', email: admin.email, adminId: admin.id },
    process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token, admin: { id: admin.id, email: admin.email, name: admin.name } });
});

module.exports.listCaptains = asyncHandler(async (req, res) => {
  const { status = 'pending' } = req.query;

  const { data, error } = await supabase
    .from('qr_captains')
    .select(`
      id, firstname, lastname, email, phone,
      vehicle_type, vehicle_make, vehicle_model, vehicle_year, vehicle_color, vehicle_number,
      national_id_number, license_number, approval_status, registration_payment_paid,
      rejection_reason, created_at
    `)
    .eq('approval_status', status)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ message: error.message });

  res.json({ captains: data || [] });
});

module.exports.getCaptainDetail = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [{ data: captain, error: cErr }, { data: kyc }] = await Promise.all([
    supabase.from('qr_captains').select('*').eq('id', id).single(),
    supabase.from('kyc_documents').select('*').eq('user_id', id).maybeSingle(),
  ]);

  if (cErr || !captain) return res.status(404).json({ message: 'Captain not found' });

  // Generate signed URLs for private photos (1-hour expiry)
  const sign = async (path) => {
    if (!path) return null;
    const { data } = await supabase.storage.from('kyc-documents').createSignedUrl(path, 3600);
    return data?.signedUrl || null;
  };

  const [nationalIdUrl, licenseUrl, selfieUrl] = await Promise.all([
    sign(kyc?.national_id_url),
    sign(kyc?.license_url),
    sign(kyc?.selfie_url),
  ]);

  res.json({
    captain: { ...captain, _id: captain.id },
    kyc: kyc ? { ...kyc, nationalIdUrl, licenseUrl, selfieUrl } : null,
  });
});

module.exports.approveCaptain = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await Promise.all([
    supabase.from('qr_captains')
      .update({ approval_status: 'approved', rejection_reason: '', updated_at: new Date().toISOString() })
      .eq('id', id),
    supabase.from('kyc_documents')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('user_id', id),
  ]);

  res.json({ message: 'Captain approved successfully' });
});

module.exports.rejectCaptain = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason = '' } = req.body;

  await Promise.all([
    supabase.from('qr_captains')
      .update({ approval_status: 'rejected', rejection_reason: reason, updated_at: new Date().toISOString() })
      .eq('id', id),
    supabase.from('kyc_documents')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('user_id', id),
  ]);

  res.json({ message: 'Captain rejected' });
});

module.exports.getDashboardStats = asyncHandler(async (req, res) => {
  const [pending, approved, rejected] = await Promise.all([
    supabase.from('qr_captains').select('id', { count: 'exact', head: true }).eq('approval_status', 'pending'),
    supabase.from('qr_captains').select('id', { count: 'exact', head: true }).eq('approval_status', 'approved'),
    supabase.from('qr_captains').select('id', { count: 'exact', head: true }).eq('approval_status', 'rejected'),
  ]);

  res.json({
    pending: pending.count || 0,
    approved: approved.count || 0,
    rejected: rejected.count || 0,
  });
});
