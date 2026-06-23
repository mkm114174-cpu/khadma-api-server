import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/admin_theme.dart';
import '../../providers/admin_providers.dart';
import '../../widgets/admin_drawer.dart';
import '../../widgets/status_chip.dart';
import '../../widgets/status_chip.dart' show formatDate;

class UsersScreen extends ConsumerWidget {
  const UsersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final users = ref.watch(usersProvider);

    return AdminPage(
      title: 'المستخدمون',
      actions: [
        IconButton(
          icon: const Icon(Icons.refresh),
          onPressed: () => ref.invalidate(usersProvider),
        ),
      ],
      child: users.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AdminColors.gold)),
        error: (e, _) => Center(child: Text('$e')),
        data: (list) {
          return RefreshIndicator(
            color: AdminColors.gold,
            onRefresh: () async => ref.invalidate(usersProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(12),
              itemCount: list.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) {
                final u = list[i];
                final status = u['accountStatus'] as String? ?? 'active';
                return Card(
                  child: ListTile(
                    title: Text('${u['name']}',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                    subtitle: Text(
                      '${u['email'] ?? ''} · ${u['role']} · ${formatDate(u['createdAt'])}',
                      style: const TextStyle(color: AdminColors.muted, fontSize: 11),
                    ),
                    trailing: StatusChip(status: status),
                    onTap: () => _showActions(context, ref, u),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }

  void _showActions(BuildContext context, WidgetRef ref, Map<String, dynamic> u) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: AdminColors.card,
      builder: (c) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              title: Text('${u['name']}', style: const TextStyle(color: Colors.white)),
              subtitle: Text('${u['email']}', style: const TextStyle(color: AdminColors.muted)),
            ),
            ListTile(
              leading: const Icon(Icons.check_circle, color: AdminColors.success),
              title: const Text('تفعيل الحساب'),
              onTap: () async {
                await ref.read(adminApiProvider).updateUserStatus(u['id'] as int, accountStatus: 'active');
                ref.invalidate(usersProvider);
                if (context.mounted) Navigator.pop(c);
              },
            ),
            ListTile(
              leading: const Icon(Icons.pause_circle, color: AdminColors.warning),
              title: const Text('إيقاف مؤقت'),
              onTap: () async {
                final until = DateTime.now().add(const Duration(days: 7));
                await ref.read(adminApiProvider).updateUserStatus(
                      u['id'] as int,
                      accountStatus: 'suspended',
                      suspendedUntil: until.toIso8601String(),
                    );
                ref.invalidate(usersProvider);
                if (context.mounted) Navigator.pop(c);
              },
            ),
            ListTile(
              leading: const Icon(Icons.block, color: AdminColors.danger),
              title: const Text('إغلاق الحساب'),
              onTap: () async {
                await ref.read(adminApiProvider).updateUserStatus(u['id'] as int, accountStatus: 'closed');
                ref.invalidate(usersProvider);
                if (context.mounted) Navigator.pop(c);
              },
            ),
          ],
        ),
      ),
    );
  }
}
