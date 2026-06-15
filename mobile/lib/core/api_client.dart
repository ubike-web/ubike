import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'constants.dart';

class ApiClient {
  static ApiClient? _instance;
  late final Dio _dio;
  final _storage = const FlutterSecureStorage();

  ApiClient._() {
    _dio = Dio(BaseOptions(
      baseUrl: AppConstants.baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: AppConstants.tokenKey);
        if (token != null) {
          options.headers['token'] = token;
        }
        handler.next(options);
      },
    ));
  }

  static ApiClient get instance => _instance ??= ApiClient._();

  Future<dynamic> post(String path, {Map<String, dynamic>? data}) async {
    final res = await _dio.post(path, data: data);
    return res.data;
  }

  Future<dynamic> get(String path, {Map<String, dynamic>? params}) async {
    final res = await _dio.get(path, queryParameters: params);
    return res.data;
  }

  Future<void> saveToken(String token) async {
    await _storage.write(key: AppConstants.tokenKey, value: token);
  }

  Future<void> saveUserType(String type) async {
    await _storage.write(key: AppConstants.userTypeKey, value: type);
  }

  Future<String?> getToken() => _storage.read(key: AppConstants.tokenKey);
  Future<String?> getUserType() => _storage.read(key: AppConstants.userTypeKey);

  Future<void> logout() async {
    await _storage.deleteAll();
  }
}
