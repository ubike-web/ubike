import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../core/api_client.dart';

class AuthState {
  final bool isLoading;
  final String? userId;
  final String? role;
  final String? error;

  const AuthState({this.isLoading = false, this.userId, this.role, this.error});

  bool get isAuthenticated => userId != null;
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(const AuthState()) {
    _checkSession();
  }

  static const _storage = FlutterSecureStorage();

  Future<void> _checkSession() async {
    final token = await _storage.read(key: 'access_token');
    if (token != null) {
      try {
        final res = await api.get('/auth/me');
        final user = res.data['data'];
        state = AuthState(userId: user['id'], role: user['role']);
      } catch (_) {
        await _storage.deleteAll();
      }
    }
  }

  Future<void> sendOtp(String phone) async {
    state = const AuthState(isLoading: true);
    try {
      await api.post('/auth/otp/send', data: {'phone': phone});
      state = const AuthState();
    } catch (e) {
      state = AuthState(error: _extractError(e));
      throw Exception(state.error);
    }
  }

  Future<void> verifyOtp(String phone, String otp) async {
    state = const AuthState(isLoading: true);
    try {
      final res = await api.post('/auth/otp/verify', data: {'phone': phone, 'otp': otp, 'role': 'customer'});
      final data = res.data['data'];
      await _storage.write(key: 'access_token', value: data['tokens']['accessToken']);
      await _storage.write(key: 'refresh_token', value: data['tokens']['refreshToken']);
      state = AuthState(userId: data['user']['id'], role: data['user']['role']);
    } catch (e) {
      state = AuthState(error: _extractError(e));
      throw Exception(state.error);
    }
  }

  Future<void> logout() async {
    try {
      final refreshToken = await _storage.read(key: 'refresh_token');
      await api.post('/auth/logout', data: {'refresh_token': refreshToken});
    } catch (_) {}
    await _storage.deleteAll();
    state = const AuthState();
  }

  String _extractError(dynamic e) {
    if (e is Exception) {
      final msg = e.toString();
      if (msg.contains('"error"')) {
        final match = RegExp(r'"error":"([^"]+)"').firstMatch(msg);
        return match?.group(1) ?? msg;
      }
      return msg.replaceFirst('Exception: ', '');
    }
    return 'An error occurred';
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) => AuthNotifier());
