import 'package:equatable/equatable.dart';

enum AppRole { customer, provider, admin }

class User extends Equatable {
  const User({
    required this.id,
    required this.authUserId,
    required this.name,
    required this.role,
    this.email,
    this.phone,
    this.avatarUrl,
    this.address,
    this.lat,
    this.lng,
    this.commissionAgreedAt,
    required this.createdAt,
    required this.updatedAt,
  });

  final int id;
  final String authUserId;
  final String name;
  final String? email;
  final String? phone;
  final AppRole role;
  final String? avatarUrl;
  final String? address;
  final double? lat;
  final double? lng;
  final String? commissionAgreedAt;
  final String createdAt;
  final String updatedAt;

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as int,
      authUserId: json['authUserId'] as String,
      name: json['name'] as String,
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      role: AppRole.values.firstWhere(
        (r) => r.name == json['role'],
        orElse: () => AppRole.customer,
      ),
      avatarUrl: json['avatarUrl'] as String?,
      address: json['address'] as String?,
      lat: (json['lat'] as num?)?.toDouble(),
      lng: (json['lng'] as num?)?.toDouble(),
      commissionAgreedAt: json['commissionAgreedAt'] as String?,
      createdAt: json['createdAt'] as String,
      updatedAt: json['updatedAt'] as String,
    );
  }

  @override
  List<Object?> get props => [id, authUserId, name, role];
}
