import 'package:dio/dio.dart';

import '../../config/env.dart';
import 'api_exception.dart';

typedef AuthTokenGetter = Future<String?> Function();

class ApiClient {
  ApiClient({Dio? dio, AuthTokenGetter? authTokenGetter})
      : _dio = dio ??
            Dio(
              BaseOptions(
                baseUrl: Env.apiBaseUrl,
                connectTimeout: const Duration(seconds: 60),
                receiveTimeout: const Duration(seconds: 60),
                headers: {'Accept': 'application/json'},
              ),
            ),
        _authTokenGetter = authTokenGetter;

  final Dio _dio;
  AuthTokenGetter? _authTokenGetter;

  void setAuthTokenGetter(AuthTokenGetter? getter) {
    _authTokenGetter = getter;
  }

  Future<T> fetch<T>(
    String path, {
    String method = 'GET',
    Map<String, dynamic>? queryParameters,
    Object? body,
    T Function(dynamic json)? parser,
  }) async {
    final headers = <String, dynamic>{};
    if (_authTokenGetter != null) {
      final token = await _authTokenGetter!();
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
    }

    try {
      final response = await _dio.request<dynamic>(
        '/api$path',
        data: body,
        queryParameters: queryParameters,
        options: Options(method: method, headers: headers),
      );
      final data = response.data;
      if (parser != null) return parser(data);
      return data as T;
    } on DioException catch (e) {
      final status = e.response?.statusCode ?? 0;
      final responseData = e.response?.data;
      String message = e.message ?? 'Network error';
      if (responseData is Map) {
        final detail = responseData['error'] ?? responseData['message'];
        if (detail is String) message = detail;
      }
      throw ApiException(
        status: status,
        message: message,
        data: responseData,
        url: e.requestOptions.uri.toString(),
        method: e.requestOptions.method,
      );
    }
  }

  Dio get rawDio => _dio;

  String get baseUrl => _dio.options.baseUrl;
}
