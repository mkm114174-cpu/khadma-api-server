import 'package:flutter/material.dart';
import 'package:flutter_feather_icons/flutter_feather_icons.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../models/service_request.dart';
import '../../providers/language_provider.dart';
import '../../providers/request_providers.dart';

/// My requests list — ported from (tabs)/orders.tsx (simplified)
class OrdersScreen extends ConsumerWidget {
  const OrdersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(appStringsProvider);
    final requestsAsync = ref.watch(myRequestsProvider);

    return Scaffold(
      backgroundColor: AppColors.darkBg,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
              child: Row(
                children: [
                  Text(
                    t.req.myTitle,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    onPressed: () => context.push('/request/new'),
                    icon: const Icon(FeatherIcons.plusCircle, color: AppColors.gold),
                  ),
                ],
              ),
            ),
            Expanded(
              child: requestsAsync.when(
                loading: () => const Center(
                  child: CircularProgressIndicator(color: AppColors.gold),
                ),
                error: (_, __) => Center(child: Text(t.req.error)),
                data: (list) {
                  if (list.isEmpty) return _EmptyState(t: t);
                  final active = list.where((r) => !r.isDone).toList();
                  final past = list.where((r) => r.isDone).toList();
                  return RefreshIndicator(
                    color: AppColors.gold,
                    onRefresh: () async => ref.invalidate(myRequestsProvider),
                    child: ListView(
                      padding: const EdgeInsets.all(16),
                      children: [
                        if (active.isNotEmpty) ...[
                          _SectionTitle(t.req.statusPending),
                          ...active.map((r) => _RequestTile(
                                request: r,
                                statusLabel: _status(r.status, t),
                                onTap: () => context.push('/request/${r.id}'),
                              )),
                        ],
                        if (past.isNotEmpty) ...[
                          const SizedBox(height: 16),
                          _SectionTitle(t.req.statusCompleted),
                          ...past.map((r) => _RequestTile(
                                request: r,
                                statusLabel: _status(r.status, t),
                                onTap: () => context.push('/request/${r.id}'),
                              )),
                        ],
                        const SizedBox(height: 80),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/request/new'),
        backgroundColor: AppColors.gold,
        foregroundColor: Colors.black,
        icon: const Icon(FeatherIcons.plus),
        label: Text(t.req.newRequest),
      ),
    );
  }

  String _status(String s, dynamic t) {
    return switch (s) {
      'pending' => t.req.statusPending,
      'active' => t.req.statusActive,
      'in_progress' => t.req.statusInProgress,
      'completed' => t.req.statusCompleted,
      'cancelled' => t.req.statusCancelled,
      _ => s,
    };
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        text,
        style: TextStyle(color: Colors.white.withValues(alpha: 0.6), fontSize: 13),
      ),
    );
  }
}

class _RequestTile extends StatelessWidget {
  const _RequestTile({
    required this.request,
    required this.statusLabel,
    required this.onTap,
  });

  final ServiceRequest request;
  final String statusLabel;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Colors.white.withValues(alpha: 0.05),
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      child: ListTile(
        onTap: onTap,
        title: Text(
          request.description ?? '#${request.requestNumber}',
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
        ),
        subtitle: Text(
          statusLabel,
          style: const TextStyle(color: AppColors.gold, fontSize: 12),
        ),
        trailing: const Icon(FeatherIcons.chevronLeft, color: Colors.white38, size: 18),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.t});

  final dynamic t;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(FeatherIcons.clipboard, size: 48, color: Colors.white24),
            const SizedBox(height: 16),
            Text(t.req.empty, style: const TextStyle(color: Colors.white, fontSize: 18)),
            const SizedBox(height: 8),
            Text(
              t.req.emptySub,
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white.withValues(alpha: 0.5)),
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: () => context.push('/request/new'),
              icon: const Icon(FeatherIcons.plus),
              label: Text(t.req.newRequest),
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.gold,
                foregroundColor: Colors.black,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
