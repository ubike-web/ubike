const supabase = require('../config/supabase');

function makeQuery(fn) {
  return {
    _fn: fn, _p: null,
    select(_) { return this; },
    populate(_) { return this; },
    then(r, j) { if (!this._p) this._p = this._fn(); return this._p.then(r, j); },
    catch(j) { if (!this._p) this._p = this._fn(); return this._p.catch(j); },
    finally(f) { if (!this._p) this._p = this._fn(); return this._p.finally(f); },
  };
}

function enrichUser(u) {
  if (!u) return null;
  return { ...u, _id: u.id, fullname: { firstname: u.firstname, lastname: u.lastname || '' }, socketId: u.socket_id || '', emailVerified: u.email_verified };
}

function enrichCaptain(c) {
  if (!c) return null;
  return { ...c, _id: c.id, fullname: { firstname: c.firstname, lastname: c.lastname || '' }, socketId: c.socket_id || '',
    vehicle: { color: c.vehicle_color, number: c.vehicle_number, capacity: c.vehicle_capacity, type: c.vehicle_type } };
}

function enrich(row) {
  if (!row) return null;
  const user = row.user ? enrichUser(row.user) : null;
  const captain = row.captain ? enrichCaptain(row.captain) : null;
  const obj = {
    ...row,
    _id: row.id,
    user: user || row.user_id,
    captain: captain || row.captain_id,
    otp: row.otp || '',
    messages: Array.isArray(row.messages) ? row.messages : [],
    select(_) { return this; },
    populate(_) { return this; },

    async save() {
      const { error } = await supabase.from('qr_rides').update({
        messages: this.messages,
        status: this.status,
        otp: this.otp,
        captain_id: typeof this.captain === 'object' ? this.captain?._id || this.captain?.id : this.captain,
        payment_reference: this.payment_reference || '',
        updated_at: new Date().toISOString(),
      }).eq('id', row.id);
      if (error) throw new Error(error.message);
    },
  };
  return obj;
}

async function fetchRide(filter) {
  let q = supabase.from('qr_rides').select(`*, user:qr_users(*), captain:qr_captains(*)`);
  if (filter._id) q = q.eq('id', filter._id);
  else if (filter.id) q = q.eq('id', filter.id);
  const { data } = await q.maybeSingle();
  return enrich(data);
}

module.exports.findOne = (filter) => makeQuery(() => fetchRide(filter));

module.exports.findById = (id) => makeQuery(async () => {
  const { data } = await supabase.from('qr_rides').select(`*, user:qr_users(*), captain:qr_captains(*)`).eq('id', id).maybeSingle();
  return enrich(data);
});

module.exports.findOneAndUpdate = async (filter, update, opts = {}) => {
  const updates = { updated_at: new Date().toISOString() };
  if (update.status !== undefined) updates.status = update.status;
  if (update.captain !== undefined) updates.captain_id = update.captain;
  if (update.payment_reference !== undefined) updates.payment_reference = update.payment_reference;

  let q = supabase.from('qr_rides').update(updates);
  if (filter._id) q = q.eq('id', filter._id);

  if (opts.new) {
    const { data } = await q.select(`*, user:qr_users(*), captain:qr_captains(*)`).maybeSingle();
    return enrich(data);
  }
  await q;
  return null;
};

module.exports.create = async (data) => {
  const { data: row, error } = await supabase.from('qr_rides').insert({
    user_id: data.user,
    captain_id: data.captain || null,
    pickup: data.pickup,
    destination: data.destination,
    fare: data.fare,
    vehicle: data.vehicle,
    status: data.status || 'pending',
    duration: data.duration || 0,
    distance: data.distance || 0,
    otp: data.otp || '',
    messages: [],
    payment_reference: data.paymentID || '',
  }).select().single();
  if (error) throw new Error(error.message);
  return enrich(row);
};
