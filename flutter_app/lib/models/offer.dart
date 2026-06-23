class Offer {
  const Offer({
    required this.id,
    required this.requestId,
    required this.providerId,
    required this.price,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    this.message,
    this.availableTime,
    this.estimatedDuration,
  });

  final int id;
  final int requestId;
  final int providerId;
  final int price;
  final String? message;
  final String? availableTime;
  final String? estimatedDuration;
  final String status;
  final String createdAt;
  final String updatedAt;

  factory Offer.fromJson(Map<String, dynamic> json) {
    return Offer(
      id: json['id'] as int,
      requestId: json['requestId'] as int,
      providerId: json['providerId'] as int,
      price: json['price'] as int,
      message: json['message'] as String?,
      availableTime: json['availableTime'] as String?,
      estimatedDuration: json['estimatedDuration'] as String?,
      status: json['status'] as String,
      createdAt: json['createdAt'] as String,
      updatedAt: json['updatedAt'] as String,
    );
  }

  bool get isAccepted => status == 'accepted';
  bool get isPending => status == 'pending';
}
