class ServiceRequest {
  const ServiceRequest({
    required this.id,
    required this.requestNumber,
    required this.userId,
    required this.skillId,
    required this.status,
    required this.includesSpareParts,
    required this.createdAt,
    required this.updatedAt,
    this.providerId,
    this.description,
    this.imageUrl,
    this.videoUrl,
    this.lat,
    this.lng,
    this.address,
    this.paymentMethod,
    this.preferredTime,
    this.scheduledTime,
    this.priceMin,
    this.priceMax,
  });

  final int id;
  final String requestNumber;
  final int userId;
  final int? providerId;
  final int skillId;
  final String? description;
  final String? imageUrl;
  final String? videoUrl;
  final bool includesSpareParts;
  final double? lat;
  final double? lng;
  final String? address;
  final String? paymentMethod;
  final String status;
  final String? preferredTime;
  final String? scheduledTime;
  final int? priceMin;
  final int? priceMax;
  final String createdAt;
  final String updatedAt;

  factory ServiceRequest.fromJson(Map<String, dynamic> json) {
    return ServiceRequest(
      id: json['id'] as int,
      requestNumber: json['requestNumber'] as String,
      userId: json['userId'] as int,
      providerId: json['providerId'] as int?,
      skillId: json['skillId'] as int,
      description: json['description'] as String?,
      imageUrl: json['imageUrl'] as String?,
      videoUrl: json['videoUrl'] as String?,
      includesSpareParts: json['includesSpareParts'] as bool? ?? false,
      lat: (json['lat'] as num?)?.toDouble(),
      lng: (json['lng'] as num?)?.toDouble(),
      address: json['address'] as String?,
      paymentMethod: json['paymentMethod'] as String?,
      status: json['status'] as String,
      preferredTime: json['preferredTime'] as String?,
      scheduledTime: json['scheduledTime'] as String?,
      priceMin: (json['priceMin'] as num?)?.toInt(),
      priceMax: (json['priceMax'] as num?)?.toInt(),
      createdAt: json['createdAt'] as String,
      updatedAt: json['updatedAt'] as String,
    );
  }

  bool get isPending => status == 'pending';
  bool get isActive => status == 'active' || status == 'in_progress';
  bool get isDone => status == 'completed' || status == 'cancelled';
}
