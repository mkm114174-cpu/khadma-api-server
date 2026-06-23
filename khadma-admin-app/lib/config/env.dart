/// إعدادات التطبيق — مرّر القيم عند البناء:
/// flutter run --dart-define=API_DOMAIN=khadma-api-server.onrender.com \
///   --dart-define=CLERK_PUBLISHABLE_KEY=pk_test_... \
///   --dart-define=CLERK_FRONTEND_API=https://your-instance.clerk.accounts.dev
class Env {
  static const String apiDomain = String.fromEnvironment(
    'API_DOMAIN',
    defaultValue: 'khadma-api-server.onrender.com',
  );

  static const String clerkPublishableKey = String.fromEnvironment(
    'CLERK_PUBLISHABLE_KEY',
    defaultValue: '',
  );

  /// Clerk Frontend API URL (من لوحة Clerk → API Keys)
  static const String clerkFrontendApi = String.fromEnvironment(
    'CLERK_FRONTEND_API',
    defaultValue: '',
  );

  static String get apiBaseUrl {
    final host = apiDomain.replaceFirst(RegExp(r'^https?://'), '');
    return 'https://$host';
  }

  static bool get isConfigured => apiDomain.isNotEmpty;
}
