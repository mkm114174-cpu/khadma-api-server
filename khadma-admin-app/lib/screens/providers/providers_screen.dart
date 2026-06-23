import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/admin_theme.dart';
import '../../providers/admin_providers.dart';
import '../../router/app_router.dart';
import '../../widgets/admin_drawer.dart';
import '../../widgets/status_chip.dart';

class ProvidersScreen extends ConsumerStatefulWidget {
  const ProvidersScreen({super.key});

  @override
  ConsumerState<ProvidersScreen> createState() => _ProvidersScreenState();
}

class _ProvidersScreenState extends ConsumerState<ProvidersScreen> {
  String _filter = 'all';
  final _search = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final providers = ref.watch(providersProvider);

    return AdminPage(
      title: 'مزودو الخدمة',
      actions: [
        IconButton(
          icon: const Icon(Icons.refresh),
          onPressed: () => ref.invalidate(providersProvider),
        ),
      ],
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _search,
              onChanged: (_) => setState(() {}),
              decoration: const InputDecoration(
                hintText: 'بحث بالاسم...',
                prefixIcon: Icon(Icons.search),
              ),
            ),
          ),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Row(
              children: [
                for (final f in ['all', 'pending', 'under_review', 'needs_info', 'approved', 'rejected'])
                  Padding(
                    padding: const EdgeInsets.only(left: 6),
                    child: FilterChip(
                      label: Text(_statusLabel(f)),
                      selected: _filter == f,
                      onSelected: (_) => setState(() => _filter = f),
                      selectedColor: AdminColors.gold.withValues(alpha: 0.25),
                    ),
                  ),
              ],
            ),
          ),
          Expanded(
            child: providers.when(
              loading: () => const Center(child: CircularProgressIndicator(color: AdminColors.gold)),
              error: (e, _) => Center(child: Text('$e')),
              data: (list) {
                final q = _search.text.trim().toLowerCase();
                final filtered = list.where((p) {
                  if (_filter != 'all' && p['status'] != _filter) return false;
                  if (q.isNotEmpty && !'${p['name']}'.toLowerCase().contains(q)) return false;
                  return true;
                }).toList();

                if (filtered.isEmpty) {
                  return const Center(child: Text('لا يوجد مزوّدون', style: TextStyle(color: AdminColors.muted)));
                }

                return RefreshIndicator(
                  color: AdminColors.gold,
                  onRefresh: () async => ref.invalidate(providersProvider),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(12),
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (_, i) {
                      final p = filtered[i];
                      return Card(
                        child: ListTile(
                          onTap: () => context.push(AppRoutes.providerDetail(p['id'] as int)),
                          title: Text('${p['name'] ?? '—'}',
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                          subtitle: Text(
                            '${p['serviceType'] ?? ''} · ${p['city'] ?? ''}',
                            style: const TextStyle(color: AdminColors.muted, fontSize: 12),
                          ),
                          trailing: StatusChip(status: '${p['status']}'),
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

  String _statusLabel(String s) => switch (s) {
        'all' => 'الكل',
        'pending' => 'بانتظار',
        'under_review' => 'مراجعة',
        'needs_info' => 'معلومات',
        'approved' => 'مقبول',
        'rejected' => 'مرفوض',
        _ => s,
      };
}
