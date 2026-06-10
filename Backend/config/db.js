const supabase = require('./supabase');

supabase
  .from('qr_users')
  .select('id', { count: 'exact', head: true })
  .then(({ error }) => {
    if (error) console.log('[DB] Supabase connection failed:', error.message);
    else console.log('[DB] Connected to Supabase');
  });

module.exports = supabase;
