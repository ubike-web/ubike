const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Lazy thenable — supports .select() and .populate() chaining like Mongoose
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
  const obj = {
    ...row,
    _id: row.id,
    fullname: { firstname: row.firstname, lastname: row.lastname || '' },
    socketId: row.socket_id || '',
    emailVerified: row.email_verified || false,
    password: row.password_hash,
    rides: [],
    select(_) { return this; },
    populate(_) { return this; },

    generateAuthToken() {
      return jwt.sign({ id: row.id, userType: 'user' }, process.env.JWT_SECRET, { expiresIn: '24h' });
    },

    async comparePassword(password) {
      return bcrypt.compare(password, row.password_hash);
    },

    async save() {
      const { error } = await supabase.from('qr_users').update({
        email_verified: this.emailVerified,
        socket_id: this.socketId,
        password_hash: this.password,
        firstname: this.fullname?.firstname || this.firstname,
        lastname: this.fullname?.lastname || this.lastname || '',
        phone: this.phone || '',
        updated_at: new Date().toISOString(),
      }).eq('id', row.id);
      if (error) throw new Error(error.message);
    },
  };
  return obj;
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

module.exports.create = async (data) => {
  const { data: row, error } = await supabase.from('qr_users').insert({
    firstname: data.fullname.firstname,
    lastname: data.fullname?.lastname || '',
    email: data.email,
    password_hash: data.password,
    phone: data.phone || '',
  }).select().single();
  if (error) throw new Error(error.message);
  return enrich(row);
};

module.exports.hashPassword = async (password) => bcrypt.hash(password, 10);
