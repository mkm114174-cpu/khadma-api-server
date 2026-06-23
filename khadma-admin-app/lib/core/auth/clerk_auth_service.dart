import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../config/env.dart';

/// تسجيل دخول الأدمن عبر السيرفر — لا يتصل بـ Clerk مباشرة من الهاتف.
class ClerkAuthService {
  ClerkAuthService({Dio? dio, FlutterSecureStorage? storage})
      : _dio = dio ?? Dio(),
        _storage = storage ?? const FlutterSecureStorage();

  final Dio _dio;
  final FlutterSecureStorage _storage;

  static const _tokenKey = 'khadma_admin:session_jwt';

  Future<String?> getSessionToken() => _storage.read(key: _tokenKey);

  Future<void> signOut() => _storage.delete(key: _tokenKey);

  Future<void> signInWithPassword({
    required String email,
    required String password,
  }) async {
    try {
      final res = await _dio.post<Map<String, dynamic>>(
        '${Env.apiBaseUrl}/api/admin/auth/login',
        data: {'email': email.trim(), 'password': password},
        options: Options(
          validateStatus: (s) => s != null && s < 500,
          headers: {'Content-Type': 'application/json'},
        ),
      );

      final data = res.data;
      if (res.statusCode == 200 && data?['token'] is String) {
        await _storage.write(
          key: _tokenKey,
          value: data!['token'] as String,
        );
        return;
      }

      throw _mapResponse(res.statusCode, data);
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionError ||
          e.message?.contains('Failed host lookup') == true) {
        throw Exception(
          'تعذّر الاتصال بالإنترنت. تأكد من اتصال الهاتف بالشبكة.',
        );
      }
      throw _mapResponse(e.response?.statusCode, e.response?.data);
    }
  }

  Exception _mapResponse(int? code, dynamic data) {
    String? serverMsg;
    String? detail;
    if (data is Map) {
      serverMsg = data['error'] as String?;
      detail = data['detail'] as String?;
    }

    if (code == 404) {
      return Exception(
        'السيرفر يحتاج تحديث على Render.\n'
        'ادخل Render → khadma-api → Manual Deploy → Deploy latest commit',
      );
    }
    if (code == 401) {
      return Exception('إيميل أو كلمة مرور غير صحيحة');
    }
    if (code == 403) {
      return Exception('هذا الحساب ليس أدمن — استخدم حساب إدارة المنصة');
    }
    if (code == 503 && serverMsg?.contains('CLERK_SECRET_KEY') == true) {
      return Exception(
        'أضف CLERK_SECRET_KEY في إعدادات Render ثم أعد النشر',
      );
    }
    if (detail != null && detail.isNotEmpty) {
      return Exception('$serverMsg\n$detail');
    }
    return Exception(serverMsg ?? 'تعذّر تسجيل الدخول، حاول مجدداً');
  }
}
