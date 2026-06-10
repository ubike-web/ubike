const axios = require('axios');
const supabase = require('../config/supabase');
const { sendMessageToSocketId } = require('../socket');
const rideModel = require('../models/ride.model');
const mapService = require('../services/map.service');
const rideService = require('../services/ride.service');
const crypto = require('crypto');

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE = 'https://api.paystack.co';

module.exports.initialize = async (req, res) => {
  const { amount, email, description } = req.body;
  if (!amount || !email) return res.status(400).json({ message: 'amount and email are required' });

  try {
    const response = await axios.post(
      `${PAYSTACK_BASE}/transaction/initialize`,
      { email, amount: Math.round(amount * 100), currency: 'KES', metadata: { description } },
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
    );
    const { reference, authorization_url, access_code } = response.data.data;
    return res.status(200).json({ reference, authorization_url, access_code });
  } catch (err) {
    return res.status(500).json({ message: err.response?.data?.message || err.message });
  }
};

module.exports.confirmFirst = async (req, res) => {
  const { reference, pickup, destination, vehicleType } = req.body;
  const userId = req.user._id;

  if (!reference || !pickup || !destination || !vehicleType) {
    return res.status(400).json({ message: 'reference, pickup, destination and vehicleType are required' });
  }

  try {
    const verify = await axios.get(`${PAYSTACK_BASE}/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    });
    const txData = verify.data.data;
    if (txData.status !== 'success') {
      return res.status(400).json({ message: 'Payment not successful' });
    }

    const { fare, distanceTime } = await rideService.getFare(pickup, destination);
    const otp = crypto.randomInt(100000, 999999).toString();

    const { data: row, error: rideErr } = await supabase.from('qr_rides').insert({
      user_id: userId,
      pickup,
      destination,
      fare: fare[vehicleType],
      vehicle: vehicleType,
      distance: distanceTime.distance.value,
      duration: distanceTime.duration.value,
      otp,
      messages: [],
      status: 'pending',
      payment_reference: reference,
      first_payment_ref: reference,
      first_payment_paid: true,
    }).select('*, user:qr_users(*), captain:qr_captains(*)').single();

    if (rideErr) throw new Error(rideErr.message);

    await supabase.from('qr_transactions').insert({
      user_id: userId,
      ride_id: row.id,
      amount: txData.amount / 100,
      half: 'first',
      reference,
      status: 'success',
    });

    const ride = {
      ...row,
      _id: row.id,
      otp: '',
      user: row.user ? { ...row.user, _id: row.user.id, fullname: { firstname: row.user.firstname, lastname: row.user.lastname || '' }, socketId: row.user.socket_id || '' } : userId,
      captain: null,
    };

    res.status(201).json(ride);

    Promise.resolve().then(async () => {
      try {
        const pickupCoords = await mapService.getAddressCoordinate(pickup);
        const captains = await mapService.getCaptainsInTheRadius(pickupCoords.ltd, pickupCoords.lng, 4, vehicleType);
        captains.forEach(captain => {
          sendMessageToSocketId(captain.socketId, { event: 'new-ride', data: ride });
        });
      } catch (e) {
        console.error('[Payment] broadcast error:', e.message);
      }
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports.confirmSecond = async (req, res) => {
  const { reference, rideId } = req.body;
  const userId = req.user._id;

  if (!reference || !rideId) {
    return res.status(400).json({ message: 'reference and rideId are required' });
  }

  try {
    const verify = await axios.get(`${PAYSTACK_BASE}/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    });
    const txData = verify.data.data;
    if (txData.status !== 'success') {
      return res.status(400).json({ message: 'Payment not successful' });
    }

    await supabase.from('qr_rides').update({
      second_payment_ref: reference,
      second_payment_paid: true,
      updated_at: new Date().toISOString(),
    }).eq('id', rideId);

    await supabase.from('qr_transactions').insert({
      user_id: userId,
      ride_id: rideId,
      amount: txData.amount / 100,
      half: 'second',
      reference,
      status: 'success',
    });

    return res.status(200).json({ message: 'Second payment successful' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports.getWallet = async (req, res) => {
  const userId = req.user._id;
  try {
    const { data, error } = await supabase
      .from('qr_transactions')
      .select('*, ride:qr_rides(pickup, destination, vehicle, fare)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    const totalSpent = (data || []).reduce(
      (sum, t) => (t.status === 'success' ? sum + Number(t.amount) : sum), 0
    );

    return res.status(200).json({ transactions: data || [], totalSpent });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
