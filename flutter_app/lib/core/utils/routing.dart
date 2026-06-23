import 'dart:math' as math;

class LatLng {
  const LatLng({required this.latitude, required this.longitude});

  final double latitude;
  final double longitude;
}

double haversineKm(LatLng a, LatLng b) {
  const r = 6371.0;
  final dLat = _toRad(b.latitude - a.latitude);
  final dLng = _toRad(b.longitude - a.longitude);
  final lat1 = _toRad(a.latitude);
  final lat2 = _toRad(b.latitude);
  final h = math.pow(math.sin(dLat / 2), 2) +
      math.cos(lat1) * math.cos(lat2) * math.pow(math.sin(dLng / 2), 2);
  return 2 * r * math.asin(math.sqrt(h));
}

double _toRad(double deg) => deg * math.pi / 180;

String formatDistance(double km) {
  if (km < 1) return '${(km * 1000).round()} م';
  return '${km.toStringAsFixed(km < 10 ? 1 : 0)} كم';
}
