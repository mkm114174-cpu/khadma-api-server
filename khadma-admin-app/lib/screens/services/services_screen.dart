import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../config/env.dart';
import '../../constants/service_sections.dart';
import '../../core/theme/admin_theme.dart';
import '../../providers/admin_providers.dart';
import '../../router/app_router.dart';
import '../../widgets/admin_drawer.dart';
import '../../widgets/status_chip.dart';

class ServicesScreen extends ConsumerStatefulWidget {
  const ServicesScreen({super.key});

  @override
  ConsumerState<ServicesScreen> createState() => _ServicesScreenState();
}

class _ServicesScreenState extends ConsumerState<ServicesScreen> {
  String _filter = 'all';

  @override
  Widget build(BuildContext context) {
    final skills = ref.watch(skillsProvider);

    return AdminPage(
      title: 'الخدمات',
      actions: [
        IconButton(
          icon: const Icon(Icons.add),
          onPressed: () => context.push(AppRoutes.serviceEdit(0)),
        ),
        IconButton(
          icon: const Icon(Icons.refresh),
          onPressed: () => ref.invalidate(skillsProvider),
        ),
      ],
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'all', label: Text('الكل')),
                ButtonSegment(value: 'approved', label: Text('معتمد')),
                ButtonSegment(value: 'pending', label: Text('معلّق')),
                ButtonSegment(value: 'rejected', label: Text('مرفوض')),
              ],
              selected: {_filter},
              onSelectionChanged: (s) => setState(() => _filter = s.first),
            ),
          ),
          Expanded(
            child: skills.when(
              loading: () => const Center(child: CircularProgressIndicator(color: AdminColors.gold)),
              error: (e, _) => Center(child: Text('$e')),
              data: (list) {
                final filtered = _filter == 'all'
                    ? list
                    : list.where((s) => s['status'] == _filter).toList();
                return RefreshIndicator(
                  color: AdminColors.gold,
                  onRefresh: () async => ref.invalidate(skillsProvider),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(12),
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (_, i) {
                      final s = filtered[i];
                      final img = s['image'] as String?;
                      return Card(
                        child: ListTile(
                          onTap: () => context.push(AppRoutes.serviceEdit(s['id'] as int)),
                          leading: img != null && img.isNotEmpty
                              ? ClipRRect(
                                  borderRadius: BorderRadius.circular(8),
                                  child: CachedNetworkImage(
                                    imageUrl: _publicImageUrl(img),
                                    width: 48,
                                    height: 48,
                                    fit: BoxFit.cover,
                                    errorWidget: (_, __, ___) =>
                                        const Icon(Icons.image, color: AdminColors.muted),
                                  ),
                                )
                              : const Icon(Icons.layers, color: AdminColors.gold),
                          title: Text('${s['name']}',
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                          subtitle: Text(
                            '${sectionLabel(s['category'] as String?)} · ${s['slug']}',
                            style: const TextStyle(color: AdminColors.muted, fontSize: 11),
                          ),
                          trailing: StatusChip(status: '${s['status']}'),
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

  String _publicImageUrl(String path) {
    if (path.startsWith('http')) return path;
    return '${Env.apiBaseUrl}/api/storage/public-objects/$path';
  }
}
