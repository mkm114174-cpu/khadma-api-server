import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/admin_theme.dart';
import '../../providers/admin_providers.dart';
import '../../router/app_router.dart';

class AdminDrawer extends ConsumerWidget {
  const AdminDrawer({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final loc = GoRouterState.of(context).matchedLocation;
    final summary = ref.watch(inboxSummaryProvider);
    final openCount = summary.valueOrNull?['openContactMessages'] as int? ?? 0;
    final me = ref.watch(adminUserProvider).valueOrNull;

    return Drawer(
      backgroundColor: AdminColors.card,
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(vertical: 8),
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('خدما',
                      style: TextStyle(
                          color: AdminColors.gold,
                          fontSize: 22,
                          fontWeight: FontWeight.bold)),
                  Text(me?['name'] ?? 'الأدمن',
                      style: const TextStyle(color: AdminColors.muted, fontSize: 13)),
                ],
              ),
            ),
            const Divider(color: AdminColors.border, height: 1),
            _item(context, loc, AppRoutes.dashboard, Icons.dashboard, 'لوحة التحكم'),
            _item(context, loc, AppRoutes.providers, Icons.people, 'مزودو الخدمة'),
            _item(context, loc, AppRoutes.services, Icons.layers, 'الخدمات'),
            _item(context, loc, AppRoutes.requests, Icons.assignment, 'الطلبات'),
            _item(context, loc, AppRoutes.commission, Icons.account_balance_wallet, 'العمولات والأرباح'),
            _item(context, loc, AppRoutes.performance, Icons.trending_up, 'أداء المزوّدين'),
            _item(context, loc, AppRoutes.users, Icons.manage_accounts, 'المستخدمون'),
            _item(context, loc, AppRoutes.inbox, Icons.mail, 'تواصل معنا',
                badge: openCount),
            _item(context, loc, AppRoutes.chats, Icons.chat, 'محادثات الطلبات'),
            const Divider(color: AdminColors.border),
            ListTile(
              leading: const Icon(Icons.logout, color: AdminColors.danger),
              title: const Text('تسجيل الخروج', style: TextStyle(color: AdminColors.danger)),
              onTap: () async {
                await ref.read(clerkAuthProvider).signOut();
                ref.invalidate(authTokenProvider);
                if (context.mounted) context.go(AppRoutes.signIn);
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _item(
    BuildContext context,
    String loc,
    String route,
    IconData icon,
    String label, {
    int badge = 0,
  }) {
    final selected = loc == route || loc.startsWith('$route/');
    return ListTile(
      selected: selected,
      selectedTileColor: AdminColors.gold.withValues(alpha: 0.1),
      leading: badge > 0
          ? Badge(label: Text('$badge'), child: Icon(icon, color: AdminColors.gold))
          : Icon(icon, color: selected ? AdminColors.gold : AdminColors.muted),
      title: Text(label,
          style: TextStyle(
            color: selected ? Colors.white : AdminColors.muted,
            fontWeight: selected ? FontWeight.bold : FontWeight.normal,
          )),
      onTap: () {
        Navigator.pop(context);
        context.go(route);
      },
    );
  }
}

class AdminPage extends StatelessWidget {
  const AdminPage({super.key, required this.title, required this.child, this.actions});

  final String title;
  final Widget child;
  final List<Widget>? actions;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        actions: actions,
      ),
      drawer: const AdminDrawer(),
      body: child,
    );
  }
}
