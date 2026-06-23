import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/admin_theme.dart';
import '../../providers/admin_providers.dart';
import '../../router/app_router.dart';
import '../../widgets/admin_drawer.dart';
import '../../widgets/status_chip.dart';
import '../../widgets/status_chip.dart' show formatDate;

class RequestsScreen extends ConsumerStatefulWidget {
  const RequestsScreen({super.key});

  @override
  ConsumerState<RequestsScreen> createState() => _RequestsScreenState();
}

class _RequestsScreenState extends ConsumerState<RequestsScreen> {
  String _filter = 'all';

  @override
  Widget build(BuildContext context) {
    final requests = ref.watch(requestsProvider);

    return AdminPage(
      title: 'الطلبات',
      actions: [
        IconButton(
          icon: const Icon(Icons.refresh),
          onPressed: () => ref.invalidate(requestsProvider),
        ),
      ],
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  for (final f in ['all', 'pending', 'active', 'in_progress', 'completed', 'cancelled'])
                    Padding(
                      padding: const EdgeInsets.only(left: 6),
                      child: FilterChip(
                        label: Text(f == 'all' ? 'الكل' : f),
                        selected: _filter == f,
                        onSelected: (_) => setState(() => _filter = f),
                      ),
                    ),
                ],
              ),
            ),
          ),
          Expanded(
            child: requests.when(
              loading: () => const Center(child: CircularProgressIndicator(color: AdminColors.gold)),
              error: (e, _) => Center(child: Text('$e')),
              data: (list) {
                final filtered = _filter == 'all'
                    ? list
                    : list.where((r) => r['status'] == _filter).toList();
                return RefreshIndicator(
                  color: AdminColors.gold,
                  onRefresh: () async => ref.invalidate(requestsProvider),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(12),
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (_, i) {
                      final r = filtered[i];
                      return Card(
                        child: ListTile(
                          onTap: () => context.push(AppRoutes.requestDetail(r['id'] as int)),
                          title: Text('${r['requestNumber'] ?? '#${r['id']}'}',
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                          subtitle: Text(
                            _preview('${r['description'] ?? ''}'),
                            style: const TextStyle(color: AdminColors.muted, fontSize: 12),
                          ),
                          trailing: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              StatusChip(status: '${r['status']}'),
                              Text(formatDate(r['createdAt']),
                                  style: const TextStyle(color: AdminColors.muted, fontSize: 10)),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  String _preview(String s) {
    if (s.length <= 60) return s;
    return '${s.substring(0, 60)}...';
  }
}
