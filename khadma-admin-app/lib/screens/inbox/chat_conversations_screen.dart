import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../providers/admin_providers.dart';
import '../../widgets/admin_drawer.dart';
import '../../core/theme/admin_theme.dart';
import '../../router/app_router.dart';

class ChatConversationsScreen extends ConsumerWidget {
  const ChatConversationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final convs = ref.watch(chatConversationsProvider);
    final fmt = DateFormat('dd/MM HH:mm', 'ar');

    return AdminPage(
      title: 'محادثات الطلبات',
      actions: [
        IconButton(
          icon: const Icon(Icons.refresh),
          onPressed: () => ref.invalidate(chatConversationsProvider),
        ),
      ],
      child: convs.when(
        loading: () =>
            const Center(child: CircularProgressIndicator(color: AdminColors.gold)),
        error: (e, _) => Center(child: Text('$e')),
        data: (list) {
          if (list.isEmpty) {
            return const Center(
              child: Text('لا توجد محادثات بعد',
                  style: TextStyle(color: AdminColors.muted)),
            );
          }
          return RefreshIndicator(
            color: AdminColors.gold,
            onRefresh: () async => ref.invalidate(chatConversationsProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: list.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) {
                final c = list[i];
                final at = DateTime.tryParse('${c['lastMessageAt']}');
                return Card(
                  child: ListTile(
                    onTap: () => context.push(
                      AppRoutes.chatThread(
                        c['requestId'] as int,
                        c['providerId'] as int,
                      ),
                    ),
                    leading: CircleAvatar(
                      backgroundColor: AdminColors.gold.withValues(alpha: 0.2),
                      child: const Icon(Icons.chat, color: AdminColors.gold, size: 20),
                    ),
                    title: Text(
                      'طلب ${c['requestNumber'] ?? c['requestId']}',
                      style: const TextStyle(
                          color: Colors.white, fontWeight: FontWeight.w600),
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${c['customerName'] ?? 'عميل'} ↔ ${c['providerName'] ?? 'مزوّد'}',
                          style: const TextStyle(color: AdminColors.muted, fontSize: 12),
                        ),
                        if (c['lastMessage'] != null)
                          Text(
                            '${c['lastMessage']}',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(color: Colors.white70),
                          ),
                        if (at != null)
                          Text(fmt.format(at),
                              style: const TextStyle(
                                  color: AdminColors.muted, fontSize: 11)),
                      ],
                    ),
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text('${c['messageCount'] ?? 0}',
                            style: const TextStyle(
                                color: AdminColors.gold,
                                fontWeight: FontWeight.bold)),
                        const Text('رسالة',
                            style: TextStyle(color: AdminColors.muted, fontSize: 10)),
                      ],
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
