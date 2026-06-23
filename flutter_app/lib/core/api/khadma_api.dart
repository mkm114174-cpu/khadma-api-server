import '../../models/commission_summary.dart';
import '../../models/offer.dart';
import '../../models/provider_profile.dart';
import '../../models/service_request.dart';
import '../../models/skill.dart';
import '../../models/user.dart';
import 'api_client.dart';
import '../utils/email.dart';

class KhadmaApi {
  KhadmaApi(this._client);

  final ApiClient _client;

  Future<User> getCurrentUser() {
    return _client.fetch(
      '/api/users/me',
      parser: (json) => User.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<User> updateCurrentUser({String? phone, String? name}) {
    return _client.fetch(
      '/api/users/me',
      method: 'PATCH',
      body: {
        if (phone != null) 'phone': phone,
        if (name != null) 'name': name,
      },
      parser: (json) => User.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<User> provisionUser({
    required String name,
    required String role,
    String? email,
    String? phone,
    bool? commissionAgreed,
    String? language,
  }) {
    return _client.fetch(
      '/api/users',
      method: 'POST',
      body: {
        'name': name,
        'role': role,
        if (email != null) 'email': normalizeEmail(email),
        if (phone != null) 'phone': phone,
        if (commissionAgreed != null) 'commissionAgreed': commissionAgreed,
        if (language != null) 'language': language,
      },
      parser: (json) => User.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<List<Skill>> listSkills({String status = 'approved'}) {
    return _client.fetch(
      '/api/skills',
      queryParameters: {'status': status},
      parser: (json) => (json as List<dynamic>)
          .map((e) => Skill.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  Future<List<ServiceRequest>> listRequests({
    bool mine = false,
    String? status,
    double? lat,
    double? lng,
    double? radiusKm,
    int? providerId,
  }) {
    return _client.fetch(
      '/api/requests',
      queryParameters: {
        if (mine) 'mine': 'true',
        if (status != null) 'status': status,
        if (lat != null) 'lat': lat.toString(),
        if (lng != null) 'lng': lng.toString(),
        if (radiusKm != null) 'radiusKm': radiusKm.toString(),
        if (providerId != null) 'providerId': providerId.toString(),
      },
      parser: (json) => (json as List<dynamic>)
          .map((e) => ServiceRequest.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  Future<ProviderProfile> getMyProvider() {
    return _client.fetch(
      '/api/providers/me',
      parser: (json) => ProviderProfile.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<Offer> createOffer({
    required int requestId,
    required int price,
    String? message,
    String? availableTime,
    String? estimatedDuration,
  }) {
    return _client.fetch(
      '/api/offers',
      method: 'POST',
      body: {
        'requestId': requestId,
        'price': price,
        if (message != null) 'message': message,
        if (availableTime != null) 'availableTime': availableTime,
        if (estimatedDuration != null) 'estimatedDuration': estimatedDuration,
      },
      parser: (json) => Offer.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<List<Offer>> listMyOffers() {
    return _client.fetch(
      '/api/offers',
      queryParameters: {'mine': 'true'},
      parser: (json) => (json as List<dynamic>)
          .map((e) => Offer.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  Future<ServiceRequest> getRequest(int id) {
    return _client.fetch(
      '/api/requests/$id',
      parser: (json) => ServiceRequest.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<ServiceRequest> createRequest({
    required int skillId,
    required String description,
    required String address,
    double? lat,
    double? lng,
    String? imageUrl,
    String? videoUrl,
    bool includesSpareParts = false,
    String? preferredTime,
    String? scheduledTime,
  }) {
    return _client.fetch(
      '/api/requests',
      method: 'POST',
      body: {
        'skillId': skillId,
        'description': description,
        'address': address,
        if (lat != null) 'lat': lat,
        if (lng != null) 'lng': lng,
        if (imageUrl != null) 'imageUrl': imageUrl,
        if (videoUrl != null) 'videoUrl': videoUrl,
        'includesSpareParts': includesSpareParts,
        'paymentMethod': 'on_site',
        if (preferredTime != null) 'preferredTime': preferredTime,
        if (scheduledTime != null) 'scheduledTime': scheduledTime,
      },
      parser: (json) => ServiceRequest.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<List<Offer>> listRequestOffers(int requestId) {
    return _client.fetch(
      '/api/requests/$requestId/offers',
      parser: (json) => (json as List<dynamic>)
          .map((e) => Offer.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  Future<Offer> updateOffer(int id, {required String status}) {
    return _client.fetch(
      '/api/offers/$id',
      method: 'PATCH',
      body: {'status': status},
      parser: (json) => Offer.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<ProviderProfile> createProvider({
    required String phone,
    required String addressText,
    required String docOsekPaturPath,
    required String docIdPath,
    String? docOsekMurshePath,
    String? serviceType,
    String? bio,
    int? experienceYears,
    String? city,
    double? lat,
    double? lng,
  }) {
    return _client.fetch(
      '/api/providers',
      method: 'POST',
      body: {
        'phone': phone,
        'addressText': addressText,
        'docOsekPaturPath': docOsekPaturPath,
        'docIdPath': docIdPath,
        if (docOsekMurshePath != null) 'docOsekMurshePath': docOsekMurshePath,
        if (serviceType != null) 'serviceType': serviceType,
        if (bio != null) 'bio': bio,
        if (experienceYears != null) 'experienceYears': experienceYears,
        if (city != null) 'city': city,
        if (lat != null) 'lat': lat,
        if (lng != null) 'lng': lng,
      },
      parser: (json) => ProviderProfile.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<List<ProviderProfile>> listProviders() {
    return _client.fetch(
      '/api/providers',
      parser: (json) => (json as List<dynamic>)
          .map((e) => ProviderProfile.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  Future<List<dynamic>> listNotifications() {
    return _client.fetch('/api/notifications');
  }

  Future<void> markNotificationRead(int id) {
    return _client.fetch(
      '/api/notifications/$id',
      method: 'PATCH',
      body: {'isRead': true},
    );
  }

  Future<List<dynamic>> listProviderSkills() {
    return _client.fetch('/api/provider-skills');
  }

  Future<List<dynamic>> setProviderSkills(List<int> skillIds) {
    return _client.fetch(
      '/api/provider-skills',
      method: 'POST',
      body: {'skillIds': skillIds},
    );
  }

  Future<Skill> proposeSkill({
    required String name,
    required String slug,
    String? category,
  }) {
    return _client.fetch(
      '/api/skills',
      method: 'POST',
      body: {
        'name': name,
        'slug': slug,
        if (category != null) 'category': category,
      },
      parser: (json) => Skill.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<CommissionSummary> getMyCommission() {
    return _client.fetch(
      '/api/commission/me',
      parser: (json) => CommissionSummary.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<void> sendContactMessage({
    required String name,
    required String message,
    String? email,
    String? subject,
  }) {
    return _client.fetch(
      '/api/messages',
      method: 'POST',
      body: {
        'name': name,
        'message': message,
        if (email != null && email.isNotEmpty) 'email': email,
        if (subject != null && subject.isNotEmpty) 'subject': subject,
      },
    );
  }
}
