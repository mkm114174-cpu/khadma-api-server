import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/app_theme.dart';
import 'l10n/app_locale.dart';
import 'providers/auth_provider.dart';
import 'providers/language_provider.dart';
import 'providers/theme_provider.dart';
import 'router/app_router.dart';
import 'widgets/notification_listener.dart';

class KhadmaApp extends ConsumerWidget {
  const KhadmaApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final themeMode = ref.watch(themeModeProvider);
    final locale = ref.watch(languageProvider);
    final auth = ref.watch(authProvider);
    final t = ref.watch(appStringsProvider);
    final colors = ref.watch(appColorsProvider);

    return MaterialApp.router(
      title: 'Khadma',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.build(ThemeMode.light),
      darkTheme: AppTheme.build(ThemeMode.dark),
      themeMode: themeMode == ThemeModePreference.dark ? ThemeMode.dark : ThemeMode.light,
      locale: Locale(locale.code),
      supportedLocales: AppLocale.values.map((l) => Locale(l.code)),
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      routerConfig: router,
      builder: (context, child) {
        final loc = router.routerDelegate.currentConfiguration.uri.path;
        final onAuthRoute = loc.startsWith('/auth');
        final showGlobalError = auth.status == AuthStatus.error &&
            !onAuthRoute &&
            !auth.hasLocalSession;

        return Directionality(
          textDirection: locale.isRtl ? TextDirection.rtl : TextDirection.ltr,
          child: KhadmaNotificationWatcher(
            child: Stack(
            children: [
              if (child != null) child,
              if (auth.status == AuthStatus.loading && !onAuthRoute)
                _LoadingOverlay(colors: colors),
              if (showGlobalError)
                _ErrorOverlay(
                  title: t.layout.errorTitle,
                  body: t.layout.errorBody,
                  retryLabel: t.layout.retry,
                  signOutLabel: t.layout.signOut,
                  onRetry: () => ref.read(authProvider.notifier).refresh(),
                  onSignOut: () => ref.read(authProvider.notifier).logout(),
                  colors: colors,
                ),
            ],
          ),
          ),
        );
      },
    );
  }
}

class _LoadingOverlay extends StatelessWidget {
  const _LoadingOverlay({required this.colors});

  final dynamic colors;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: colors.background,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(color: colors.primary),
            const SizedBox(height: 12),
            Text(
              'Khadma',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                letterSpacing: 2,
                color: colors.mutedForeground,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ErrorOverlay extends StatelessWidget {
  const _ErrorOverlay({
    required this.title,
    required this.body,
    required this.retryLabel,
    required this.signOutLabel,
    required this.onRetry,
    required this.onSignOut,
    required this.colors,
  });

  final String title;
  final String body;
  final String retryLabel;
  final String signOutLabel;
  final VoidCallback onRetry;
  final VoidCallback onSignOut;
  final dynamic colors;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: colors.background,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                title,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: colors.text,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                body,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: colors.mutedForeground,
                  fontSize: 15,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: onRetry,
                  style: FilledButton.styleFrom(
                    backgroundColor: colors.primary,
                    foregroundColor: const Color(0xFF0D0D0D),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Text(
                    retryLabel,
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                ),
              ),
              TextButton(
                onPressed: onSignOut,
                child: Text(
                  signOutLabel,
                  style: TextStyle(color: colors.mutedForeground),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
