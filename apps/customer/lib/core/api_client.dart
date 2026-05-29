import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'constants.dart';

class ApiClient {
  static final ApiClient _i = ApiClient._();
  factory ApiClient() => _i;
  ApiClient._() { _init(); }

  late final Dio _dio;
  static const _storage = FlutterSecureStorage();

  void _init() {
    _dio = Dio(BaseOptions(
      baseUrl: kApiUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (opt, handler) async {
        final token = await _storage.read(key: 'access_token');
        if (token != null) opt.headers['Authorization'] = 'Bearer $token';
        handler.next(opt);
      },
      onError: (err, handler) async {
        if (err.response?.statusCode == 401) {
          if (await _refresh()) {
            final token = await _storage.read(key: 'access_token');
            err.requestOptions.headers['Authorization'] = 'Bearer $token';
            return handler.resolve(await _dio.fetch(err.requestOptions));
          }
        }
        handler.next(err);
      },
    ));
  }

  Future<bool> _refresh() async {
    try {
      final rt = await _storage.read(key: 'refresh_token');
      if (rt == null) return false;
      final res = await _dio.post('/auth/refresh', data: {'refresh_token': rt});
      final d = res.data['data'];
      await _storage.write(key: 'access_token', value: d['accessToken']);
      await _storage.write(key: 'refresh_token', value: d['refreshToken']);
      return true;
    } catch (_) {
      await _storage.deleteAll();
      return false;
    }
  }

  Future<dynamic> get(String path, {Map<String, dynamic>? params}) async {
    final r = await _dio.get(path, queryParameters: params);
    return r.data['data'];
  }

  Future<dynamic> post(String path, {dynamic data}) async {
    final r = await _dio.post(path, data: data);
    return r.data['data'];
  }

  Future<dynamic> patch(String path, {dynamic data}) async {
    final r = await _dio.patch(path, data: data);
    return r.data['data'];
  }

  Future<dynamic> delete(String path) async {
    final r = await _dio.delete(path);
    return r.data['data'];
  }

  static Future<void> saveTokens(String access, String refresh) async {
    await _storage.write(key: 'access_token', value: access);
    await _storage.write(key: 'refresh_token', value: refresh);
  }

  static Future<void> clearTokens() async => _storage.deleteAll();
  static Future<String?> getToken() async => _storage.read(key: 'access_token');
}

final api = ApiClient();
