const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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
    status: row.status || 'inactive',
    vehicle: {
      color: row.vehicle_color,
      number: row.vehicle_number,
      capacity: row.vehicle_capacity,
      type: row.vehicle_type,
    },
    location: {
      ltd: row.location_lat || 0,
      lng: row.location_lng || 0,
    },
    select(_) { return this; },
    populate(_) { return this; },

    generateAuthToken() {
      return jwt.sign({ id: row.id, userType: 'captain' }, process.env.JWT_SECRET, { expiresIn: '24h' });
    },

    async comparePassword(password) {
      return bcrypt.compare(password, row.password_hash);
    },

    async save() {
      const { error } = await supabase.from('qr_captains').update({
        email_verified: this.emailVerified,
        socket_id: this.socketId,
        password_hash: this.password,
        firstname: this.fullname?.firstname || this.firstname,
        lastname: this.fullname?.lastname || this.lastname || '',
        phone: this.phone || '',
        status: this.status,
        updated_at: new Date().toISOString(),
      }).eq('id', row.id);
      if (error) throw new Error(error.message);
    },
  };
  return obj;
}

module.exports.findOne = (filter) => makeQuery(async () => {
  let q = supabase.from('qr_captains').select('*');
  if (filter.email) q = q.eq('email', filter.email);
  else if (filter._id) q = q.eq('id', filter._id);
  const { data } = await q.maybeSingle();
  return enrich(data);
});

module.exports.findById = (id) => makeQuery(async () => {
  if (!id) return null;
  const { data } = await supabase.from('qr_captains').select('*').eq('id', id).maybeSingle();
  return enrich(data);
});

module.exports.findByIdAndUpdate = async (id, update) => {
  const updates = { updated_at: new Date().toISOString() };
  if (update.socketId !== undefined) updates.socket_id = update.socketId;
  if (update.socket_id !== undefined) updates.socket_id = update.socket_id;
  if (update.status !== undefined) updates.status = update.status;
  // Location update from socket: { location: { type: 'Point', coordinates: [lng, lat] } }
  if (update.location?.coordinates) {
    updates.location_lng = update.location.coordinates[0];
    updates.location_lat = update.location.coordinates[1];
  }
  await supabase.from('qr_captains').update(updates).eq('id', id);
};

module.exports.findOneAndUpdate = async (filter, update, opts = {}) => {
  const updates = { updated_at: new Date().toISOString() };
  // Handle nested captainData shape: { fullname, phone, vehicle }
  if (update.fullname) {
    if (update.fullname.firstname) updates.firstname = update.fullname.firstname;
    if (update.fullname.lastname !== undefined) updates.lastname = update.fullname.lastname || '';
  }
  if (update.phone !== undefined) updates.phone = update.phone;
  if (update.vehicle) {
    if (update.vehicle.color) updates.vehicle_color = update.vehicle.color;
    if (update.vehicle.number) updates.vehicle_number = update.vehicle.number;
    if (update.vehicle.capacity !== undefined) updates.vehicle_capacity = update.vehicle.capacity;
    if (update.vehicle.type) updates.vehicle_type = update.vehicle.type;
  }
  // Handle status updates
  if (update.status !== undefined) updates.status = update.status;

  let q = supabase.from('qr_captains').update(updates);
  if (filter.email) q = q.eq('email', filter.email);
  else if (filter._id) q = q.eq('id', filter._id);

  if (opts.new) {
    const { data } = await q.select().maybeSingle();
    return enrich(data);
  }
  await q;
  return null;
};

module.exports.find = async (filter) => {
  // Used for getCaptainsInTheRadius — handled in map.service.js directly
  return [];
};

module.exports.create = async (data) => {
  const { data: row, error } = await supabase.from('qr_captains').insert({
    firstname: data.fullname.firstname,
    lastname: data.fullname?.lastname || '',
    email: data.email,
    password_hash: data.password,
    phone: data.phone || '',
    vehicle_color: data.vehicle.color,
    vehicle_number: data.vehicle.number,
    vehicle_capacity: data.vehicle.capacity || 1,
    vehicle_type: data.vehicle.type,
    location_lat: 0,
    location_lng: 0,
  }).select().single();
  if (error) throw new Error(error.message);
  return enrich(row);
};

module.exports.hashPassword = async (password) => bcrypt.hash(password, 10);
