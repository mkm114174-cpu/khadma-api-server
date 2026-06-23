import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AdminColors {
  static const gold = Color(0xFFC8A574);
  static const bg = Color(0xFF0D0D10);
  static const card = Color(0xFF16161C);
  static const border = Color(0xFF2A2A32);
  static const muted = Color(0xFF8A8A96);
  static const success = Color(0xFF4CAF50);
  static const danger = Color(0xFFE57373);
  static const warning = Color(0xFFFFB74D);
}

ThemeData buildAdminTheme() {
  final base = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: AdminColors.bg,
    colorScheme: const ColorScheme.dark(
      primary: AdminColors.gold,
      surface: AdminColors.card,
      onPrimary: Colors.black,
    ),
  );
  return base.copyWith(
    textTheme: GoogleFonts.cairoTextTheme(base.textTheme),
    appBarTheme: const AppBarTheme(
      backgroundColor: AdminColors.bg,
      foregroundColor: Colors.white,
      elevation: 0,
    ),
    cardTheme: CardThemeData(
      color: AdminColors.card,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: AdminColors.border),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AdminColors.card,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AdminColors.border),
      ),
    ),
  );
}
