import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api_client.dart';

class RiderUser {
  final String id;
  final String role;
  final String? phone;
  final String? fullName;
  final double walletBalance;
  final bool isKycVerified;
  final bool isAvailable;
  final double rating;
  final int totalRides;

  const RiderUser({required this.id, required this.role, this.phone, this.fullName, this.walletBalance = 0, this.isKycVerified = false, this.isAvailable = false, this.rating = 0, this.totalRides = 0});

  factory RiderUser.fromJson(Map<String, dynamic> j) => RiderUser(
    id: j['id'] ?? '',
    role: j['role'] ?? 'passenger_rider',
    phone: j['phone'],
    fullName: j['full_name'],
    walletBalance: (j['wallet_balance'] ?? 0).toDouble(),
    isKycVerified: j['is_kyc_verified'] ?? false,
    isAvailable: j['is_available'] ?? false,
    rating: (j['rating'] ?? 0).toDouble(),
    totalRides: j['total_rides'] ?? 0,
  );
}

class AuthState {
  final bool loading;
  final RiderUser? user;
  final String? error;
  const AuthState({this.loading = false, this.user, this.error});
  bool get isAuthenticated => user != null;
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(const AuthState()) { _restore(); }

  Future<void> _restore() async {
    final t = await ApiClient.token();
    if (t == null) return;
    try {
      final d = await api.get('/auth/me');
      state = AuthState(user: RiderUser.fromJson(d as Map<String, dynamic>));
    } catch (_) { await ApiClient.clear(); }
  }

  Future<void> sendOtp(String phone) async {
    state = const AuthState(loading: true);
    try { await api.post('/auth/otp/send', data: {'phone': phone}); state = const AuthState(); }
    catch (e) { state = AuthState(error: e.toString()); rethrow; }
  }

  Future<void> verifyOtp(String phone, String otp) async {
    state = const AuthState(loading: true);
    try {
      final d = await api.post('/auth/otp/verify', data: {'phone': phone, 'otp': otp, 'role': 'passenger_rider'}) as Map<String, dynamic>;
      await ApiClient.save(d['tokens']['accessToken'] as String, d['tokens']['refreshToken'] as String);
      state = AuthState(user: RiderUser.fromJson(d['user'] as Map<String, dynamic>));
    } catch (e) { state = AuthState(error: e.toString()); rethrow; }
  }

  Future<void> logout() async {
    try { await api.post('/auth/logout'); } catch (_) {}
    await ApiClient.clear();
    state = const AuthState();
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) => AuthNotifier());
