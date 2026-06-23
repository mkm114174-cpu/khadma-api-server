class ProviderProfile {
  const ProviderProfile({
    required this.id,
    required this.userId,
    required this.rating,
    required this.ratingCount,
    this.name,
    this.serviceType,
    this.lat,
    this.lng,
    this.isAvailable = false,
    this.status,
  });

  final int id;
  final int userId;
  final String? name;
  final String? serviceType;
  final double rating;
  final int ratingCount;
  final double? lat;
  final double? lng;
  final bool isAvailable;
  final String? status;

  factory ProviderProfile.fromJson(Map<String, dynamic> json) {
    return ProviderProfile(
      id: json['id'] as int,
      userId: json['userId'] as int,
      name: json['name'] as String?,
      serviceType: json['serviceType'] as String?,
      rating: (json['rating'] as num?)?.toDouble() ?? 0,
      ratingCount: json['ratingCount'] as int? ?? 0,
      lat: (json['lat'] as num?)?.toDouble(),
      lng: (json['lng'] as num?)?.toDouble(),
      isAvailable: json['isAvailable'] as bool? ?? false,
      status: json['status'] as String?,
    );
  }
}
