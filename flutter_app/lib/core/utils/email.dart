/// Normalize email for Neon Auth + DB matching (always lowercase).
String normalizeEmail(String input) => input.trim().toLowerCase();

bool isValidEmail(String input) =>
    RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(normalizeEmail(input));
