import 'package:flutter/material.dart';
import 'package:flutter_feather_icons/flutter_feather_icons.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../providers/language_provider.dart';
import '../../providers/tab_provider.dart';
import '../../router/app_router.dart';
import '../../widgets/support_chat_fab.dart';
import 'home_screen.dart';
import 'orders_screen.dart';
import 'profile_screen.dart';
import 'services_screen.dart';

/// Bottom tab shell — ported from app/(tabs)/_layout.tsx
class MainShell extends ConsumerStatefulWidget {
  const MainShell({super.key});

  @override
  ConsumerState<MainShell> createState() => _MainShellState();
}

class _MainShellState extends ConsumerState<MainShell> {
  static const _tabs = [
    _TabDef(icon: FeatherIcons.moreHorizontal, hidden: true),
    _TabDef(icon: FeatherIcons.grid),
    _TabDef(icon: FeatherIcons.home),
    _TabDef(icon: FeatherIcons.clipboard),
    _TabDef(icon: FeatherIcons.user),
  ];

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(appStringsProvider);
    final index = ref.watch(mainTabIndexProvider);
    final labels = [
      t.tabs.more,
      t.tabs.services,
      t.tabs.home,
      t.tabs.orders,
      t.tabs.profile,
    ];

    final pages = [
      const _MorePage(),
      const ServicesScreen(),
      const HomeScreen(),
      const OrdersScreen(),
      const ProfileScreen(),
    ];

    return Scaffold(
      body: Stack(
        children: [
          IndexedStack(
            index: index,
            children: pages,
          ),
          SupportChatFab(
            bottomOffset: MediaQuery.paddingOf(context).bottom + 70,
          ),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: AppColors.tabBarBg,
          borderRadius: BorderRadius.vertical(top: Radius.circular(25)),
        ),
        child: SafeArea(
          top: false,
          child: SizedBox(
            height: 70,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: List.generate(_tabs.length, (i) {
                if (_tabs[i].hidden) return const SizedBox.shrink();
                final focused = index == i;
                return GestureDetector(
                  onTap: () => ref.read(mainTabIndexProvider.notifier).state = i,
                  behavior: HitTestBehavior.opaque,
                  child: SizedBox(
                    width: 64,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: focused ? AppColors.gold : Colors.transparent,
                          ),
                          child: Icon(
                            _tabs[i].icon,
                            size: 22,
                            color: focused ? Colors.white : const Color(0xFF888888),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          labels[i],
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: focused ? AppColors.gold : const Color(0xFF888888),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }
}

class _TabDef {
  const _TabDef({required this.icon, this.hidden = false});
  final IconData icon;
  final bool hidden;
}

class _MorePage extends ConsumerWidget {
  const _MorePage();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(appStringsProvider);
    return Scaffold(
      backgroundColor: AppColors.darkBg,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Text(
              t.tabs.more,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(FeatherIcons.bell, color: AppColors.gold),
              title: Text(t.tabs.more, style: const TextStyle(color: Colors.white)),
              onTap: () => context.push(AppRoutes.notifications),
            ),
            ListTile(
              leading: const Icon(FeatherIcons.messageCircle, color: AppColors.gold),
              title: const Text('Contact', style: TextStyle(color: Colors.white)),
              onTap: () => context.push(AppRoutes.contact),
            ),
          ],
        ),
      ),
    );
  }
}
