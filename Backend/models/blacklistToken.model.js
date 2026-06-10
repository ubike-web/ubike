const supabase = require('../config/supabase');

module.exports.findOne = async (filter) => {
  // Auto-clean tokens older than 24h while we're at it
  await supabase.from('qr_blacklist_tokens')
    .delete()
    .lt('created_at', new Date(Date.now() - 86400000).toISOString());

  const { data } = await supabase.from('qr_blacklist_tokens')
    .select('id')
    .eq('token', filter.token)
    .maybeSingle();
  return data || null;
};

module.exports.create = async (data) => {
  await supabase.from('qr_blacklist_tokens').insert({ token: data.token });
};
