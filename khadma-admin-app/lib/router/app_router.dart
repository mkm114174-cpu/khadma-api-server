import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../providers/admin_providers.dart';
import '../screens/auth/sign_in_screen.dart';
import '../screens/commission/commission_screen.dart';
import '../screens/dashboard/dashboard_screen.dart';
import '../screens/inbox/chat_conversations_screen.dart';
import '../screens/inbox/chat_thread_screen.dart';
import '../screens/inbox/contact_messages_screen.dart';
import '../screens/inbox/message_detail_screen.dart';
import '../screens/performance/performance_screen.dart';
import '../screens/providers/provider_detail_screen.dart';
import '../screens/providers/providers_screen.dart';
import '../screens/requests/request_detail_screen.dart';
import '../screens/requests/requests_screen.dart';
import '../screens/services/service_edit_screen.dart';
import '../screens/services/services_screen.dart';
import '../screens/users/users_screen.dart';

class AppRoutes {
  static const signIn = '/sign-in';
  static const dashboard = '/';
  static const providers = '/providers';
  static const services = '/services';
  static const requests = '/requests';
  static const commission = '/commission';
  static const performance = '/performance';
  static const users = '/users';
  static const inbox = '/inbox';
  static const chats = '/chats';

  static String providerDetail(int id) => '/providers/$id';
  static String serviceEdit(int id) => '/services/$id';
  static String requestDetail(int id) => '/requests/$id';
  static String messageDetail(int id) => '/inbox/message/$id';
  static String chatThread(int requestId, int providerId) =>
      '/chats/$requestId/$providerId';
}

final routerProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authTokenProvider);

  return GoRouter(
    initialLocation: AppRoutes.dashboard,
    redirect: (context, state) {
      if (auth.isLoading) return null;
      final token = auth.valueOrNull;
      final onSignIn = state.matchedLocation == AppRoutes.signIn;
      if ((token == null || token.isEmpty) && !onSignIn) return AppRoutes.signIn;
      if (token != null && token.isNotEmpty && onSignIn) return AppRoutes.dashboard;
      return null;
    },
    routes: [
      GoRoute(path: AppRoutes.signIn, builder: (_, __) => const SignInScreen()),
      GoRoute(path: AppRoutes.dashboard, builder: (_, __) => const DashboardScreen()),
      GoRoute(path: AppRoutes.providers, builder: (_, __) => const ProvidersScreen()),
      GoRoute(
        path: '/providers/:id',
        builder: (_, s) => ProviderDetailScreen(
          providerId: int.tryParse(s.pathParameters['id'] ?? '') ?? 0,
        ),
      ),
      GoRoute(path: AppRoutes.services, builder: (_, __) => const ServicesScreen()),
      GoRoute(
        path: '/services/:id',
        builder: (_, s) => ServiceEditScreen(
          skillId: int.tryParse(s.pathParameters['id'] ?? '') ?? 0,
        ),
      ),
      GoRoute(path: AppRoutes.requests, builder: (_, __) => const RequestsScreen()),
      GoRoute(
        path: '/requests/:id',
        builder: (_, s) => RequestDetailScreen(
          requestId: int.tryParse(s.pathParameters['id'] ?? '') ?? 0,
        ),
      ),
      GoRoute(path: AppRoutes.commission, builder: (_, __) => const CommissionScreen()),
      GoRoute(path: AppRoutes.performance, builder: (_, __) => const PerformanceScreen()),
      GoRoute(path: AppRoutes.users, builder: (_, __) => const UsersScreen()),
      GoRoute(path: AppRoutes.inbox, builder: (_, __) => const ContactMessagesScreen()),
      GoRoute(
        path: '/inbox/message/:id',
        builder: (_, s) => MessageDetailScreen(
          messageId: int.tryParse(s.pathParameters['id'] ?? '') ?? 0,
        ),
      ),
      GoRoute(path: AppRoutes.chats, builder: (_, __) => const ChatConversationsScreen()),
      GoRoute(
        path: '/chats/:requestId/:providerId',
        builder: (_, s) => ChatThreadScreen(
          requestId: int.tryParse(s.pathParameters['requestId'] ?? '') ?? 0,
          providerId: int.tryParse(s.pathParameters['providerId'] ?? '') ?? 0,
        ),
      ),
    ],
  );
});
