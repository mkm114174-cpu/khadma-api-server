import 'package:dio/dio.dart';

import '../../config/env.dart';
import 'api_exception.dart';

typedef AuthTokenGetter = Future<String?> Function();

/// HTTP client — mirrors lib/api-client-react/src/custom-fetch.ts
class ApiClient {
  ApiClient({Dio? dio, AuthTokenGetter? authTokenGetter})
      : _dio = dio ??
            Dio(
              BaseOptions(
                baseUrl: Env.apiBaseUrl,
                connectTimeout: const Duration(seconds: 60),
                receiveTimeout: const Duration(seconds: 60),
                headers: {
                  'Accept': 'application/json, application/problem+json',
                },
              ),
            ),
        _authTokenGetter = authTokenGetter;

  final Dio _dio;
  AuthTokenGetter? _authTokenGetter;

  void setBaseUrl(String? url) {
    if (url == null || url.isEmpty) return;
    _dio.options.baseUrl = url.replaceAll(RegExp(r'/+$'), '');
  }

  void setAuthTokenGetter(AuthTokenGetter? getter) {
    _authTokenGetter = getter;
  }

  Future<T> fetch<T>(
    String path, {
    String method = 'GET',
    Map<String, dynamic>? queryParameters,
    Object? body,
    Map<String, String>? headers,
    T Function(dynamic json)? parser,
  }) async {
    final mergedHeaders = <String, dynamic>{...?headers};

    if (_authTokenGetter != null && !mergedHeaders.containsKey('Authorization')) {
      final token = await _authTokenGetter!();
      if (token != null && token.isNotEmpty) {
        mergedHeaders['Authorization'] = 'Bearer $token';
      }
    }

    try {
      final response = await _dio.request<dynamic>(
        path,
        data: body,
        queryParameters: queryParameters,
        options: Options(method: method, headers: mergedHeaders),
      );

      final data = response.data;
      if (parser != null) return parser(data);
      return data as T;
    } on DioException catch (e) {
      final status = e.response?.statusCode ?? 0;
      final responseData = e.response?.data;
      throw ApiException(
        status: status,
        message: _buildErrorMessage(status, e.message, responseData),
        data: responseData,
        url: e.requestOptions.uri.toString(),
        method: e.requestOptions.method,
      );
    }
  }

  String _buildErrorMessage(int status, String? dioMessage, dynamic data) {
    if (data is Map) {
      final detail = data['detail'] ?? data['message'] ?? data['error'];
      if (detail is String && detail.isNotEmpty) {
        return 'HTTP $status: $detail';
      }
    }
    if (dioMessage != null && dioMessage.isNotEmpty) {
      return 'HTTP $status: $dioMessage';
    }
    return 'HTTP $status';
  }
}
