import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/api/admin_api.dart';
import '../core/auth/clerk_auth_service.dart';
import '../core/storage/upload_service.dart';

final clerkAuthProvider = Provider<ClerkAuthService>((_) => ClerkAuthService());

final adminApiProvider = Provider<AdminApi>((ref) {
  return AdminApiFactory.create(ref.watch(clerkAuthProvider));
});

final uploadServiceProvider = Provider<UploadService>((ref) {
  return UploadService(ref.watch(adminApiProvider).client);
});

final authTokenProvider = FutureProvider<String?>((ref) async {
  return ref.watch(clerkAuthProvider).getSessionToken();
});

final adminUserProvider = FutureProvider<Map<String, dynamic>?>((ref) async {
  final token = await ref.watch(authTokenProvider.future);
  if (token == null || token.isEmpty) return null;
  try {
    final me = await ref.watch(adminApiProvider).getMe();
    if (me['role'] != 'admin') return null;
    return me;
  } catch (_) {
    return null;
  }
});

final inboxSummaryProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  return ref.watch(adminApiProvider).inboxSummary();
});

final contactMessagesProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) async {
  return ref.watch(adminApiProvider).listContactMessages();
});

final chatConversationsProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) async {
  return ref.watch(adminApiProvider).listChatConversations();
});

final analyticsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  return ref.watch(adminApiProvider).analytics();
});

final commissionProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  return ref.watch(adminApiProvider).commissionOverview();
});

final providersProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  return ref.watch(adminApiProvider).listAllProviders();
});

final skillsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  return ref.watch(adminApiProvider).listSkills(status: 'all', type: 'all');
});

final requestsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  return ref.watch(adminApiProvider).listRequests();
});

final usersProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  return ref.watch(adminApiProvider).listUsers();
});

final onlineCountProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  return ref.watch(adminApiProvider).onlineCount();
});

final requestOffersProvider =
    FutureProvider.family<List<Map<String, dynamic>>, int>((ref, id) async {
  return ref.watch(adminApiProvider).listRequestOffers(id);
});

final providerDetailProvider =
    FutureProvider.family<Map<String, dynamic>, int>((ref, id) async {
  return ref.watch(adminApiProvider).getProvider(id);
});

final skillDetailProvider =
    FutureProvider.family<Map<String, dynamic>, int>((ref, id) async {
  return ref.watch(adminApiProvider).getSkill(id);
});

final requestDetailProvider =
    FutureProvider.family<Map<String, dynamic>, int>((ref, id) async {
  return ref.watch(adminApiProvider).getRequest(id);
});
