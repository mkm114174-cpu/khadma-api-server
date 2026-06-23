import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/theme/app_colors.dart';

const _storageKey = 'khadma.theme';

enum ThemeModePreference { dark, light }

final sharedPreferencesProvider = Provider<SharedPreferences>((ref) {
  throw UnimplementedError('SharedPreferences must be overridden in main()');
});

final themeModeProvider =
    StateNotifierProvider<ThemeModeNotifier, ThemeModePreference>((ref) {
  return ThemeModeNotifier(ref.watch(sharedPreferencesProvider));
});

final appColorsProvider = Provider<AppColors>((ref) {
  final mode = ref.watch(themeModeProvider);
  return mode == ThemeModePreference.light ? AppColors.light : AppColors.dark;
});

class ThemeModeNotifier extends StateNotifier<ThemeModePreference> {
  ThemeModeNotifier(this._prefs) : super(ThemeModePreference.dark) {
    _hydrate();
  }

  final SharedPreferences _prefs;

  void _hydrate() {
    final saved = _prefs.getString(_storageKey);
    if (saved == 'light') state = ThemeModePreference.light;
    if (saved == 'dark') state = ThemeModePreference.dark;
  }

  void setMode(ThemeModePreference mode) {
    state = mode;
    _prefs.setString(_storageKey, mode.name);
  }

  void toggle() {
    setMode(
      state == ThemeModePreference.dark
          ? ThemeModePreference.light
          : ThemeModePreference.dark,
    );
  }
}
