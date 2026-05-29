import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const _baseUrl = String.fromEnvironment('API_URL', defaultValue: 'https://ubike-api.onrender.com/api/v1');

class ApiClient {
  static final ApiClient _i = ApiClient._();
  factory ApiClient() => _i;
  ApiClient._() { _init(); }
  late final Dio _dio;
  static const _storage = FlutterSecureStorage();
  void _init() {
    _dio = Dio(BaseOptions(baseUrl: _baseUrl, connectTimeout: const Duration(seconds: 30), receiveTimeout: const Duration(seconds: 30)));
    _dio.interceptors.add(InterceptorsWrapper(onRequest: (opt, h) async { final t = await _storage.read(key: 'access_token'); if (t != null) opt.headers['Authorization'] = 'Bearer $t'; h.next(opt); }));
  }
  Future<dynamic> get(String path, {Map<String, dynamic>? params}) async => (await _dio.get(path, queryParameters: params)).data['data'];
  Future<dynamic> post(String path, {dynamic data}) async => (await _dio.post(path, data: data)).data['data'];
  Future<dynamic> patch(String path, {dynamic data}) async => (await _dio.patch(path, data: data)).data['data'];
  static Future<void> save(String a, String r) async { await _storage.write(key: 'access_token', value: a); await _storage.write(key: 'refresh_token', value: r); }
  static Future<void> clear() async => _storage.deleteAll();
  static Future<String?> token() async => _storage.read(key: 'access_token');
}
final api = ApiClient();
