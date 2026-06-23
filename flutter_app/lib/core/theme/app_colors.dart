import 'package:flutter/material.dart';

/// Design tokens — ported from artifacts/khadma/constants/colors.ts
class AppColors {
  const AppColors({
    required this.text,
    required this.tint,
    required this.background,
    required this.foreground,
    required this.card,
    required this.cardForeground,
    required this.primary,
    required this.primaryForeground,
    required this.secondary,
    required this.secondaryForeground,
    required this.muted,
    required this.mutedForeground,
    required this.accent,
    required this.accentForeground,
    required this.destructive,
    required this.destructiveForeground,
    required this.border,
    required this.input,
    this.radius = 20,
  });

  final Color text;
  final Color tint;
  final Color background;
  final Color foreground;
  final Color card;
  final Color cardForeground;
  final Color primary;
  final Color primaryForeground;
  final Color secondary;
  final Color secondaryForeground;
  final Color muted;
  final Color mutedForeground;
  final Color accent;
  final Color accentForeground;
  final Color destructive;
  final Color destructiveForeground;
  final Color border;
  final Color input;
  final double radius;

  static const gold = Color(0xFFC8A574);
  static const tabBarBg = Color(0xFF1A1A2E);
  static const darkBg = Color(0xFF0A0A0A);

  static const light = AppColors(
    text: Color(0xFF1A1A2E),
    tint: gold,
    background: Color(0xFFF8F5F0),
    foreground: Color(0xFF1A1A2E),
    card: Color(0xFFFFFFFF),
    cardForeground: Color(0xFF1A1A2E),
    primary: gold,
    primaryForeground: Color(0xFFFFFFFF),
    secondary: Color(0xFFF0EDE8),
    secondaryForeground: Color(0xFF1A1A2E),
    muted: Color(0xFFF0EDE8),
    mutedForeground: Color(0xFF7A7A8A),
    accent: gold,
    accentForeground: Color(0xFFFFFFFF),
    destructive: Color(0xFFE53935),
    destructiveForeground: Color(0xFFFFFFFF),
    border: Color(0xFFE8E4DC),
    input: Color(0xFFF0EDE8),
  );

  static const dark = AppColors(
    text: Color(0xFFFFFFFF),
    tint: gold,
    background: darkBg,
    foreground: Color(0xFFFFFFFF),
    card: Color(0xFF141414),
    cardForeground: Color(0xFFFFFFFF),
    primary: gold,
    primaryForeground: Color(0xFFFFFFFF),
    secondary: Color(0xFF1E1E1E),
    secondaryForeground: Color(0xFFFFFFFF),
    muted: Color(0xFF1E1E1E),
    mutedForeground: Color(0xFF888888),
    accent: gold,
    accentForeground: Color(0xFFFFFFFF),
    destructive: Color(0xFFE53935),
    destructiveForeground: Color(0xFFFFFFFF),
    border: Color(0xFF2A2A2A),
    input: Color(0xFF1E1E1E),
  );
}
