import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../models/user.dart';
import '../providers/auth_provider.dart';
import '../providers/language_provider.dart';
import '../screens/auth/complete_profile_screen.dart';
import '../screens/auth/email_code_screen.dart';
import '../screens/auth/language_screen.dart';
import '../screens/auth/onboarding_screen.dart';
import '../screens/auth/provider_onboarding_screen.dart';
import '../screens/auth/role_screen.dart';
import '../screens/auth/sign_in_screen.dart';
import '../screens/auth/sign_up_screen.dart';
import '../screens/contact_screen.dart';
import '../screens/notifications_screen.dart';
import '../screens/profile/edit_profile_screen.dart';
import '../screens/provider/navigate_screen.dart';
import '../screens/provider/provider_shell.dart';
import '../screens/request/new_request_screen.dart';
import '../screens/request/request_detail_screen.dart';
import '../screens/tabs/main_shell.dart';

class AppRoutes {
  static const language = '/auth/language';
  static const onboarding = '/auth/onboarding';
  static const role = '/auth/role';
  static const signIn = '/auth/sign-in';
  static const signUp = '/auth/sign-up';
  static const emailCode = '/auth/email-code';
  static const complete = '/auth/complete';
  static const providerSkills = '/auth/provider-skills';
  static const tabs = '/tabs';
  static const provider = '/provider';
  static const editProfile = '/profile/edit';
  static const contact = '/contact';
  static const notifications = '/notifications';
  static const newRequest = '/request/new';
  static String requestDetail(int id) => '/request/$id';
}

/// Stable GoRouter — do NOT recreate on auth changes (that wiped OTP screen state).
final routerProvider = Provider<GoRouter>((ref) {
  final refresh = ValueNotifier<int>(0);
  ref.listen(authProvider, (_, __) => refresh.value++);
  ref.listen(hasSavedLanguageProvider, (_, __) => refresh.value++);
  ref.onDispose(refresh.dispose);

  return GoRouter(
    initialLocation: AppRoutes.language,
    refreshListenable: refresh,
    redirect: (context, state) {
      final auth = ref.read(authProvider);
      final hasLang = ref.read(hasSavedLanguageProvider);
      final loc = state.matchedLocation;
      final inAuth = loc.startsWith('/auth');
      final inTabs = loc.startsWith('/tabs');
      final inProvider = loc.startsWith('/provider');
      final isPublic = inAuth || loc == AppRoutes.contact;

      if (auth.status == AuthStatus.loading || auth.status == AuthStatus.error) {
        return null;
      }

      if (loc.startsWith('/request') && auth.status == AuthStatus.signedOut) {
        return AppRoutes.emailCode;
      }

      if (auth.status == AuthStatus.signedOut) {
        if (auth.hasLocalSession) {
          if (loc != AppRoutes.emailCode &&
              loc != AppRoutes.complete &&
              loc != AppRoutes.providerSkills) {
            return AppRoutes.complete;
          }
          return null;
        }
        if (!isPublic) {
          return hasLang ? AppRoutes.onboarding : AppRoutes.language;
        }
        return null;
      }

      if (auth.status == AuthStatus.needsProvision) {
        if (loc == AppRoutes.complete ||
            loc == AppRoutes.providerSkills ||
            loc == AppRoutes.emailCode) {
          return null;
        }
        return AppRoutes.complete;
      }

      if (auth.status == AuthStatus.guest) {
        if (inAuth) return AppRoutes.tabs;
        return null;
      }

      if (auth.status == AuthStatus.ready) {
        final role = auth.role;
        if (inAuth && loc != AppRoutes.providerSkills) {
          return role == AppRole.provider ? AppRoutes.provider : AppRoutes.tabs;
        }
        if (role == AppRole.provider && inTabs) return AppRoutes.provider;
        if (role != AppRole.provider && inProvider) return AppRoutes.tabs;
      }

      return null;
    },
    routes: [
      GoRoute(
        path: AppRoutes.language,
        builder: (_, __) => const LanguageScreen(),
      ),
      GoRoute(
        path: AppRoutes.onboarding,
        builder: (_, __) => const OnboardingScreen(),
      ),
      GoRoute(
        path: AppRoutes.role,
        builder: (_, __) => const RoleScreen(),
      ),
      GoRoute(
        path: AppRoutes.signIn,
        builder: (_, __) => const SignInScreen(),
      ),
      GoRoute(
        path: AppRoutes.signUp,
        builder: (_, state) {
          final role = state.uri.queryParameters['role'] ?? 'provider';
          return SignUpScreen(role: role);
        },
      ),
      GoRoute(
        path: AppRoutes.emailCode,
        builder: (_, __) => const EmailCodeScreen(),
      ),
      GoRoute(
        path: AppRoutes.complete,
        builder: (_, __) => const CompleteProfileScreen(),
      ),
      GoRoute(
        path: AppRoutes.providerSkills,
        builder: (_, __) => const ProviderOnboardingScreen(),
      ),
      GoRoute(
        path: AppRoutes.tabs,
        builder: (_, __) => const MainShell(),
      ),
      GoRoute(
        path: AppRoutes.contact,
        builder: (_, __) => const ContactScreen(),
      ),
      GoRoute(
        path: AppRoutes.notifications,
        builder: (_, __) => const NotificationsScreen(),
      ),
      GoRoute(
        path: AppRoutes.provider,
        builder: (_, __) => const ProviderShell(),
      ),
      GoRoute(
        path: AppRoutes.editProfile,
        builder: (_, __) => const EditProfileScreen(),
      ),
      GoRoute(
        path: '/navigate/:id',
        builder: (_, state) {
          final id = int.tryParse(state.pathParameters['id'] ?? '') ?? 0;
          return NavigateScreen(requestId: id);
        },
      ),
      GoRoute(
        path: AppRoutes.newRequest,
        builder: (context, state) {
          final category = state.uri.queryParameters['category'] ?? 'other';
          return NewRequestScreen(category: category);
        },
      ),
      GoRoute(
        path: '/request/:id',
        builder: (_, state) {
          final id = int.tryParse(state.pathParameters['id'] ?? '') ?? 0;
          return RequestDetailScreen(requestId: id);
        },
      ),
    ],
  );
});
