import 'package:flutter/material.dart';
import 'package:flutter_feather_icons/flutter_feather_icons.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../core/theme/app_colors.dart';
import '../models/notification_item.dart';
import '../providers/auth_provider.dart';
import '../providers/language_provider.dart';
import '../providers/notification_providers.dart';
import '../providers/request_providers.dart';
import '../router/app_router.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(appStringsProvider);
    final isRtl = ref.watch(isRtlProvider);
    final async = ref.watch(notificationsProvider);

    return Scaffold(
      backgroundColor: AppColors.darkBg,
      appBar: AppBar(
        backgroundColor: AppColors.darkBg,
        foregroundColor: Colors.white,
        title: Text(isRtl ? 'الإشعارات' : 'Notifications'),
        actions: [
          async.maybeWhen(
            data: (list) {
              final unread = list.where((n) => !n.isRead).length;
              if (unread == 0) return const SizedBox.shrink();
              return TextButton(
                onPressed: () => _markAllRead(ref, list),
                child: Text(
                  isRtl ? 'قراءة الكل' : 'Mark all',
                  style: const TextStyle(color: AppColors.gold),
                ),
              );
            },
            orElse: () => const SizedBox.shrink(),
          ),
        ],
      ),
      body: async.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.gold),
        ),
        error: (_, __) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                isRtl ? 'تعذّر تحميل الإشعارات' : 'Failed to load',
                style: const TextStyle(color: Colors.white70),
              ),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: () => ref.invalidate(notificationsProvider),
                child: Text(t.layout.retry),
              ),
            ],
          ),
        ),
        data: (list) {
          if (list.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    FeatherIcons.bell,
                    size: 48,
                    color: Colors.white.withValues(alpha: 0.3),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    isRtl ? 'لا توجد إشعارات' : 'No notifications yet',
                    style: const TextStyle(color: Colors.white54),
                  ),
                ],
              ),
            );
          }
          return RefreshIndicator(
            color: AppColors.gold,
            onRefresh: () async => ref.invalidate(notificationsProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: list.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) => _NotificationCard(
                item: list[i],
                isRtl: isRtl,
                onTap: () => _onTap(context, ref, list[i]),
              ),
            ),
          );
        },
      ),
    );
  }

  Future<void> _markAllRead(WidgetRef ref, List<NotificationItem> list) async {
    final api = ref.read(khadmaApiProvider);
    for (final n in list.where((e) => !e.isRead)) {
      try {
        await api.markNotificationRead(n.id);
      } catch (_) {}
    }
    ref.invalidate(notificationsProvider);
  }

  Future<void> _onTap(
    BuildContext context,
    WidgetRef ref,
    NotificationItem item,
  ) async {
    if (!item.isRead) {
      try {
        await ref.read(khadmaApiProvider).markNotificationRead(item.id);
        ref.invalidate(notificationsProvider);
      } catch (_) {}
    }
    if (item.requestId != null && context.mounted) {
      context.push(AppRoutes.requestDetail(item.requestId!));
    }
  }
}

class _NotificationCard extends StatelessWidget {
  const _NotificationCard({
    required this.item,
    required this.isRtl,
    required this.onTap,
  });

  final NotificationItem item;
  final bool isRtl;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final meta = _typeMeta(item.type);
    final time = item.createdAt != null
        ? DateFormat.yMMMd().add_Hm().format(DateTime.parse(item.createdAt!))
        : '';

    return Material(
      color: item.isRead
          ? Colors.white.withValues(alpha: 0.05)
          : AppColors.gold.withValues(alpha: 0.12),
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: meta.color.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(meta.icon, color: meta.color, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      item.title ?? '',
                      textAlign: isRtl ? TextAlign.right : TextAlign.left,
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight:
                            item.isRead ? FontWeight.w500 : FontWeight.bold,
                      ),
                    ),
                    if (item.body != null && item.body!.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        item.body!,
                        textAlign: isRtl ? TextAlign.right : TextAlign.left,
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: Colors.white60, fontSize: 13),
                      ),
                    ],
                    if (time.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        time,
                        textAlign: isRtl ? TextAlign.right : TextAlign.left,
                        style: const TextStyle(color: Colors.white38, fontSize: 11),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

({IconData icon, Color color}) _typeMeta(String? type) {
  switch (type) {
    case 'offer':
      return (icon: FeatherIcons.tag, color: const Color(0xFF2196F3));
    case 'offer_accepted':
      return (icon: FeatherIcons.checkCircle, color: const Color(0xFF4CAF50));
    case 'request_new':
    case 'request_update':
      return (icon: FeatherIcons.refreshCw, color: AppColors.gold);
    case 'review':
      return (icon: FeatherIcons.star, color: AppColors.gold);
    default:
      return (icon: FeatherIcons.bell, color: AppColors.gold);
  }
}
