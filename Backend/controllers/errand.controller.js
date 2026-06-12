const asyncHandler = require('express-async-handler');
const errandModel = require('../models/errand.model');
const mapService = require('../services/map.service');
const userModel = require('../models/user.model');
const supabase = require('../config/supabase');
const { sendMessageToSocketId } = require('../socket');
const crypto = require('crypto');
const axios = require('axios');

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE = 'https://api.paystack.co';

const BASE_FARE = 80;
const PER_KM_RATE = 30;
const PER_MIN_RATE = 2;
const MIN_FARE = 150;

const calcFare = (distanceM, durationS) => {
  const km = distanceM / 1000;
  const min = durationS / 60;
  return Math.max(MIN_FARE, Math.round(BASE_FARE + km * PER_KM_RATE + min * PER_MIN_RATE));
};

const genOTP = () => crypto.randomInt(100000, 999999).toString();

module.exports.getErrandFare = asyncHandler(async (req, res) => {
  const { pickup, destination } = req.query;
  if (!pickup || !destination) return res.status(400).json({ message: 'Pickup and destination are required' });

  const distTime = await mapService.getDistanceTime(pickup, destination);
  const fare = calcFare(distTime.distance.value, distTime.duration.value);

  res.json({
    fare,
    distance: distTime.distance.text,
    duration: distTime.duration.text,
    distanceValue: distTime.distance.value,
    durationValue: distTime.duration.value,
  });
});

module.exports.createErrand = asyncHandler(async (req, res) => {
  const { pickup, destination, itemName, itemDescription, paymentReference } = req.body;
  if (!pickup || !destination) return res.status(400).json({ message: 'Pickup and destination are required' });

  // Verify upfront payment
  if (process.env.SKIP_PAYMENT_CHECK !== 'true') {
    if (!paymentReference) return res.status(400).json({ message: 'Payment required to request an errand' });
    try {
      const verify = await axios.get(`${PAYSTACK_BASE}/transaction/verify/${paymentReference}`, {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
      });
      if (verify.data.data.status !== 'success') return res.status(400).json({ message: 'Payment not successful' });
    } catch {
      return res.status(400).json({ message: 'Could not verify payment. Try again.' });
    }
  }

  const distTime = await mapService.getDistanceTime(pickup, destination);
  const fare = calcFare(distTime.distance.value, distTime.duration.value);
  const otp = genOTP();

  const errand = await errandModel.create({
    userId: req.user._id,
    pickup,
    destination,
    itemName: itemName || '',
    itemDescription: itemDescription || '',
    fare,
    distance: distTime.distance.value,
    duration: distTime.duration.value,
    otp,
  });

  // Mark payment on errand record
  if (paymentReference) {
    await supabase.from('qr_errands').update({ payment_ref: paymentReference, payment_paid: true }).eq('id', errand._id);
  }

  // Find nearby active bike captains in errands mode
  let pickupCoords;
  try {
    pickupCoords = await mapService.getAddressCoordinate(pickup);
  } catch {
    pickupCoords = { ltd: 0, lng: 0 };
  }

  const { data: nearbyCaptains } = await supabase.rpc('qr_captains_in_radius', {
    p_lat: pickupCoords.ltd,
    p_lng: pickupCoords.lng,
    p_radius_km: 7,
    p_vehicle_type: 'bike',
  });

  const errandPayload = {
    ...errand,
    user: {
      _id: req.user._id,
      fullname: req.user.fullname,
      phone: req.user.phone || '',
    },
  };

  if (nearbyCaptains) {
    nearbyCaptains
      .filter(c => c.active_mode === 'errands' && c.socket_id)
      .forEach(c => {
        sendMessageToSocketId(c.socket_id, { event: 'new-errand', data: errandPayload });
      });
  }

  res.status(201).json({ errand, message: 'Errand created. Looking for a captain...' });
});

module.exports.confirmErrand = asyncHandler(async (req, res) => {
  const { errandId } = req.body;
  const errand = await errandModel.findById(errandId);
  if (!errand) return res.status(404).json({ message: 'Errand not found' });
  if (errand.status !== 'pending') return res.status(400).json({ message: 'Errand already taken or cancelled' });

  const updated = await errandModel.update(errandId, {
    captain_id: req.captain._id,
    status: 'accepted',
  });

  const user = await userModel.findOne({ _id: updated.user_id });
  if (user?.socketId) {
    sendMessageToSocketId(user.socketId, {
      event: 'errand-confirmed',
      data: {
        ...updated,
        captain: {
          _id: req.captain._id,
          fullname: req.captain.fullname,
          phone: req.captain.phone,
          vehicle: req.captain.vehicle,
        },
      },
    });
  }

  res.json({ errand: updated, message: 'Errand accepted' });
});

module.exports.startErrand = asyncHandler(async (req, res) => {
  const { errandId, otp } = req.query;
  const errand = await errandModel.findById(errandId);
  if (!errand) return res.status(404).json({ message: 'Errand not found' });
  if (String(errand.captain_id) !== String(req.captain._id)) return res.status(403).json({ message: 'Not your errand' });
  if (errand.status !== 'accepted') return res.status(400).json({ message: 'Errand not in accepted state' });
  if (errand.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

  const updated = await errandModel.update(errandId, { status: 'picked_up' });

  const user = await userModel.findOne({ _id: errand.user_id });
  if (user?.socketId) {
    sendMessageToSocketId(user.socketId, { event: 'errand-started', data: updated });
  }

  res.json({ errand: updated, message: 'Item picked up — heading to destination' });
});

module.exports.completeErrand = asyncHandler(async (req, res) => {
  const { errandId } = req.body;
  const errand = await errandModel.findById(errandId);
  if (!errand) return res.status(404).json({ message: 'Errand not found' });
  if (String(errand.captain_id) !== String(req.captain._id)) return res.status(403).json({ message: 'Not your errand' });
  if (errand.status !== 'picked_up') return res.status(400).json({ message: 'Item not yet picked up' });

  const updated = await errandModel.update(errandId, { status: 'delivered' });

  const user = await userModel.findOne({ _id: errand.user_id });
  if (user?.socketId) {
    sendMessageToSocketId(user.socketId, { event: 'errand-completed', data: updated });
  }

  // Credit captain wallet with full errand fare
  const captainId = req.captain._id;
  const fullFare = errand.fare;
  try {
    const { data: wallet } = await supabase.from('qr_captain_wallets').select('*').eq('captain_id', captainId).maybeSingle();
    if (wallet) {
      await supabase.from('qr_captain_wallets').update({ balance: wallet.balance + fullFare, total_earned: wallet.total_earned + fullFare, updated_at: new Date().toISOString() }).eq('captain_id', captainId);
    } else {
      await supabase.from('qr_captain_wallets').insert({ captain_id: captainId, balance: fullFare, pending: 0, total_earned: fullFare });
    }
    await supabase.from('qr_captain_transactions').insert({ captain_id: captainId, amount: fullFare, type: 'payout', description: `Errand: ${errand.pickup?.split(',')[0]} → ${errand.destination?.split(',')[0]}` });
    sendMessageToSocketId(req.captain.socketId, { event: 'payment-received', data: { amount: fullFare, message: `KES ${fullFare} credited for errand delivery` } });
  } catch (walletErr) {
    console.error('[Wallet] errand credit error:', walletErr.message);
  }

  res.json({ errand: updated, message: 'Errand delivered successfully' });
});

module.exports.cancelErrand = asyncHandler(async (req, res) => {
  const { errandId, reason } = req.body;
  const errand = await errandModel.findById(errandId);
  if (!errand) return res.status(404).json({ message: 'Errand not found' });
  if (['delivered', 'cancelled'].includes(errand.status)) {
    return res.status(400).json({ message: 'Errand cannot be cancelled' });
  }

  const updated = await errandModel.update(errandId, { status: 'cancelled' });

  // Notify the other party
  if (req.captain) {
    const user = await userModel.findOne({ _id: errand.user_id });
    if (user?.socketId) {
      sendMessageToSocketId(user.socketId, { event: 'errand-cancelled', data: { reason: reason || 'Captain cancelled' } });
    }
  } else if (req.user) {
    const { data: captain } = await supabase.from('qr_captains').select('socket_id').eq('id', errand.captain_id).maybeSingle();
    if (captain?.socket_id) {
      sendMessageToSocketId(captain.socket_id, { event: 'errand-cancelled', data: { reason: reason || 'User cancelled' } });
    }
  }

  res.json({ errand: updated, message: 'Errand cancelled' });
});

module.exports.getMyErrands = asyncHandler(async (req, res) => {
  const errands = req.captain
    ? await errandModel.findByCaptainId(req.captain._id)
    : await errandModel.findByUserId(req.user._id);
  res.json({ errands });
});
