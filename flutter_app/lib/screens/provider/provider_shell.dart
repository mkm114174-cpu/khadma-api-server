import 'package:flutter/material.dart';
import 'package:flutter_feather_icons/flutter_feather_icons.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../../providers/request_providers.dart';
import '../auth/provider_onboarding_screen.dart';
import 'provider_earnings_screen.dart';
import 'provider_requests_screen.dart';

/// Provider bottom navigation — only for approved providers.
class ProviderShell extends ConsumerWidget {
  const ProviderShell({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final providerAsync = ref.watch(myProviderProvider);

    return providerAsync.when(
      loading: () => const Scaffold(
        backgroundColor: AppColors.darkBg,
        body: Center(child: CircularProgressIndicator(color: AppColors.gold)),
      ),
      error: (_, __) => const ProviderOnboardingScreen(),
      data: (provider) {
        if (provider == null ||
            provider.status == 'rejected' ||
            provider.status == 'pending' ||
            provider.status == 'under_review' ||
            provider.status == 'needs_info') {
          return const ProviderOnboardingScreen();
        }
        return const _ProviderShellBody();
      },
    );
  }
}

class _ProviderShellBody extends StatefulWidget {
  const _ProviderShellBody();

  @override
  State<_ProviderShellBody> createState() => _ProviderShellBodyState();
}

class _ProviderShellBodyState extends State<_ProviderShellBody> {
  int _index = 0;

  static const _pages = [
    ProviderRequestsScreen(),
    ProviderEarningsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.darkBg,
      body: IndexedStack(index: _index, children: _pages),
      bottomNavigationBar: NavigationBar(
        backgroundColor: const Color(0xFF141418),
        indicatorColor: AppColors.gold.withValues(alpha: 0.2),
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: const [
          NavigationDestination(
            icon: Icon(FeatherIcons.briefcase),
            label: 'الطلبات',
          ),
          NavigationDestination(
            icon: Icon(FeatherIcons.dollarSign),
            label: 'الأرباح',
          ),
        ],
      ),
    );
  }
}
