import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api_client.dart';

class AuthUser {
  final String id;
  final String role;
  final String? phone;
  final String? email;
  final String? fullName;
  final String? avatarUrl;
  final double walletBalance;
  final int loyaltyPoints;
  final String referralCode;

  const AuthUser({
    required this.id,
    required this.role,
    this.phone,
    this.email,
    this.fullName,
    this.avatarUrl,
    this.walletBalance = 0,
    this.loyaltyPoints = 0,
    this.referralCode = '',
  });

  factory AuthUser.fromJson(Map<String, dynamic> j) => AuthUser(
    id: j['id'] ?? '',
    role: j['role'] ?? 'customer',
    phone: j['phone'],
    email: j['email'],
    fullName: j['full_name'],
    avatarUrl: j['avatar_url'],
    walletBalance: (j['wallet_balance'] ?? 0).toDouble(),
    loyaltyPoints: j['loyalty_points'] ?? 0,
    referralCode: j['referral_code'] ?? '',
  );
}

class AuthState {
  final bool loading;
  final AuthUser? user;
  final String? error;

  const AuthState({this.loading = false, this.user, this.error});
  bool get isAuthenticated => user != null;
  AuthState copyWith({bool? loading, AuthUser? user, String? error}) =>
      AuthState(loading: loading ?? this.loading, user: user ?? this.user, error: error);
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(const AuthState()) { _restore(); }

  Future<void> _restore() async {
    final token = await ApiClient.getToken();
    if (token == null) return;
    try {
      final data = await api.get('/auth/me');
      state = AuthState(user: AuthUser.fromJson(data as Map<String, dynamic>));
    } catch (_) {
      await ApiClient.clearTokens();
    }
  }

  Future<void> sendOtp(String phone) async {
    state = const AuthState(loading: true);
    try {
      await api.post('/auth/otp/send', data: {'phone': phone});
      state = const AuthState();
    } catch (e) {
      state = AuthState(error: _err(e));
      rethrow;
    }
  }

  Future<void> verifyOtp(String phone, String otp, {String role = 'customer'}) async {
    state = const AuthState(loading: true);
    try {
      final data = await api.post('/auth/otp/verify', data: {'phone': phone, 'otp': otp, 'role': role}) as Map<String, dynamic>;
      await ApiClient.saveTokens(data['tokens']['accessToken'], data['tokens']['refreshToken']);
      state = AuthState(user: AuthUser.fromJson(data['user'] as Map<String, dynamic>));
    } catch (e) {
      state = AuthState(error: _err(e));
      rethrow;
    }
  }

  Future<void> registerEmail(String email, String password, String fullName) async {
    state = const AuthState(loading: true);
    try {
      final data = await api.post('/auth/register', data: {'email': email, 'password': password, 'full_name': fullName}) as Map<String, dynamic>;
      await ApiClient.saveTokens(data['tokens']['accessToken'], data['tokens']['refreshToken']);
      state = AuthState(user: AuthUser.fromJson(data['user'] as Map<String, dynamic>));
    } catch (e) {
      state = AuthState(error: _err(e));
      rethrow;
    }
  }

  Future<void> loginEmail(String email, String password) async {
    state = const AuthState(loading: true);
    try {
      final data = await api.post('/auth/login', data: {'email': email, 'password': password}) as Map<String, dynamic>;
      await ApiClient.saveTokens(data['tokens']['accessToken'], data['tokens']['refreshToken']);
      state = AuthState(user: AuthUser.fromJson(data['user'] as Map<String, dynamic>));
    } catch (e) {
      state = AuthState(error: _err(e));
      rethrow;
    }
  }

  Future<void> logout() async {
    try { await api.post('/auth/logout'); } catch (_) {}
    await ApiClient.clearTokens();
    state = const AuthState();
  }

  Future<void> refreshUser() async {
    try {
      final data = await api.get('/auth/me');
      state = state.copyWith(user: AuthUser.fromJson(data as Map<String, dynamic>));
    } catch (_) {}
  }

  String _err(dynamic e) {
    final msg = e.toString();
    final match = RegExp(r'"error":"([^"]+)"').firstMatch(msg);
    return match?.group(1) ?? msg.replaceFirst('Exception: ', '').replaceFirst('DioException', 'Network error');
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) => AuthNotifier());
