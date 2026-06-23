import 'package:flutter/material.dart';

import 'app_colors.dart';

class AppTheme {
  static ThemeData build(ThemeMode mode) {
    final colors = mode == ThemeMode.light ? AppColors.light : AppColors.dark;
    return ThemeData(
      useMaterial3: true,
      brightness: mode == ThemeMode.light ? Brightness.light : Brightness.dark,
      scaffoldBackgroundColor: colors.background,
      colorScheme: ColorScheme(
        brightness: mode == ThemeMode.light ? Brightness.light : Brightness.dark,
        primary: colors.primary,
        onPrimary: colors.primaryForeground,
        secondary: colors.secondary,
        onSecondary: colors.secondaryForeground,
        error: colors.destructive,
        onError: colors.destructiveForeground,
        surface: colors.card,
        onSurface: colors.foreground,
      ),
      dividerColor: colors.border,
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: colors.input,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: colors.border, width: 1.5),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: colors.border, width: 1.5),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: colors.primary, width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
      fontFamily: 'Roboto',
    );
  }
}
