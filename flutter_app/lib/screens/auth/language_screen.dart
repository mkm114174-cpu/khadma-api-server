import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../l10n/app_locale.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import '../../providers/theme_provider.dart';
import '../../router/app_router.dart';

/// Language picker — ported from app/(auth)/language.tsx
class LanguageScreen extends ConsumerWidget {
  const LanguageScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(appStringsProvider);
    final auth = ref.watch(authProvider);

    ref.listen(authProvider, (prev, next) {
      if (next.status == AuthStatus.guest) {
        context.go(AppRoutes.tabs);
      }
    });

    return Scaffold(
      backgroundColor: AppColors.tabBarBg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            children: [
              const SizedBox(height: 60),
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.gold.withValues(alpha: 0.15),
                  border: Border.all(color: AppColors.gold.withValues(alpha: 0.3)),
                ),
                child: const Icon(Icons.language, size: 40, color: AppColors.gold),
              ),
              const SizedBox(height: 20),
              Text(
                t.langPicker.title,
                style: const TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: AppColors.gold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                t.langPicker.subtitle,
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.white.withValues(alpha: 0.6),
                ),
              ),
              const SizedBox(height: 40),
              ...AppLocale.values.map((locale) {
                final label = switch (locale) {
                  AppLocale.ar => t.langPicker.arabic,
                  AppLocale.en => t.langPicker.english,
                  AppLocale.he => t.langPicker.hebrew,
                };
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _LangCard(
                    label: label,
                    onTap: () async {
                      await ref.read(languageProvider.notifier).setLang(locale);
                      if (context.mounted) context.go(AppRoutes.onboarding);
                    },
                  ),
                );
              }),
              const SizedBox(height: 24),
              OutlinedButton(
                onPressed: () async {
                  await ref.read(languageProvider.notifier).setLang(AppLocale.ar);
                  await ref.read(authProvider.notifier).setGuest(true);
                },
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.gold,
                  side: BorderSide(color: AppColors.gold.withValues(alpha: 0.4)),
                  backgroundColor: AppColors.gold.withValues(alpha: 0.08),
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                ),
                child: Text(t.langPicker.demoMode),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _LangCard extends StatelessWidget {
  const _LangCard({required this.label, required this.onTap});

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white.withValues(alpha: 0.05),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
          ),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  label,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ),
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.gold.withValues(alpha: 0.1),
                ),
                child: const Icon(Icons.chevron_left, color: AppColors.gold, size: 20),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
