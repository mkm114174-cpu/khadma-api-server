import 'package:flutter/material.dart';
import 'package:flutter_feather_icons/flutter_feather_icons.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../l10n/app_locale.dart';
import '../../l10n/legal_strings.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import '../../providers/theme_provider.dart';
import '../../core/notifications/notification_sound_service.dart';
import '../../router/app_router.dart';
import '../../widgets/legal_sheet.dart';

/// Profile tab — settings, language, legal, logout
class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(appStringsProvider);
    final colors = ref.watch(appColorsProvider);
    final auth = ref.watch(authProvider);
    final locale = ref.watch(languageProvider);
    final themeMode = ref.watch(themeModeProvider);
    final legal = LegalContent.of(locale);
    final isRtl = ref.watch(isRtlProvider);

    return Scaffold(
      backgroundColor: AppColors.darkBg,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const SizedBox(height: 8),
            CircleAvatar(
              radius: 40,
              backgroundColor: AppColors.gold.withValues(alpha: 0.2),
              child: Text(
                auth.name.isNotEmpty ? auth.name[0].toUpperCase() : '?',
                style: const TextStyle(
                  color: AppColors.gold,
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              auth.name.isNotEmpty ? auth.name : t.tabs.profile,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),
            if (auth.phone.isNotEmpty)
              Text(
                auth.phone,
                textAlign: TextAlign.center,
                style: TextStyle(color: colors.mutedForeground),
              ),
            const SizedBox(height: 8),
            TextButton.icon(
              onPressed: () => context.push(AppRoutes.editProfile),
              icon: const Icon(FeatherIcons.edit2, size: 16, color: AppColors.gold),
              label: Text(
                isRtl ? 'تعديل الاسم والهاتف' : 'Edit name & phone',
                style: const TextStyle(color: AppColors.gold),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              isRtl ? 'اللغة' : 'Language',
              style: const TextStyle(color: AppColors.gold, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            Row(
              children: AppLocale.values.map((l) {
                final selected = locale == l;
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: ChoiceChip(
                      label: Text(l.code.toUpperCase()),
                      selected: selected,
                      onSelected: (_) =>
                          ref.read(languageProvider.notifier).setLang(l),
                      selectedColor: AppColors.gold,
                      labelStyle: TextStyle(
                        color: selected ? Colors.black : Colors.white70,
                        fontWeight: FontWeight.w600,
                      ),
                      backgroundColor: Colors.white.withValues(alpha: 0.06),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),
            _Tile(
              icon: themeMode == ThemeModePreference.dark
                  ? FeatherIcons.moon
                  : FeatherIcons.sun,
              label: isRtl ? 'المظهر' : 'Theme',
              trailing: themeMode == ThemeModePreference.dark
                  ? (isRtl ? 'داكن' : 'Dark')
                  : (isRtl ? 'فاتح' : 'Light'),
              onTap: () => ref.read(themeModeProvider.notifier).toggle(),
            ),
            _Tile(
              icon: FeatherIcons.bell,
              label: isRtl ? 'الإشعارات' : 'Notifications',
              onTap: () => context.push(AppRoutes.notifications),
            ),
            _Tile(
              icon: FeatherIcons.volume2,
              label: isRtl ? 'صوت الإشعارات' : 'Notification sound',
              onTap: () => _showSoundPicker(context, ref, isRtl),
            ),
            _Tile(
              icon: FeatherIcons.messageCircle,
              label: t.role.contact,
              onTap: () => context.push(AppRoutes.contact),
            ),
            _Tile(
              icon: FeatherIcons.fileText,
              label: legal.termsTitle,
              onTap: () => showLegalSheet(
                context,
                title: legal.termsTitle,
                body: legal.termsBody,
                closeLabel: legal.close,
              ),
            ),
            _Tile(
              icon: FeatherIcons.shield,
              label: legal.privacyTitle,
              onTap: () => showLegalSheet(
                context,
                title: legal.privacyTitle,
                body: legal.privacyBody,
                closeLabel: legal.close,
              ),
            ),
            _Tile(
              icon: FeatherIcons.info,
              label: legal.aboutTitle,
              onTap: () => showLegalSheet(
                context,
                title: legal.aboutTitle,
                body: legal.aboutBody,
                closeLabel: legal.close,
              ),
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: () => ref.read(authProvider.notifier).logout(),
              icon: const Icon(FeatherIcons.logOut),
              label: Text(t.auth.logout),
              style: FilledButton.styleFrom(
                backgroundColor: colors.destructive.withValues(alpha: 0.15),
                foregroundColor: colors.destructive,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showSoundPicker(BuildContext context, WidgetRef ref, bool isRtl) {
    final prefs = ref.read(sharedPreferencesProvider);
    final service = NotificationSoundService(prefs);
    final current = service.selected;

    showModalBottomSheet<void>(
      context: context,
      backgroundColor: const Color(0xFF1E1E28),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                isRtl ? 'اختر صوت الإشعار' : 'Notification sound',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                ),
              ),
            ),
            ...NotificationSoundOption.values.map((opt) {
              return ListTile(
                leading: Icon(
                  opt == NotificationSoundOption.silent
                      ? FeatherIcons.volumeX
                      : FeatherIcons.bell,
                  color: AppColors.gold,
                ),
                title: Text(
                  isRtl ? opt.labelAr : opt.id,
                  style: const TextStyle(color: Colors.white),
                ),
                trailing: current == opt
                    ? const Icon(Icons.check, color: AppColors.gold)
                    : null,
                onTap: () async {
                  await service.setSound(opt);
                  await service.play();
                  if (ctx.mounted) Navigator.pop(ctx);
                },
              );
            }),
          ],
        ),
      ),
    );
  }
}

class _Tile extends StatelessWidget {
  const _Tile({
    required this.icon,
    required this.label,
    this.trailing,
    this.onTap,
  });

  final IconData icon;
  final String label;
  final String? trailing;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Colors.white.withValues(alpha: 0.05),
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Icon(icon, color: AppColors.gold),
        title: Text(label, style: const TextStyle(color: Colors.white)),
        trailing: trailing != null
            ? Text(trailing!, style: const TextStyle(color: AppColors.gold))
            : const Icon(Icons.chevron_left, color: AppColors.gold),
        onTap: onTap,
      ),
    );
  }
}
