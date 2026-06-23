import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../l10n/app_locale.dart';
import '../l10n/app_strings.dart';
import 'theme_provider.dart';

const _langStorageKey = 'khadma.lang';

final languageProvider =
    StateNotifierProvider<LanguageNotifier, AppLocale>((ref) {
  return LanguageNotifier(ref.watch(sharedPreferencesProvider));
});

final appStringsProvider = Provider<AppStrings>((ref) {
  final locale = ref.watch(languageProvider);
  return AppStrings.of(locale);
});

final isRtlProvider = Provider<bool>((ref) {
  return ref.watch(languageProvider).isRtl;
});

final hasSavedLanguageProvider = Provider<bool>((ref) {
  return ref.watch(sharedPreferencesProvider).containsKey(_langStorageKey);
});

class LanguageNotifier extends StateNotifier<AppLocale> {
  LanguageNotifier(this._prefs) : super(AppLocale.ar) {
    _hydrate();
  }

  final SharedPreferences _prefs;

  void _hydrate() {
    final saved = _prefs.getString(_langStorageKey);
    final locale = AppLocaleX.fromCode(saved);
    if (locale != null) state = locale;
  }

  Future<void> setLang(AppLocale locale) async {
    state = locale;
    await _prefs.setString(_langStorageKey, locale.code);
  }
}
