import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/admin_theme.dart';
import '../../providers/admin_providers.dart';
import '../../widgets/admin_drawer.dart';
import '../../widgets/status_chip.dart';
import '../../widgets/status_chip.dart' show formatMoney, formatDate;

class PerformanceScreen extends ConsumerWidget {
  const PerformanceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final analytics = ref.watch(analyticsProvider);

    return AdminPage(
      title: 'أداء المزوّدين',
      actions: [
        IconButton(
          icon: const Icon(Icons.refresh),
          onPressed: () => ref.invalidate(analyticsProvider),
        ),
      ],
      child: analytics.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AdminColors.gold)),
        error: (e, _) => Center(child: Text('$e')),
        data: (a) {
          final providers = (a['providers'] as List?)?.cast<Map<String, dynamic>>() ?? [];
          return RefreshIndicator(
            color: AdminColors.gold,
            onRefresh: () async => ref.invalidate(analyticsProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(12),
              itemCount: providers.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) {
                final p = providers[i];
                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text('${p['name'] ?? '—'}',
                                  style: const TextStyle(
                                      color: Colors.white, fontWeight: FontWeight.bold)),
                            ),
                            StatusChip(status: '${p['status']}'),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            _mini('طلبات', '${p['completedJobs']}'),
                            _mini('إجمالي', formatMoney(p['grossEarnings'])),
                            _mini('صافي', formatMoney(p['netEarnings'])),
                            _mini('عمولة', formatMoney(p['platformCommission'])),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            Icon(Icons.star, color: AdminColors.gold, size: 14),
                            Text(' ${p['rating']} (${p['ratingCount']})',
                                style: const TextStyle(color: AdminColors.muted, fontSize: 12)),
                            const Spacer(),
                            Text(formatDate(p['createdAt']),
                                style: const TextStyle(color: AdminColors.muted, fontSize: 10)),
                          ],
                        ),
                        if (p['blocked'] == true)
                          const Padding(
                            padding: EdgeInsets.only(top: 6),
                            child: Text('⚠ محظور — عمولة مستحقة فوق الحد',
                                style: TextStyle(color: AdminColors.danger, fontSize: 11)),
                          ),
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

  Widget _mini(String k, String v) => Expanded(
        child: Column(
          children: [
            Text(v, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
            Text(k, style: const TextStyle(color: AdminColors.muted, fontSize: 10)),
          ],
        ),
      );
}
