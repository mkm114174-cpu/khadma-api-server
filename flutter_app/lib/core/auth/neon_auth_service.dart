import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../config/env.dart';

/// Neon / Better Auth client — ported from artifacts/khadma/lib/neonAuth.ts
class NeonAuthService {
  NeonAuthService({
    FlutterSecureStorage? storage,
    SharedPreferences? prefs,
    Dio? dio,
  })  : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
            ),
        _prefs = prefs,
        _dio = dio ??
            Dio(
              BaseOptions(
                baseUrl: Env.authBaseUrl,
                connectTimeout: const Duration(seconds: 60),
                receiveTimeout: const Duration(seconds: 60),
                headers: const {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                },
              ),
            ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Mobile: use API origin (Android may strip khadma:// Origin).
          final apiOrigin = Env.apiBaseUrl;
          options.headers.putIfAbsent(
            'Origin',
            () => apiOrigin.isNotEmpty ? apiOrigin : 'khadma://',
          );
          options.headers.putIfAbsent('expo-origin', () => 'khadma://');
          options.headers.putIfAbsent('User-Agent', () => 'KhadmaApp/1.0');
          options.headers.putIfAbsent('Referer', () => 'khadma://');
          final cookie = await _buildCookieHeader();
          if (cookie != null && cookie.isNotEmpty) {
            options.headers['Cookie'] = cookie;
          }
          handler.next(options);
        },
        onResponse: (response, handler) async {
          await _captureAuthFromResponse(response);
          await _captureCookiesFromResponse(response);
          handler.next(response);
        },
      ),
    );
  }

  static const _jwtStoreKey = 'khadma_auth_jwt';
  static const _jwtPrefKey = 'khadma_auth_jwt_pref';
  static const _expoSessionCacheKey = 'khadma_session_data';
  static const _sessionPrefKey = 'khadma_session_data_pref';
  static const _expoCookieKey = 'khadma_cookie';
  static const _cookiePrefKey = 'khadma_cookie_pref';

  final FlutterSecureStorage _storage;
  final SharedPreferences? _prefs;
  final Dio _dio;

  String? _cachedJwt;
  int _cachedJwtExp = 0;
  Map<String, dynamic>? _cachedSessionPayload;
  Map<String, Map<String, dynamic>> _cookies = {};
  int? _lastProxyStatus;
  int? _lastDirectStatus;

  List<String> get _authBases {
    final proxy = '${Env.apiBaseUrl}/api/auth-proxy';
    final direct = Env.directNeonAuthUrl;
    final bases = <String>[];
    if (proxy.startsWith('http')) bases.add(proxy);
    if (direct.isNotEmpty && !bases.contains(direct)) bases.add(direct);
    return bases;
  }

  void _applyOriginForBase(String base, Map<String, dynamic> headers) {
    headers.putIfAbsent('expo-origin', () => 'khadma://');
    headers.putIfAbsent('User-Agent', () => 'KhadmaApp/1.0');
    headers.putIfAbsent('Referer', () => 'khadma://');
    if (base.contains('neonauth')) {
      headers.putIfAbsent('Origin', () => 'khadma://');
    } else {
      headers.putIfAbsent('Origin', () => Env.apiBaseUrl);
    }
  }

  void _recordAuthAttempt(String base, int? status) {
    if (base.contains('auth-proxy')) {
      _lastProxyStatus = status;
    } else if (base.contains('neonauth')) {
      _lastDirectStatus = status;
    }
  }

  String _authUrl(String base, String path) {
    final b = base.endsWith('/') ? base.substring(0, base.length - 1) : base;
    final p = path.startsWith('/') ? path : '/$path';
    return '$b$p';
  }

  Future<Response<Map<String, dynamic>>> _postAuth(
    String path, {
    Map<String, dynamic>? data,
  }) async {
    DioException? last;
    for (final base in _authBases) {
      try {
        final headers = <String, dynamic>{};
        _applyOriginForBase(base, headers);
        final cookie = await _buildCookieHeader();
        if (cookie != null && cookie.isNotEmpty) {
          headers['Cookie'] = cookie;
        }
        final response = await _dio.post<Map<String, dynamic>>(
          _authUrl(base, path),
          data: data,
          options: Options(
            headers: headers,
            validateStatus: (s) => s != null && s < 500,
          ),
        );
        _recordAuthAttempt(base, response.statusCode);
        if (response.statusCode == 403 || response.statusCode == 404) {
          continue;
        }
        await _captureAuthFromResponse(response);
        await _captureCookiesFromResponse(response);
        _dio.options.baseUrl = base;
        return response;
      } on DioException catch (e) {
        last = e;
        final code = e.response?.statusCode;
        _recordAuthAttempt(base, code);
        if (code == 403 || code == 404) continue;
        rethrow;
      }
    }
    throw last ?? DioException(requestOptions: RequestOptions(path: path));
  }

  Future<Response<dynamic>> _getAuth(
    String path, {
    Map<String, dynamic>? headers,
  }) async {
    DioException? last;
    for (final base in _authBases) {
      try {
        final merged = <String, dynamic>{...?headers};
        _applyOriginForBase(base, merged);
        final cookie = await _buildCookieHeader();
        if (cookie != null && cookie.isNotEmpty) {
          merged['Cookie'] = cookie;
        }
        final response = await _dio.get<dynamic>(
          _authUrl(base, path),
          options: Options(
            headers: merged,
            validateStatus: (s) => s != null && s < 500,
          ),
        );
        _recordAuthAttempt(base, response.statusCode);
        if (response.statusCode == 403 || response.statusCode == 404) {
          continue;
        }
        await _captureAuthFromResponse(response);
        await _captureCookiesFromResponse(response);
        _dio.options.baseUrl = base;
        return response;
      } on DioException catch (e) {
        last = e;
        final code = e.response?.statusCode;
        _recordAuthAttempt(base, code);
        if (code == 403 || code == 404) continue;
        rethrow;
      }
    }
    throw last ?? DioException(requestOptions: RequestOptions(path: path));
  }

  Future<bool> pingAuthServer() async {
    try {
      final response = await _getAuth('/get-session');
      final code = response.statusCode ?? 0;
      return code == 200 || code == 401;
    } catch (_) {
      return false;
    }
  }

  Future<({bool success, String? error})> signInWithEmail({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _postAuth(
        '/sign-in/email',
        data: {'email': email, 'password': password},
      );
      await _ensureJwtAfterAuth();
      final error = _extractError(response.data);
      if (error != null) return (success: false, error: error);
      final sessionOk = await _establishSessionAfterSignIn();
      if (!sessionOk) {
        return (success: false, error: 'تعذّر حفظ الجلسة. أعد تسجيل الدخول.');
      }
      return (success: true, error: null);
    } catch (e) {
      return (success: false, error: _formatError(e));
    }
  }

  Future<({bool success, String? error})> sendVerificationOtp({
    required String email,
    required String type,
  }) async {
    if (Env.authBaseUrl.isEmpty) {
      return (success: false, error: 'خادم التحقق غير مُعدّ في التطبيق.');
    }
    try {
      final response = await _postAuth(
        '/email-otp/send-verification-otp',
        data: {'email': email, 'type': type},
      );
      if (!_isOtpSendOk(response)) {
        final error = _extractError(response.data) ?? 'تعذّر إرسال الرمز';
        return (success: false, error: error);
      }
      return (success: true, error: null);
    } catch (e) {
      return (success: false, error: _formatError(e));
    }
  }

  Future<({bool success, String? error})> signInWithEmailOtp({
    required String email,
    required String otp,
  }) async {
    try {
      final response = await _postAuth(
        '/sign-in/email-otp',
        data: {'email': email, 'otp': otp},
      );
      final error = _extractError(response.data);
      if (error != null) return (success: false, error: error);
      final sessionOk = await _establishSessionAfterSignIn();
      if (!sessionOk) {
        return (
          success: false,
          error: 'تعذّر حفظ الجلسة بعد التحقق. أعد المحاولة.',
        );
      }
      return (success: true, error: null);
    } catch (e) {
      return (success: false, error: _formatError(e));
    }
  }

  Future<({bool success, String? error})> verifyEmailWithOtp({
    required String email,
    required String otp,
  }) async {
    try {
      final response = await _postAuth(
        '/email-otp/verify-email',
        data: {'email': email, 'otp': otp},
      );
      final error = _extractError(response.data);
      if (error != null) return (success: false, error: error);
      await _establishSessionAfterSignIn();
      return (success: true, error: null);
    } catch (e) {
      return (success: false, error: _formatError(e));
    }
  }

  Future<({bool success, String? error, bool needsVerify})> signUpWithEmail({
    required String email,
    required String password,
    required String name,
  }) async {
    try {
      final response = await _postAuth(
        '/sign-up/email',
        data: {'email': email, 'password': password, 'name': name},
      );
      await _ensureJwtAfterAuth();
      final error = _extractError(response.data);
      if (error != null) {
        return (success: false, error: error, needsVerify: false);
      }
      final user = response.data?['user'];
      final verified = user is Map && user['emailVerified'] == true;
      return (success: true, error: null, needsVerify: !verified);
    } catch (e) {
      return (success: false, error: _formatError(e), needsVerify: false);
    }
  }

  String _formatError(Object e) {
    if (_lastProxyStatus == 404) {
      return 'السيرفر على Render لم يُحدَّث بعد (auth-proxy مفقود). '
          'ارفع آخر كود API من المشروع ثم Manual Deploy.';
    }
    if (e is DioException) {
      final code = e.response?.statusCode;
      if (code == 403) {
        if (_lastProxyStatus == 404 || _lastProxyStatus == null) {
          return 'السيرفر يحتاج تحديث auth-proxy على Render، ثم أعد تثبيت APK.';
        }
        return 'رفض خادم التحقق (403). أضف khadma:// في Neon → Auth → Domains.';
      }
      if (code == 429) {
        return 'محاولات كثيرة. انتظر قليلاً ثم أعد الإرسال.';
      }
      final msg = e.response?.data;
      if (msg is Map) {
        final extracted = _extractError(Map<String, dynamic>.from(msg));
        if (extracted != null) return extracted;
      }
    }
    final text = e.toString();
    if (text.length > 120) return 'تعذّر إكمال الطلب. حاول مرة أخرى.';
    return text;
  }

  String? _extractError(Map<String, dynamic>? data) {
    if (data == null) return null;
    if (data['success'] == false) {
      final nested = data['error'];
      if (nested is Map) {
        final msg = nested['message'];
        if (msg is String && msg.isNotEmpty) return msg;
      }
      final message = data['message'];
      if (message is String && message.isNotEmpty) return message;
      if (nested is String && nested.isNotEmpty) return nested;
    }
    final error = data['error'];
    if (error is Map) {
      final msg = error['message'];
      if (msg is String && msg.isNotEmpty) return msg;
    }
    if (error is String && error.isNotEmpty) return error;
    return null;
  }

  bool _isOtpSendOk(Response<dynamic> response) {
    if (response.statusCode != null && response.statusCode! >= 400) return false;
    final data = response.data;
    if (data is Map && data['success'] == false) return false;
    return true;
  }

  /// After OTP/password sign-in: persist cookies, session, and JWT (matches Expo).
  Future<bool> _establishSessionAfterSignIn() async {
    for (var attempt = 0; attempt < 6; attempt++) {
      await _ensureJwtAfterAuth();
      if (await getAccessToken() != null) return true;

      final live = await _getSession();
      if (live?['session'] != null && live?['user'] != null) {
        await _ensureJwtAfterAuth();
        if (await getAccessToken() != null) return true;
        return true;
      }

      if (await _hasCachedAuthCookie()) {
        await Future<void>.delayed(Duration(milliseconds: 400 + attempt * 300));
        continue;
      }
      await Future<void>.delayed(Duration(milliseconds: 300 + attempt * 200));
    }
    return await getAccessToken() != null || await hasActiveSession();
  }

  Future<void> signOut() async {
    try {
      await _postAuth('/sign-out');
    } catch (_) {
      // ignore
    }
    await clearAccessTokenCache();
  }

  Future<void> clearAccessTokenCache() async {
    _cachedJwt = null;
    _cachedJwtExp = 0;
    _cachedSessionPayload = null;
    _cookies = {};
    try {
      await _storage.delete(key: _jwtStoreKey);
      await _storage.delete(key: _expoSessionCacheKey);
      await _storage.delete(key: _expoCookieKey);
    } catch (_) {}
    try {
      await _prefs?.remove(_jwtPrefKey);
      await _prefs?.remove(_sessionPrefKey);
      await _prefs?.remove(_cookiePrefKey);
    } catch (_) {}
  }

  Future<String?> getAccessToken() async {
    final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
    if (_cachedJwt != null && _cachedJwtExp > now + 30) {
      return _cachedJwt;
    }

    final stored = await _loadPersistedJwt();
    if (stored != null) return stored;

    final fromServer = await _fetchJwtFromServer();
    if (fromServer != null) return fromServer;

    final jwtFromSession = await _captureJwtFromSession();
    if (jwtFromSession != null) return jwtFromSession;

    // API accepts opaque Better Auth session tokens (not only JWT).
    return _readSessionToken();
  }

  Future<bool> hasActiveSession() async {
    final live = await _getSession();
    if (live?['session'] != null && live?['user'] != null) return true;

    if (_cachedSessionPayload != null) {
      final session = _cachedSessionPayload!['session'];
      final user = _cachedSessionPayload!['user'];
      if (session != null && user != null) return true;
    }

    final cached = await _readCachedExpoSession();
    if (cached?['session'] != null && cached?['user'] != null) return true;

    if (await _loadPersistedJwt() != null) return true;
    if (_cachedJwt != null) return true;

    final sessionToken = await _readSessionToken();
    if (sessionToken != null && sessionToken.isNotEmpty) return true;

    return _hasCachedAuthCookie();
  }

  Future<String?> refreshAccessToken() async {
    _cachedJwt = null;
    _cachedJwtExp = 0;
    return getAccessToken();
  }

  /// Waits for a JWT after OTP/sign-in — session cookies alone are not enough for the API.
  Future<String?> ensureAccessToken({int retries = 5}) async {
    for (var attempt = 0; attempt < retries; attempt++) {
      await _ensureJwtAfterAuth();
      final token = await getAccessToken();
      if (token != null) return token;
      if (attempt < retries - 1) {
        await Future<void>.delayed(Duration(seconds: 2 + attempt));
      }
    }
    return null;
  }

  Future<void> _ensureJwtAfterAuth() async {
    if (_cachedJwt != null) return;
    if (await _loadPersistedJwt() != null) return;
    await _fetchJwtFromServer();
    if (_cachedJwt == null) {
      await _captureJwtFromSession();
    }
  }

  Future<void> _captureAuthFromResponse(Response<dynamic> response) async {
    final jwt = _readAuthJwtHeader(response);
    if (jwt != null) {
      await _persistJwt(jwt);
      _rememberJwt(jwt);
    }

    final data = response.data;
    if (data is! Map<String, dynamic>) return;

    final user = data['user'];
    final sessionRaw = data['session'];
    final topLevelToken = data['token'];

    Map<String, dynamic>? sessionMap;
    if (sessionRaw is Map) {
      sessionMap = Map<String, dynamic>.from(sessionRaw);
    } else if (topLevelToken is String && topLevelToken.isNotEmpty) {
      // Better Auth email-otp often returns { token, user } without session object.
      sessionMap = {'token': topLevelToken};
    }

    if (sessionMap != null && user is Map) {
      if (topLevelToken is String &&
          topLevelToken.isNotEmpty &&
          sessionMap['token'] == null) {
        sessionMap['token'] = topLevelToken;
      }
      await _persistSessionPayload(sessionMap, Map<String, dynamic>.from(user));
    }

    if (topLevelToken is String && _isJwt(topLevelToken)) {
      await _persistJwt(topLevelToken);
      _rememberJwt(topLevelToken);
    }

    if (sessionMap != null) {
      final sessionToken = sessionMap['token'];
      if (sessionToken is String && _isJwt(sessionToken)) {
        await _persistJwt(sessionToken);
        _rememberJwt(sessionToken);
      }
    }
  }

  String? _readAuthJwtHeader(Response<dynamic> response) {
    final direct = response.headers.value('set-auth-jwt');
    if (direct != null && _isJwt(direct)) return direct;

    for (final entry in response.headers.map.entries) {
      if (entry.key.toLowerCase() != 'set-auth-jwt') continue;
      for (final value in entry.value) {
        if (_isJwt(value)) return value;
      }
    }
    return null;
  }

  Future<void> _captureCookiesFromResponse(Response<dynamic> response) async {
    final rawCookies = <String>[];
    response.headers.forEach((name, values) {
      if (name.toLowerCase() == 'set-cookie') {
        rawCookies.addAll(values);
      }
    });
    if (rawCookies.isEmpty) return;

    await _loadCookies();
    for (final raw in rawCookies) {
      final parsed = _parseSetCookie(raw);
      if (parsed == null) continue;
      _cookies[parsed.name] = {
        'value': parsed.value,
        if (parsed.expires != null) 'expires': parsed.expires,
      };
    }
    await _persistCookies();
  }

  ({String name, String value, String? expires})? _parseSetCookie(String raw) {
    final parts = raw.split(';');
    if (parts.isEmpty) return null;
    final nameValue = parts.first.trim();
    final eq = nameValue.indexOf('=');
    if (eq <= 0) return null;

    final name = nameValue.substring(0, eq).trim();
    final value = nameValue.substring(eq + 1).trim();
    if (name.isEmpty) return null;

    String? expires;
    for (final part in parts.skip(1)) {
      final segment = part.trim();
      if (segment.toLowerCase().startsWith('expires=')) {
        expires = segment.substring('expires='.length).trim();
      }
    }
    return (name: name, value: value, expires: expires);
  }

  Future<void> _loadCookies() async {
    if (_cookies.isNotEmpty) return;

    for (final key in [_expoCookieKey, _cookiePrefKey]) {
      try {
        String? raw;
        if (key == _expoCookieKey) {
          raw = await _storage.read(key: key);
        } else {
          raw = _prefs?.getString(key);
        }
        if (raw == null || raw == '{}') continue;
        final parsed = jsonDecode(raw) as Map<String, dynamic>;
        _cookies = parsed.map(
          (k, v) => MapEntry(k, Map<String, dynamic>.from(v as Map)),
        );
        return;
      } catch (_) {}
    }
  }

  Future<void> _persistCookies() async {
    if (_cookies.isEmpty) return;
    final encoded = jsonEncode(_cookies);
    try {
      await _storage.write(key: _expoCookieKey, value: encoded);
    } catch (_) {}
    try {
      await _prefs?.setString(_cookiePrefKey, encoded);
    } catch (_) {}
  }

  Future<String?> _buildCookieHeader() async {
    await _loadCookies();
    if (_cookies.isEmpty) return null;

    final now = DateTime.now();
    final parts = <String>[];
    for (final entry in _cookies.entries) {
      final value = entry.value['value'];
      if (value is! String || value.isEmpty) continue;
      final expires = entry.value['expires'];
      if (expires is String) {
        try {
          if (DateTime.parse(expires).isBefore(now)) continue;
        } catch (_) {}
      }
      parts.add('${entry.key}=$value');
    }
    return parts.isEmpty ? null : parts.join('; ');
  }

  Future<void> _persistSessionPayload(
    Map<String, dynamic> session,
    Map<String, dynamic> user,
  ) async {
    _cachedSessionPayload = {'session': session, 'user': user};
    final encoded = jsonEncode(_cachedSessionPayload);
    try {
      await _storage.write(key: _expoSessionCacheKey, value: encoded);
    } catch (_) {}
    try {
      await _prefs?.setString(_sessionPrefKey, encoded);
    } catch (_) {}
  }

  bool _isJwt(String value) => value.split('.').length == 3;

  int _readJwtExp(String token) {
    try {
      final parts = token.split('.');
      if (parts.length < 2) return 0;
      final normalized = parts[1].replaceAll('-', '+').replaceAll('_', '/');
      final padded = normalized.padRight(
        normalized.length + (4 - normalized.length % 4) % 4,
        '=',
      );
      final json = utf8.decode(base64.decode(padded));
      final parsed = jsonDecode(json) as Map<String, dynamic>;
      final exp = parsed['exp'];
      return exp is int ? exp : 0;
    } catch (_) {
      return 0;
    }
  }

  void _rememberJwt(String token) {
    _cachedJwt = token;
    _cachedJwtExp = _readJwtExp(token);
  }

  Future<void> _persistJwt(String token) async {
    final payload = jsonEncode({'token': token, 'exp': _readJwtExp(token)});
    try {
      await _storage.write(key: _jwtStoreKey, value: payload);
    } catch (_) {}
    try {
      await _prefs?.setString(_jwtPrefKey, payload);
    } catch (_) {}
  }

  Future<String?> _loadPersistedJwt() async {
    for (final loader in [_loadJwtFromSecureStore, _loadJwtFromPrefs]) {
      final token = await loader();
      if (token != null) return token;
    }
    return null;
  }

  Future<String?> _loadJwtFromSecureStore() async {
    try {
      final raw = await _storage.read(key: _jwtStoreKey);
      return _parseStoredJwt(raw);
    } catch (_) {
      return null;
    }
  }

  Future<String?> _loadJwtFromPrefs() async {
    try {
      return _parseStoredJwt(_prefs?.getString(_jwtPrefKey));
    } catch (_) {
      return null;
    }
  }

  String? _parseStoredJwt(String? raw) {
    if (raw == null) return null;
    try {
      final parsed = jsonDecode(raw) as Map<String, dynamic>;
      final token = parsed['token'];
      if (token is! String || !_isJwt(token)) return null;
      final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
      final exp =
          parsed['exp'] is int ? parsed['exp'] as int : _readJwtExp(token);
      if (exp > now + 30) {
        _rememberJwt(token);
        return token;
      }
    } catch (_) {}
    return null;
  }

  Future<Map<String, dynamic>?> _getSession() async {
    try {
      final jwt = _cachedJwt ?? await _loadPersistedJwt();
      final response = await _getAuth(
        '/get-session',
        headers: jwt != null ? {'Authorization': 'Bearer $jwt'} : null,
      );
      final data = response.data;
      if (data is Map<String, dynamic> &&
          data['session'] != null &&
          data['user'] != null) {
        return data;
      }
    } catch (_) {}
    return null;
  }

  Future<Map<String, dynamic>?> _readCachedExpoSession() async {
    if (_cachedSessionPayload != null) {
      final session = _cachedSessionPayload!['session'];
      final user = _cachedSessionPayload!['user'];
      if (session != null && user != null) {
        return _cachedSessionPayload;
      }
    }

    for (final loader in [_readSessionFromSecureStore, _readSessionFromPrefs]) {
      final parsed = await loader();
      if (parsed != null) {
        _cachedSessionPayload = parsed;
        return parsed;
      }
    }
    return null;
  }

  Future<Map<String, dynamic>?> _readSessionFromSecureStore() async {
    try {
      return _parseSessionPayload(await _storage.read(key: _expoSessionCacheKey));
    } catch (_) {
      return null;
    }
  }

  Future<Map<String, dynamic>?> _readSessionFromPrefs() async {
    try {
      return _parseSessionPayload(_prefs?.getString(_sessionPrefKey));
    } catch (_) {
      return null;
    }
  }

  Map<String, dynamic>? _parseSessionPayload(String? raw) {
    if (raw == null || raw == '{}') return null;
    try {
      final parsed = jsonDecode(raw) as Map<String, dynamic>;
      final session = parsed['session'];
      final user = parsed['user'];
      if (session == null || user == null) return null;
      if (session is Map && session['expiresAt'] is String) {
        if (DateTime.parse(session['expiresAt'] as String)
            .isBefore(DateTime.now())) {
          return null;
        }
      }
      return parsed;
    } catch (_) {
      return null;
    }
  }

  Future<bool> _hasCachedAuthCookie() async {
    await _loadCookies();
    if (_cookies.isEmpty) return false;

    final now = DateTime.now();
    for (final entry in _cookies.values) {
      final value = entry['value'];
      if (value == null || (value is String && value.isEmpty)) continue;
      final expires = entry['expires'];
      if (expires is String) {
        try {
          if (DateTime.parse(expires).isBefore(now)) continue;
        } catch (_) {}
      }
      return true;
    }
    return false;
  }

  Future<String?> _readSessionToken() async {
    final live = await _getSession();
    final liveToken = live?['session']?['token'];
    if (liveToken is String && liveToken.isNotEmpty) return liveToken;

    final cached = await _readCachedExpoSession();
    final cachedToken = cached?['session']?['token'];
    if (cachedToken is String && cachedToken.isNotEmpty) return cachedToken;

    return null;
  }

  Future<String?> _fetchJwtFromServer() async {
    final sessionToken = await _readSessionToken();
    if (sessionToken == null) return null;

    try {
      final response = await _getAuth(
        '/token',
        headers: {'Authorization': 'Bearer $sessionToken'},
      );
      final data = response.data;
      if (data is Map<String, dynamic>) {
        final token = data['token'];
        if (token is String && _isJwt(token)) {
          await _persistJwt(token);
          _rememberJwt(token);
          return token;
        }
      }
    } catch (_) {}
    return null;
  }

  Future<String?> _captureJwtFromSession() async {
    try {
      final jwt = _cachedJwt ?? await _loadPersistedJwt();
      await _getAuth(
        '/get-session',
        headers: jwt != null ? {'Authorization': 'Bearer $jwt'} : null,
      );
      if (_cachedJwt != null) return _cachedJwt;
    } catch (_) {}
    return null;
  }
}
