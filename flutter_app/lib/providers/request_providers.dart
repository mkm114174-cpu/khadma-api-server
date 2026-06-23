import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/api/api_exception.dart';
import '../core/storage/upload_service.dart';
import '../models/offer.dart';
import '../models/provider_profile.dart';
import '../models/service_request.dart';
import '../models/skill.dart';
import 'auth_provider.dart';

final uploadServiceProvider = Provider<UploadService>((ref) {
  return UploadService(ref.watch(apiClientProvider));
});

final skillsProvider = FutureProvider<List<Skill>>((ref) async {
  return ref.watch(khadmaApiProvider).listSkills();
});

final myRequestsProvider = FutureProvider<List<ServiceRequest>>((ref) async {
  try {
    return await ref.watch(khadmaApiProvider).listRequests(mine: true);
  } on ApiException {
    return [];
  }
});

final myProviderProvider = FutureProvider<ProviderProfile?>((ref) async {
  try {
    return await ref.watch(khadmaApiProvider).getMyProvider();
  } on ApiException {
    return null;
  }
});

final nearbyRequestsProvider = FutureProvider<List<ServiceRequest>>((ref) async {
  final provider = await ref.watch(myProviderProvider.future);
  if (provider?.lat == null || provider?.lng == null) return [];
  try {
    return await ref.watch(khadmaApiProvider).listRequests(
          status: 'pending',
          lat: provider!.lat,
          lng: provider.lng,
          radiusKm: 25,
        );
  } on ApiException {
    return [];
  }
});

final myOffersProvider = FutureProvider<List<Offer>>((ref) async {
  try {
    return await ref.watch(khadmaApiProvider).listMyOffers();
  } on ApiException {
    return [];
  }
});

final providersProvider = FutureProvider<List<ProviderProfile>>((ref) async {
  try {
    return await ref.watch(khadmaApiProvider).listProviders();
  } on ApiException {
    return [];
  }
});

final requestDetailProvider =
    FutureProvider.family<ServiceRequest, int>((ref, id) async {
  return ref.watch(khadmaApiProvider).getRequest(id);
});

final requestOffersProvider =
    FutureProvider.family<List<Offer>, int>((ref, id) async {
  return ref.watch(khadmaApiProvider).listRequestOffers(id);
});

DateTime timeFromPreset(String id) {
  final d = DateTime.now();
  switch (id) {
    case 'todayEvening':
      return DateTime(d.year, d.month, d.day, 18);
    case 'tomorrowMorning':
      final t = d.add(const Duration(days: 1));
      return DateTime(t.year, t.month, t.day, 9);
    case 'tomorrowEvening':
      final t = d.add(const Duration(days: 1));
      return DateTime(t.year, t.month, t.day, 18);
    case 'asap':
    default:
      return d;
  }
}
