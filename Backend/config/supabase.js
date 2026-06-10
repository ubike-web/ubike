const { createClient } = require('@supabase/supabase-js');

// Service role client — DB operations, admin auth (bypasses RLS)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Anon client — auth sign-up/sign-in so verification emails are sent correctly
const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = supabase;
module.exports.supabaseAuth = supabaseAuth;
