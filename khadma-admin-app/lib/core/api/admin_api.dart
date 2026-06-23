import '../auth/clerk_auth_service.dart';
import 'api_client.dart';

class AdminApi {
  AdminApi(this._client);

  final ApiClient _client;

  ApiClient get client => _client;

  // ── Auth / users ──────────────────────────────────────────────
  Future<Map<String, dynamic>> getMe() =>
      _client.fetch('/users/me', parser: (j) => j as Map<String, dynamic>);

  Future<List<Map<String, dynamic>>> listUsers() => _client.fetch(
        '/users',
        parser: (j) => (j as List).cast<Map<String, dynamic>>(),
      );

  Future<Map<String, dynamic>> updateUserStatus(
    int id, {
    required String accountStatus,
    String? suspendedUntil,
  }) =>
      _client.fetch(
        '/users/$id/status',
        method: 'PATCH',
        body: {
          'accountStatus': accountStatus,
          if (suspendedUntil != null) 'suspendedUntil': suspendedUntil,
        },
        parser: (j) => j as Map<String, dynamic>,
      );

  // ── Inbox / chat ──────────────────────────────────────────────
  Future<Map<String, dynamic>> inboxSummary() => _client.fetch(
        '/admin/inbox/summary',
        parser: (j) => j as Map<String, dynamic>,
      );

  Future<List<Map<String, dynamic>>> listContactMessages() => _client.fetch(
        '/messages',
        parser: (j) => (j as List).cast<Map<String, dynamic>>(),
      );

  Future<Map<String, dynamic>> updateContactMessage(
    int id, {
    required String status,
    String? reply,
  }) =>
      _client.fetch(
        '/messages/$id',
        method: 'PATCH',
        body: {'status': status, if (reply != null) 'reply': reply},
        parser: (j) => j as Map<String, dynamic>,
      );

  Future<List<Map<String, dynamic>>> listChatConversations() => _client.fetch(
        '/admin/chat/conversations',
        parser: (j) => (j as List).cast<Map<String, dynamic>>(),
      );

  Future<List<Map<String, dynamic>>> listChatMessages({
    required int requestId,
    required int providerId,
  }) =>
      _client.fetch(
        '/admin/chat/messages',
        queryParameters: {'requestId': requestId, 'providerId': providerId},
        parser: (j) => (j as List).cast<Map<String, dynamic>>(),
      );

  // ── Analytics / commission ────────────────────────────────────
  Future<Map<String, dynamic>> analytics() => _client.fetch(
        '/admin/analytics',
        parser: (j) => j as Map<String, dynamic>,
      );

  Future<Map<String, dynamic>> commissionOverview() => _client.fetch(
        '/commission/admin',
        parser: (j) => j as Map<String, dynamic>,
      );

  Future<Map<String, dynamic>> recordSettlement({
    required int providerId,
    required int amount,
    String? note,
  }) =>
      _client.fetch(
        '/commission/admin/settlements',
        method: 'POST',
        body: {
          'providerId': providerId,
          'amount': amount,
          if (note != null) 'note': note,
        },
        parser: (j) => j as Map<String, dynamic>,
      );

  Future<Map<String, dynamic>> onlineCount() => _client.fetch(
        '/admin/online-count',
        parser: (j) => j as Map<String, dynamic>,
      );

  // ── Providers ─────────────────────────────────────────────────
  Future<List<Map<String, dynamic>>> listProviders({String? status}) =>
      _client.fetch(
        '/providers',
        queryParameters: status != null ? {'status': status} : null,
        parser: (j) => (j as List).cast<Map<String, dynamic>>(),
      );

  Future<List<Map<String, dynamic>>> listAllProviders() async {
    const statuses = [
      'pending',
      'under_review',
      'needs_info',
      'approved',
      'rejected',
    ];
    final all = <Map<String, dynamic>>[];
    final seen = <int>{};
    for (final s in statuses) {
      final rows = await listProviders(status: s);
      for (final r in rows) {
        final id = r['id'] as int;
        if (seen.add(id)) all.add(r);
      }
    }
    return all;
  }

  Future<Map<String, dynamic>> getProvider(int id) => _client.fetch(
        '/providers/$id',
        parser: (j) => j as Map<String, dynamic>,
      );

  Future<Map<String, dynamic>> updateProvider(
    int id,
    Map<String, dynamic> data,
  ) =>
      _client.fetch(
        '/providers/$id',
        method: 'PATCH',
        body: data,
        parser: (j) => j as Map<String, dynamic>,
      );

  Future<void> requestProviderInfo(int id, String message) => _client.fetch(
        '/providers/$id/request-info',
        method: 'POST',
        body: {'message': message},
      );

  String providerDocumentUrl(int providerId, String kind) =>
      '${_client.baseUrl}/api/providers/$providerId/documents/$kind';

  // ── Skills / services ─────────────────────────────────────────
  Future<List<Map<String, dynamic>>> listSkills({
    String status = 'all',
    String type = 'all',
  }) =>
      _client.fetch(
        '/skills',
        queryParameters: {'status': status, 'type': type},
        parser: (j) => (j as List).cast<Map<String, dynamic>>(),
      );

  Future<Map<String, dynamic>> getSkill(int id) => _client.fetch(
        '/skills/$id',
        parser: (j) => j as Map<String, dynamic>,
      );

  Future<Map<String, dynamic>> createSkill(Map<String, dynamic> data) =>
      _client.fetch(
        '/skills',
        method: 'POST',
        body: data,
        parser: (j) => j as Map<String, dynamic>,
      );

  Future<Map<String, dynamic>> updateSkill(int id, Map<String, dynamic> data) =>
      _client.fetch(
        '/skills/$id',
        method: 'PATCH',
        body: data,
        parser: (j) => j as Map<String, dynamic>,
      );

  Future<void> deleteSkill(int id) => _client.fetch(
        '/skills/$id',
        method: 'DELETE',
      );

  // ── Requests / offers ─────────────────────────────────────────
  Future<List<Map<String, dynamic>>> listRequests() => _client.fetch(
        '/requests',
        parser: (j) => (j as List).cast<Map<String, dynamic>>(),
      );

  Future<Map<String, dynamic>> getRequest(int id) => _client.fetch(
        '/requests/$id',
        parser: (j) => j as Map<String, dynamic>,
      );

  Future<Map<String, dynamic>> updateRequest(
    int id,
    Map<String, dynamic> data,
  ) =>
      _client.fetch(
        '/requests/$id',
        method: 'PATCH',
        body: data,
        parser: (j) => j as Map<String, dynamic>,
      );

  Future<List<Map<String, dynamic>>> listRequestOffers(int requestId) =>
      _client.fetch(
        '/requests/$requestId/offers',
        parser: (j) => (j as List).cast<Map<String, dynamic>>(),
      );

  Future<Map<String, dynamic>> updateOffer(
    int id,
    Map<String, dynamic> data,
  ) =>
      _client.fetch(
        '/offers/$id',
        method: 'PATCH',
        body: data,
        parser: (j) => j as Map<String, dynamic>,
      );

  // ── Storage ───────────────────────────────────────────────────
  Future<Map<String, dynamic>> requestUploadUrl({
    required String name,
    required int size,
    required String contentType,
  }) =>
      _client.fetch(
        '/storage/uploads/request-url',
        method: 'POST',
        body: {'name': name, 'size': size, 'contentType': contentType},
        parser: (j) => j as Map<String, dynamic>,
      );
}

class AdminApiFactory {
  static AdminApi create(ClerkAuthService auth) {
    final client = ApiClient(authTokenGetter: auth.getSessionToken);
    return AdminApi(client);
  }
}
