const supabase = require('../config/supabase');
const { supabaseAuth } = require('../config/supabase');

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

function enrich(row) {
  if (!row) return null;
  return {
    ...row,
    _id: row.id,
    fullname: { firstname: row.firstname, lastname: row.lastname || '' },
    socketId: row.socket_id || '',
    emailVerified: row.email_verified || false,
    rides: [],
    select(_) { return this; },
    populate(_) { return this; },

    async save() {
      const { error } = await supabase.from('qr_users').update({
        email_verified: this.emailVerified,
        socket_id: this.socketId,
        firstname: this.fullname?.firstname || this.firstname,
        lastname: this.fullname?.lastname || this.lastname || '',
        phone: this.phone || '',
        updated_at: new Date().toISOString(),
      }).eq('id', row.id);
      if (error) throw new Error(error.message);
    },
  };
}

module.exports.findOne = (filter) => makeQuery(async () => {
  let q = supabase.from('qr_users').select('*');
  if (filter.email) q = q.eq('email', filter.email);
  else if (filter._id) q = q.eq('id', filter._id);
  const { data } = await q.maybeSingle();
  return enrich(data);
});

module.exports.findById = (id) => makeQuery(async () => {
  if (!id) return null;
  const { data } = await supabase.from('qr_users').select('*').eq('id', id).maybeSingle();
  return enrich(data);
});

module.exports.findByIdAndUpdate = async (id, update) => {
  const updates = { updated_at: new Date().toISOString() };
  if (update.socketId !== undefined) updates.socket_id = update.socketId;
  if (update.socket_id !== undefined) updates.socket_id = update.socket_id;
  await supabase.from('qr_users').update(updates).eq('id', id);
};

module.exports.findOneAndUpdate = async (filter, update) => {
  const updates = { updated_at: new Date().toISOString() };
  if (update.fullname?.firstname) updates.firstname = update.fullname.firstname;
  if (update.fullname?.lastname !== undefined) updates.lastname = update.fullname.lastname || '';
  if (update.phone !== undefined) updates.phone = update.phone;

  let q = supabase.from('qr_users').update(updates);
  if (filter._id) q = q.eq('id', filter._id);
  const { data } = await q.select().maybeSingle();
  return enrich(data);
};

// Create user via Supabase Auth (sends verification email automatically)
module.exports.create = async (data) => {
  const { data: authData, error: authError } = await supabaseAuth.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        userType: 'user',
        firstname: data.fullname.firstname,
        lastname: data.fullname?.lastname || '',
        phone: data.phone || '',
      },
      emailRedirectTo: `${process.env.CLIENT_URL}/user/verify-email`,
    },
  });
  if (authError) throw new Error(authError.message);

  const { data: row, error: profileError } = await supabase.from('qr_users').insert({
    id: authData.user.id,
    firstname: data.fullname.firstname,
    lastname: data.fullname?.lastname || '',
    email: data.email,
    phone: data.phone || '',
  }).select().single();
  if (profileError) throw new Error(profileError.message);

  return enrich(row);
};

// Sign in via Supabase Auth — returns { user, session }
module.exports.signIn = async (email, password) => {
  const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data;
};
