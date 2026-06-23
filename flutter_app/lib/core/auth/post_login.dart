import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/utils/email.dart';
import '../../l10n/app_locale.dart';
import '../../models/user.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import '../../providers/theme_provider.dart';

/// Auto-create account after OTP — skips name/complete-profile screen.
Future<bool> autoProvisionAfterLogin(WidgetRef ref, {required String email}) async {
  final prefs = ref.read(sharedPreferencesProvider);
  final authService = ref.read(neonAuthServiceProvider);
  await authService.ensureAccessToken(retries: 8);

  final role = prefs.getString('khadma:intendedRole') ?? 'customer';
  final locale = ref.read(languageProvider);
  final name = normalizeEmail(email).split('@').first;
  final displayName = name.length >= 2 ? name : 'User';

  if (ref.read(authProvider).status == AuthStatus.ready) {
    await prefs.remove('khadma:intendedRole');
    await prefs.remove('khadma:pendingEmail');
    return true;
  }

  Future<bool> tryProvision() async {
    await ref.read(authProvider.notifier).provision(
          ProvisionInput(
            name: displayName,
            role: role,
            email: normalizeEmail(email),
            language: locale.code,
            commissionAgreed: role == 'provider' ? true : null,
          ),
        );
    return ref.read(authProvider).status == AuthStatus.ready;
  }

  try {
    if (await tryProvision()) {
      await prefs.remove('khadma:intendedRole');
      await prefs.remove('khadma:pendingEmail');
      return true;
    }
  } catch (_) {}

  try {
    await ref.read(authProvider.notifier).refresh();
    if (ref.read(authProvider).status == AuthStatus.ready) {
      await prefs.remove('khadma:intendedRole');
      await prefs.remove('khadma:pendingEmail');
      return true;
    }
    if (await tryProvision()) {
      await prefs.remove('khadma:intendedRole');
      await prefs.remove('khadma:pendingEmail');
      return true;
    }
  } catch (_) {}

  return false;
}

String resolveIntendedRole(WidgetRef ref) {
  final auth = ref.read(authProvider);
  if (auth.role == AppRole.provider) return 'provider';
  return ref.read(sharedPreferencesProvider).getString('khadma:intendedRole') ??
      'customer';
}
