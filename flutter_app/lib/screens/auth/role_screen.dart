import 'package:flutter/material.dart';
import 'package:flutter_feather_icons/flutter_feather_icons.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/theme/app_colors.dart';
import '../../l10n/app_locale.dart';
import '../../providers/language_provider.dart';
import '../../providers/theme_provider.dart';
import '../../router/app_router.dart';
import '../../widgets/logo_icon.dart';

/// Role selection — ported from app/(auth)/role.tsx
class RoleScreen extends ConsumerWidget {
  const RoleScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(appStringsProvider);
    final locale = ref.watch(languageProvider);
    final height = MediaQuery.sizeOf(context).height;
    final isSmall = height < 700;

    return Scaffold(
      backgroundColor: AppColors.tabBarBg,
      body: SingleChildScrollView(
        child: Column(
          children: [
            SizedBox(
              height: height * 0.18,
              width: double.infinity,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Color(0xFF2A2A3E), AppColors.tabBarBg],
                      ),
                    ),
                  ),
                  Align(
                    alignment: Alignment.bottomCenter,
                    child: Container(
                      height: 80,
                      color: AppColors.tabBarBg.withValues(alpha: 0.3),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: EdgeInsets.fromLTRB(
                16,
                6,
                16,
                MediaQuery.paddingOf(context).bottom + 12,
              ),
              child: Column(
                children: [
                  LogoIcon(size: isSmall ? 56 : 72),
                  const SizedBox(height: 4),
                  Text(
                    t.role.appName,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.gold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    t.role.welcome,
                    style: TextStyle(
                      fontSize: isSmall ? 20 : 24,
                      fontWeight: FontWeight.bold,
                      color: AppColors.gold,
                    ),
                  ),
                  Text(
                    t.role.subtitle,
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.white.withValues(alpha: 0.85),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: AppLocale.values.map((l) {
                      final active = locale == l;
                      final label = switch (l) {
                        AppLocale.ar => 'العربية',
                        AppLocale.en => 'English',
                        AppLocale.he => 'עברית',
                      };
                      return Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: ChoiceChip(
                          label: Text(label),
                          selected: active,
                          onSelected: (_) =>
                              ref.read(languageProvider.notifier).setLang(l),
                          selectedColor: AppColors.gold.withValues(alpha: 0.18),
                          labelStyle: TextStyle(
                            color: active
                                ? AppColors.gold
                                : Colors.white.withValues(alpha: 0.7),
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                          ),
                          side: BorderSide(
                            color: active
                                ? AppColors.gold
                                : AppColors.gold.withValues(alpha: 0.3),
                          ),
                          backgroundColor: Colors.white.withValues(alpha: 0.04),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _RoleCard(
                          dark: true,
                          icon: FeatherIcons.settings,
                          title: t.role.provider,
                          desc: t.role.providerDesc,
                          onTap: () => _goToSignUp(context, 'provider'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _RoleCard(
                          dark: false,
                          icon: FeatherIcons.user,
                          title: t.role.customer,
                          desc: t.role.customerDesc,
                          onTap: () => _goToSignUp(context, 'customer'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    onPressed: () => context.push(AppRoutes.contact),
                    icon: const Icon(FeatherIcons.headphones, color: AppColors.gold, size: 18),
                    label: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          t.role.contact,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          t.role.contactSub,
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.6),
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size(double.infinity, 48),
                      side: BorderSide(color: Colors.white.withValues(alpha: 0.15)),
                      backgroundColor: Colors.white.withValues(alpha: 0.08),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _goToSignUp(BuildContext context, String role) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('khadma:intendedRole', role);
    if (!context.mounted) return;
    context.push(AppRoutes.emailCode);
  }
}

class _RoleCard extends StatelessWidget {
  const _RoleCard({
    required this.dark,
    required this.icon,
    required this.title,
    required this.desc,
    required this.onTap,
  });

  final bool dark;
  final IconData icon;
  final String title;
  final String desc;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final bg = dark ? AppColors.tabBarBg : Colors.white;
    final fg = dark ? Colors.white : AppColors.tabBarBg;
    final descColor = dark ? const Color(0xFFAAAAAA) : const Color(0xFF666666);

    return Material(
      color: bg,
      borderRadius: BorderRadius.circular(20),
      elevation: 8,
      shadowColor: Colors.black.withValues(alpha: 0.25),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: AppColors.gold.withValues(alpha: dark ? 0.5 : 0.2),
                    width: 2,
                  ),
                  color: AppColors.gold.withValues(alpha: dark ? 0.2 : 0.1),
                ),
                child: Icon(icon, size: 26, color: dark ? AppColors.gold : AppColors.tabBarBg),
              ),
              const SizedBox(height: 14),
              Text(
                title,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: fg,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                desc,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12, color: descColor, height: 1.3),
              ),
              const SizedBox(height: 14),
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: AppColors.gold.withValues(alpha: dark ? 0.4 : 0.2),
                  ),
                  color: AppColors.gold.withValues(alpha: dark ? 0.1 : 0.05),
                ),
                child: Icon(
                  FeatherIcons.arrowRight,
                  size: 20,
                  color: dark ? AppColors.gold : AppColors.tabBarBg,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
