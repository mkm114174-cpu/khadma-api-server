import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/admin_theme.dart';
import '../../providers/admin_providers.dart';
import '../../widgets/admin_drawer.dart';
import '../../widgets/status_chip.dart';
import '../../widgets/status_chip.dart' show formatDate, formatMoney;

class RequestDetailScreen extends ConsumerWidget {
  const RequestDetailScreen({super.key, required this.requestId});

  final int requestId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final req = ref.watch(requestDetailProvider(requestId));
    final offers = ref.watch(requestOffersProvider(requestId));

    return AdminPage(
      title: 'تفاصيل الطلب',
      child: req.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AdminColors.gold)),
        error: (e, _) => Center(child: Text('$e')),
        data: (r) {
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text('${r['requestNumber'] ?? '#$requestId'}',
                  style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              StatusChip(status: '${r['status']}'),
              const SizedBox(height: 12),
              Text('${r['description'] ?? ''}',
                  style: const TextStyle(color: Colors.white70, height: 1.5)),
              const SizedBox(height: 8),
              Text('العنوان: ${r['address'] ?? '—'}', style: const TextStyle(color: AdminColors.muted)),
              Text('تاريخ: ${formatDate(r['createdAt'])}', style: const TextStyle(color: AdminColors.muted)),
              if (r['scheduledTime'] != null)
                Text('موعد: ${formatDate(r['scheduledTime'])}', style: const TextStyle(color: AdminColors.muted)),
              const SizedBox(height: 16),
              Row(
                children: [
                  for (final s in ['pending', 'active', 'in_progress', 'completed', 'cancelled'])
                    Padding(
                      padding: const EdgeInsets.only(left: 4),
                      child: ActionChip(
                        label: Text(s, style: const TextStyle(fontSize: 10)),
                        onPressed: () async {
                          await ref.read(adminApiProvider).updateRequest(requestId, {'status': s});
                          ref.invalidate(requestDetailProvider(requestId));
                          ref.invalidate(requestsProvider);
                        },
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 20),
              const Text('العروض', style: TextStyle(color: AdminColors.gold, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              offers.when(
                loading: () => const LinearProgressIndicator(color: AdminColors.gold),
                error: (e, _) => Text('$e'),
                data: (list) {
                  if (list.isEmpty) {
                    return const Text('لا عروض', style: TextStyle(color: AdminColors.muted));
                  }
                  return Column(
                    children: list.map((o) {
                      return Card(
                        child: ListTile(
                          title: Text(formatMoney(o['price']),
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                          subtitle: Text('${o['message'] ?? ''}',
                              style: const TextStyle(color: AdminColors.muted)),
                          trailing: StatusChip(status: '${o['status']}'),
                        ),
                      );
                    }).toList(),
                  );
                },
              ),
            ],
          );
        },
      ),
    );
  }
}
