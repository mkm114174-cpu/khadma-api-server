import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/admin_theme.dart';
import '../../providers/admin_providers.dart';
import '../../router/app_router.dart';
import '../../widgets/admin_drawer.dart';
import '../../widgets/status_chip.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summary = ref.watch(inboxSummaryProvider);
    final analytics = ref.watch(analyticsProvider);
    final online = ref.watch(onlineCountProvider);
    final providers = ref.watch(providersProvider);

    return AdminPage(
      title: 'لوحة التحكم',
      actions: [
        IconButton(
          icon: const Icon(Icons.refresh),
          onPressed: () {
            ref.invalidate(inboxSummaryProvider);
            ref.invalidate(analyticsProvider);
            ref.invalidate(onlineCountProvider);
            ref.invalidate(providersProvider);
          },
        ),
      ],
      child: RefreshIndicator(
        color: AdminColors.gold,
        onRefresh: () async {
          ref.invalidate(inboxSummaryProvider);
          ref.invalidate(analyticsProvider);
          ref.invalidate(onlineCountProvider);
          ref.invalidate(providersProvider);
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            online.when(
              data: (o) => Card(
                child: ListTile(
                  leading: const Icon(Icons.circle, color: AdminColors.success, size: 12),
                  title: Text('متصلون الآن: ${o['count'] ?? 0}',
                      style: const TextStyle(color: Colors.white)),
                  subtitle: Text('آخر ${o['windowMinutes'] ?? 5} دقائق',
                      style: const TextStyle(color: AdminColors.muted, fontSize: 12)),
                ),
              ),
              loading: () => const SizedBox.shrink(),
              error: (_, __) => const SizedBox.shrink(),
            ),
            const SizedBox(height: 12),
            summary.when(
              data: (s) => Row(
                children: [
                  Expanded(
                    child: _QuickCard(
                      title: 'رسائل مفتوحة',
                      value: '${s['openContactMessages'] ?? 0}',
                      icon: Icons.mail,
                      color: AdminColors.warning,
                      onTap: () => context.go(AppRoutes.inbox),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _QuickCard(
                      title: 'مزودون بانتظار المراجعة',
                      value: '${providers.valueOrNull?.where((p) => p['status'] == 'pending' || p['status'] == 'under_review').length ?? 0}',
                      icon: Icons.people,
                      color: AdminColors.gold,
                      onTap: () => context.go(AppRoutes.providers),
                    ),
                  ),
                ],
              ),
              loading: () => const LinearProgressIndicator(color: AdminColors.gold),
              error: (_, __) => const SizedBox.shrink(),
            ),
            const SizedBox(height: 16),
            analytics.when(
              data: (a) {
                final p = a['platform'] as Map<String, dynamic>? ?? {};
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text('أرباح المنصة',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(child: _QuickCard(title: 'حجم الأعمال', value: formatMoney(p['grossVolume']), icon: Icons.payments, color: AdminColors.success)),
                        const SizedBox(width: 10),
                        Expanded(child: _QuickCard(title: 'ربح المنصة', value: formatMoney(p['totalCommission']), icon: Icons.account_balance, color: AdminColors.gold)),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(child: _QuickCard(title: 'عمولة مستحقة', value: formatMoney(p['totalOutstanding']), icon: Icons.warning, color: AdminColors.warning)),
                        const SizedBox(width: 10),
                        Expanded(child: _QuickCard(title: 'طلبات مكتملة', value: '${p['completedJobs'] ?? 0}', icon: Icons.check, color: Colors.white)),
                      ],
                    ),
                  ],
                );
              },
              loading: () => const LinearProgressIndicator(color: AdminColors.gold),
              error: (_, __) => const SizedBox.shrink(),
            ),
            const SizedBox(height: 20),
            const Text('اختصارات', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            _link(context, AppRoutes.providers, Icons.people, 'مزودو الخدمة'),
            _link(context, AppRoutes.services, Icons.layers, 'إدارة الخدمات'),
            _link(context, AppRoutes.requests, Icons.assignment, 'الطلبات'),
            _link(context, AppRoutes.commission, Icons.wallet, 'العمولات'),
            _link(context, AppRoutes.performance, Icons.trending_up, 'أداء المزوّدين'),
            _link(context, AppRoutes.users, Icons.manage_accounts, 'المستخدمون'),
            _link(context, AppRoutes.inbox, Icons.mail, 'تواصل معنا'),
            _link(context, AppRoutes.chats, Icons.chat, 'محادثات'),
          ],
        ),
      ),
    );
  }

  Widget _link(BuildContext c, String route, IconData icon, String label) => Card(
        child: ListTile(
          leading: Icon(icon, color: AdminColors.gold),
          title: Text(label, style: const TextStyle(color: Colors.white)),
          trailing: const Icon(Icons.chevron_left, color: AdminColors.muted),
          onTap: () => c.go(route),
        ),
      );
}

class _QuickCard extends StatelessWidget {
  const _QuickCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
    this.onTap,
  });

  final String title;
  final String value;
  final IconData icon;
  final Color color;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, color: color, size: 20),
              const SizedBox(height: 8),
              Text(value, style: TextStyle(color: color, fontSize: 18, fontWeight: FontWeight.bold)),
              Text(title, style: const TextStyle(color: AdminColors.muted, fontSize: 11)),
            ],
          ),
        ),
      ),
    );
  }
}
