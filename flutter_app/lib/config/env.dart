/// Runtime configuration — mirrors EXPO_PUBLIC_* env vars from the Expo app.
class Env {
  static const String apiDomain = String.fromEnvironment(
    'API_DOMAIN',
    defaultValue: 'khadma-api-server.onrender.com',
  );

  static const String neonAuthUrl = String.fromEnvironment(
    'NEON_AUTH_URL',
    defaultValue:
        'https://ep-green-brook-aso0ob6f.neonauth.c-4.eu-central-1.aws.neon.tech/neondb/auth',
  );

  /// Production API host (no scheme).
  static const String _defaultApiDomain = 'khadma-api-server.onrender.com';

  static String get apiBaseUrl {
    final domain = apiDomain.isNotEmpty ? apiDomain : _defaultApiDomain;
    final host = domain.replaceFirst(RegExp(r'^https?://'), '');
    return 'https://$host';
  }

  /// Prefer Render auth proxy — avoids Android 403 on direct Neon Auth.
  static String get authBaseUrl {
    final domain = apiDomain.isNotEmpty ? apiDomain : _defaultApiDomain;
    if (domain.isNotEmpty) {
      final host = domain.replaceFirst(RegExp(r'^https?://'), '');
      return 'https://$host/api/auth-proxy';
    }
    if (neonAuthUrl.isNotEmpty) return neonAuthUrl;
    return '';
  }

  /// Direct Neon URL (diagnostics only).
  static String get directNeonAuthUrl => neonAuthUrl;

  static bool get isConfigured =>
      apiDomain.isNotEmpty && (neonAuthUrl.isNotEmpty || apiDomain.isNotEmpty);
}
