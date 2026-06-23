import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../providers/admin_providers.dart';
import '../../router/app_router.dart';
import '../../widgets/admin_drawer.dart';
import '../../core/theme/admin_theme.dart';

class ContactMessagesScreen extends ConsumerStatefulWidget {
  const ContactMessagesScreen({super.key});

  @override
  ConsumerState<ContactMessagesScreen> createState() =>
      _ContactMessagesScreenState();
}

class _ContactMessagesScreenState extends ConsumerState<ContactMessagesScreen> {
  String _filter = 'all';

  @override
  Widget build(BuildContext context) {
    final messages = ref.watch(contactMessagesProvider);
    final fmt = DateFormat('dd/MM/yyyy HH:mm', 'ar');

    return AdminPage(
      title: 'تواصل معنا',
      actions: [
        IconButton(
          icon: const Icon(Icons.refresh),
          onPressed: () {
            ref.invalidate(contactMessagesProvider);
            ref.invalidate(inboxSummaryProvider);
          },
        ),
      ],
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'all', label: Text('الكل')),
                ButtonSegment(value: 'open', label: Text('مفتوحة')),
                ButtonSegment(value: 'resolved', label: Text('محلولة')),
              ],
              selected: {_filter},
              onSelectionChanged: (s) => setState(() => _filter = s.first),
            ),
          ),
          Expanded(
            child: messages.when(
              loading: () =>
                  const Center(child: CircularProgressIndicator(color: AdminColors.gold)),
              error: (e, _) => Center(child: Text('$e')),
              data: (list) {
                final filtered = list.where((m) {
                  if (_filter != 'all' && m['status'] != _filter) return false;
                  return true;
                }).toList();

                if (filtered.isEmpty) {
                  return const Center(
                    child: Text('لا توجد رسائل',
                        style: TextStyle(color: AdminColors.muted)),
                  );
                }

                return RefreshIndicator(
                  color: AdminColors.gold,
                  onRefresh: () async {
                    ref.invalidate(contactMessagesProvider);
                  },
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (_, i) {
                      final m = filtered[i];
                      final open = m['status'] == 'open';
                      final created = DateTime.tryParse('${m['createdAt']}');
                      return Card(
                        child: ListTile(
                          onTap: () =>
                              context.push(AppRoutes.messageDetail(m['id'] as int)),
                          title: Text(
                            '${m['subject'] ?? 'بدون عنوان'}',
                            style: const TextStyle(
                                color: Colors.white, fontWeight: FontWeight.w600),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const SizedBox(height: 4),
                              Text('${m['name']}',
                                  style: const TextStyle(color: AdminColors.muted)),
                              if (m['message'] != null)
                                Text(
                                  '${m['message']}',
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(color: Colors.white70),
                                ),
                              if (created != null)
                                Text(fmt.format(created),
                                    style: const TextStyle(
                                        color: AdminColors.muted, fontSize: 11)),
                            ],
                          ),
                          trailing: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: open
                                  ? AdminColors.warning.withValues(alpha: 0.15)
                                  : AdminColors.success.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              open ? 'مفتوحة' : 'محلولة',
                              style: TextStyle(
                                color: open ? AdminColors.warning : AdminColors.success,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
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
}
