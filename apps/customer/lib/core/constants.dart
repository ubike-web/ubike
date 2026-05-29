const kApiUrl = String.fromEnvironment('API_URL', defaultValue: 'https://ubike-api.onrender.com/api/v1');
const kOrsApiKey = String.fromEnvironment('ORS_KEY', defaultValue: '');
const kZegoAppId = int.fromEnvironment('ZEGO_APP_ID', defaultValue: 0);
const kZegoServerSecret = String.fromEnvironment('ZEGO_SECRET', defaultValue: '');

// Map tile URL (OpenStreetMap — free, no key needed)
const kMapTileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const kMapAttribution = '© OpenStreetMap contributors';

// Business config (matches backend)
const kBaseFareKes = 100.0;
const kKmRateKes = 50.0;
const kErrandBaseFareKes = 150.0;
const kMaxFareRaisePct = 30;
const kMembershipFeeKes = 2000.0;

// Animation durations
const kFast = Duration(milliseconds: 200);
const kMedium = Duration(milliseconds: 350);
const kSlow = Duration(milliseconds: 600);
