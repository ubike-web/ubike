const axios = require('axios');
const supabase = require('../config/supabase');

const apiKey = () => process.env.GOOGLE_MAPS_API;

module.exports.getAddressCoordinate = async (address) => {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey()}`;
  const response = await axios.get(url);
  if (response.data.status === 'OK') {
    const loc = response.data.results[0].geometry.location;
    return { ltd: loc.lat, lng: loc.lng };
  }
  throw new Error('Unable to fetch coordinates');
};

module.exports.getDistanceTime = async (origin, destination) => {
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${apiKey()}`;
  const response = await axios.get(url);
  console.log('[Maps] distancematrix status:', response.data.status, '| element:', response.data.rows?.[0]?.elements?.[0]?.status);
  if (response.data.status === 'OK') {
    const el = response.data.rows[0].elements[0];
    if (el.status === 'ZERO_RESULTS' || el.status === 'NOT_FOUND') throw new Error('No routes found between these locations');
    return el;
  }
  throw new Error(`Unable to fetch distance and time (${response.data.status})`);
};

module.exports.getAutoCompleteSuggestions = async (input) => {
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey()}`;
  const response = await axios.get(url);
  console.log('[Maps] autocomplete status:', response.data.status);
  if (response.data.status === 'OK' || response.data.status === 'ZERO_RESULTS') {
    return (response.data.predictions || []).map((p) => p.description).filter(Boolean);
  }
  throw new Error(`Unable to fetch suggestions (${response.data.status})`);
};

module.exports.getAddressFromCoordinates = async (lat, lng) => {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey()}`;
  const response = await axios.get(url);
  console.log('[Maps] reverse geocode status:', response.data.status);
  if (response.data.status === 'OK' && response.data.results.length > 0) {
    // Prefer a result with a real street address over a Plus Code
    const best = response.data.results.find(r =>
      r.types.some(t => ['street_address', 'route', 'neighborhood', 'locality'].includes(t))
    ) || response.data.results[0];
    return best.formatted_address;
  }
  throw new Error('Unable to reverse geocode coordinates');
};

module.exports.getCaptainsInTheRadius = async (ltd, lng, radius, vehicleType) => {
  // Haversine distance in SQL — no PostGIS needed
  const { data, error } = await supabase.rpc('qr_captains_in_radius', {
    p_lat: ltd,
    p_lng: lng,
    p_radius_km: radius,
    p_vehicle_type: vehicleType,
  });

  if (error) {
    // Fallback: return all active captains of this type if RPC not yet deployed
    console.error('[Maps] RPC error, using fallback:', error.message);
    const { data: fallback } = await supabase
      .from('qr_captains')
      .select('*')
      .eq('vehicle_type', vehicleType)
      .eq('status', 'active');
    return (fallback || []).map(enrichCaptain);
  }

  return (data || []).map(enrichCaptain);
};

function enrichCaptain(c) {
  return {
    ...c,
    _id: c.id,
    fullname: { firstname: c.firstname, lastname: c.lastname || '' },
    socketId: c.socket_id || '',
    vehicle: { color: c.vehicle_color, number: c.vehicle_number, capacity: c.vehicle_capacity, type: c.vehicle_type },
  };
}
