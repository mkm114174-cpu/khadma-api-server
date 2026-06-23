import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/notification_item.dart';
import 'auth_provider.dart';
import 'request_providers.dart';

final notificationsProvider = FutureProvider<List<NotificationItem>>((ref) async {
  try {
    final raw = await ref.watch(khadmaApiProvider).listNotifications();
    return raw
        .map((e) => NotificationItem.fromJson(e as Map<String, dynamic>))
        .toList();
  } catch (_) {
    return [];
  }
});
