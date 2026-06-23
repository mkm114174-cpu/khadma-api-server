import 'package:equatable/equatable.dart';

class NotificationItem extends Equatable {
  const NotificationItem({
    required this.id,
    required this.isRead,
    this.title,
    this.body,
    this.type,
    this.createdAt,
    this.requestId,
  });

  final int id;
  final bool isRead;
  final String? title;
  final String? body;
  final String? type;
  final String? createdAt;
  final int? requestId;

  factory NotificationItem.fromJson(Map<String, dynamic> json) {
    final data = json['data'];
    int? requestId;
    if (data is Map<String, dynamic>) {
      final rid = data['requestId'];
      if (rid is int) requestId = rid;
      if (rid is String) requestId = int.tryParse(rid);
    }
    return NotificationItem(
      id: json['id'] as int,
      isRead: json['isRead'] as bool? ?? false,
      title: json['title'] as String?,
      body: json['body'] as String?,
      type: json['type'] as String?,
      createdAt: json['createdAt'] as String?,
      requestId: requestId,
    );
  }

  @override
  List<Object?> get props => [id, isRead];
}
