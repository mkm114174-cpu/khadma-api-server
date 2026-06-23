import 'package:flutter/material.dart';
import 'package:flutter_feather_icons/flutter_feather_icons.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/routing.dart';
import '../../models/service_request.dart';
import '../../providers/language_provider.dart';
import '../../providers/request_providers.dart';
import '../../widgets/provider_offer_sheet.dart';

/// Provider job board — see nearby requests, watch video, submit offer.
class ProviderRequestsScreen extends ConsumerWidget {
  const ProviderRequestsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(appStringsProvider);
    final providerAsync = ref.watch(myProviderProvider);
    final nearbyAsync = ref.watch(nearbyRequestsProvider);
    final offersAsync = ref.watch(myOffersProvider);

    final provider = providerAsync.valueOrNull;
    final hasGps = provider?.lat != null && provider?.lng != null;

    return Scaffold(
      backgroundColor: AppColors.darkBg,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.all(20),
              child: Text(
                t.provider.title,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            if (!hasGps)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.orange.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.orange.withValues(alpha: 0.4)),
                  ),
                  child: Text(
                    t.provider.gpsRequiredProvider,
                    style: const TextStyle(color: Colors.orangeAccent),
                  ),
                ),
              ),
            Expanded(
              child: nearbyAsync.when(
                loading: () => const Center(
                  child: CircularProgressIndicator(color: AppColors.gold),
                ),
                error: (_, __) => Center(child: Text(t.req.error)),
                data: (requests) {
                  final offeredIds = (offersAsync.valueOrNull ?? [])
                      .map((o) => o.requestId)
                      .toSet();
                  final available = requests
                      .where((r) => !offeredIds.contains(r.id) && r.lat != null)
                      .toList();

                  if (available.isEmpty) {
                    return Center(
                      child: Text(
                        hasGps ? t.provider.noRequests : t.provider.gpsRequiredProvider,
                        style: TextStyle(color: Colors.white.withValues(alpha: 0.6)),
                      ),
                    );
                  }

                  return RefreshIndicator(
                    color: AppColors.gold,
                    onRefresh: () async {
                      ref.invalidate(nearbyRequestsProvider);
                      ref.invalidate(myOffersProvider);
                    },
                    child: ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: available.length,
                      itemBuilder: (_, i) {
                        final req = available[i];
                        double? dist;
                        if (hasGps && req.lat != null && req.lng != null) {
                          dist = haversineKm(
                            LatLng(latitude: provider!.lat!, longitude: provider.lng!),
                            LatLng(latitude: req.lat!, longitude: req.lng!),
                          );
                        }
                        return _RequestCard(
                          request: req,
                          distanceKm: dist,
                          navigateLabel: t.provider.navigate,
                          offerLabel: t.provider.offerTitle,
                          onOffer: () => ProviderOfferSheet.show(
                            context,
                            request: req,
                            distanceKm: dist,
                            onSubmitted: () {
                              ref.invalidate(nearbyRequestsProvider);
                              ref.invalidate(myOffersProvider);
                            },
                          ),
                          onNavigate: req.lat != null && req.lng != null
                              ? () => context.push('/navigate/${req.id}')
                              : null,
                        );
                      },
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RequestCard extends StatelessWidget {
  const _RequestCard({
    required this.request,
    required this.onOffer,
    required this.navigateLabel,
    required this.offerLabel,
    this.distanceKm,
    this.onNavigate,
  });

  final ServiceRequest request;
  final double? distanceKm;
  final VoidCallback onOffer;
  final VoidCallback? onNavigate;
  final String navigateLabel;
  final String offerLabel;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            request.description ?? '#${request.requestNumber}',
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          if (request.address != null) ...[
            const SizedBox(height: 6),
            Text(
              request.address!,
              style: TextStyle(color: Colors.white.withValues(alpha: 0.6), fontSize: 13),
            ),
          ],
          if (distanceKm != null) ...[
            const SizedBox(height: 6),
            Text(
              formatDistance(distanceKm!),
              style: const TextStyle(color: AppColors.gold, fontSize: 13),
            ),
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              if (request.videoUrl != null || request.imageUrl != null)
                Padding(
                  padding: const EdgeInsets.only(left: 8),
                  child: Icon(
                    request.videoUrl != null ? FeatherIcons.video : FeatherIcons.image,
                    size: 14,
                    color: AppColors.gold,
                  ),
                ),
              const Spacer(),
              if (onNavigate != null)
                OutlinedButton.icon(
                  onPressed: onNavigate,
                  icon: const Icon(FeatherIcons.navigation, size: 16),
                  label: Text(navigateLabel, style: const TextStyle(fontSize: 11)),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.gold,
                  ),
                ),
              const SizedBox(width: 8),
              FilledButton.icon(
                onPressed: onOffer,
                icon: const Icon(FeatherIcons.dollarSign, size: 16),
                label: Text(offerLabel, style: const TextStyle(fontSize: 11)),
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.gold,
                  foregroundColor: Colors.black,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
