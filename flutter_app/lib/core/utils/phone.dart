/// Normalize Israeli phone — ported from artifacts/khadma/lib/phone.ts
String? normalizeIlPhone(String input) {
  var digits = input.replaceAll(RegExp(r'\D'), '');
  if (digits.startsWith('972')) {
    digits = '0${digits.substring(3)}';
  }
  if (RegExp(r'^0\d{8,9}$').hasMatch(digits)) return digits;
  return null;
}
