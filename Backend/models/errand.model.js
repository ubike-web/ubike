const supabase = require('../config/supabase');

function enrich(row) {
  if (!row) return null;
  return {
    ...row,
    _id: row.id,
  };
}

module.exports.create = async (data) => {
  const { data: row, error } = await supabase.from('qr_errands').insert({
    user_id: data.userId,
    pickup: data.pickup,
    destination: data.destination,
    item_name: data.itemName || '',
    item_description: data.itemDescription || '',
    fare: data.fare,
    distance: data.distance || 0,
    duration: data.duration || 0,
    otp: data.otp,
  }).select().single();
  if (error) throw new Error(error.message);
  return enrich(row);
};

module.exports.findById = async (id) => {
  if (!id) return null;
  const { data } = await supabase.from('qr_errands').select('*').eq('id', id).maybeSingle();
  return enrich(data);
};

module.exports.update = async (id, updates) => {
  const { data } = await supabase.from('qr_errands').update({
    ...updates,
    updated_at: new Date().toISOString(),
  }).eq('id', id).select().maybeSingle();
  return enrich(data);
};

module.exports.findByUserId = async (userId) => {
  const { data } = await supabase.from('qr_errands').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return (data || []).map(enrich);
};

module.exports.findByCaptainId = async (captainId) => {
  const { data } = await supabase.from('qr_errands').select('*').eq('captain_id', captainId).order('created_at', { ascending: false });
  return (data || []).map(enrich);
};
