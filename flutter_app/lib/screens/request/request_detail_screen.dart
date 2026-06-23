import 'package:flutter/material.dart';
import 'package:flutter_feather_icons/flutter_feather_icons.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/routing.dart';
import '../../models/offer.dart';
import '../../models/provider_profile.dart';
import '../../providers/auth_provider.dart';
import '../../l10n/app_locale.dart';
import '../../providers/language_provider.dart';
import '../../providers/request_providers.dart';
import '../../widgets/authed_image.dart';
import '../../widgets/offer_card.dart';
import '../../widgets/request_video_player.dart';

/// Request detail + offers sorted nearest-first — ported from request/[id].tsx
class RequestDetailScreen extends ConsumerStatefulWidget {
  const RequestDetailScreen({super.key, required this.requestId});

  final int requestId;

  @override
  ConsumerState<RequestDetailScreen> createState() => _RequestDetailScreenState();
}

class _RequestDetailScreenState extends ConsumerState<RequestDetailScreen> {
  int? _acceptingId;

  @override
  void initState() {
    super.initState();
    _startOfferPolling();
  }

  void _startOfferPolling() {
    Future<void> poll() async {
      while (mounted) {
        await Future<void>.delayed(const Duration(seconds: 15));
        if (!mounted) return;
        final request = ref.read(requestDetailProvider(widget.requestId)).valueOrNull;
        if (request != null && request.isPending) {
          ref.invalidate(requestOffersProvider(widget.requestId));
        } else {
          return;
        }
      }
    }

    poll();
  }

  List<Offer> _sortOffers(
    List<Offer> offers,
    LatLng? customerCoord,
    Map<int, ProviderProfile> providerMap,
  ) {
    double? dist(Offer o) {
      final p = providerMap[o.providerId];
      if (customerCoord == null || p?.lat == null || p?.lng == null) return null;
      return haversineKm(
        customerCoord,
        LatLng(latitude: p!.lat!, longitude: p.lng!),
      );
    }

    final sorted = [...offers];
    sorted.sort((a, b) {
      if (a.isAccepted || b.isAccepted) {
        if (a.isAccepted == b.isAccepted) return 0;
        return a.isAccepted ? -1 : 1;
      }
      final da = dist(a);
      final db = dist(b);
      if (da != null && db != null && da != db) return da.compareTo(db);
      if (da != null && db == null) return -1;
      if (da == null && db != null) return 1;
      return a.price.compareTo(b.price);
    });
    return sorted;
  }

  Future<void> _acceptOffer(Offer offer) async {
    final t = ref.read(appStringsProvider);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(t.req.confirmAccept),
        content: Text(t.req.confirmAcceptMsg),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(t.req.cancel)),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: Text(t.req.ok)),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    setState(() => _acceptingId = offer.id);
    try {
      await ref.read(khadmaApiProvider).updateOffer(offer.id, status: 'accepted');
      ref.invalidate(requestDetailProvider(widget.requestId));
      ref.invalidate(requestOffersProvider(widget.requestId));
      ref.invalidate(myRequestsProvider);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(t.req.error)));
      }
    } finally {
      if (mounted) setState(() => _acceptingId = null);
    }
  }

  String _statusLabel(String status, dynamic t) {
    return switch (status) {
      'pending' => t.req.statusPending,
      'active' => t.req.statusActive,
      'in_progress' => t.req.statusInProgress,
      'completed' => t.req.statusCompleted,
      'cancelled' => t.req.statusCancelled,
      _ => status,
    };
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(appStringsProvider);
    final locale = ref.watch(languageProvider);
    final requestAsync = ref.watch(requestDetailProvider(widget.requestId));
    final offersAsync = ref.watch(requestOffersProvider(widget.requestId));
    final providersAsync = ref.watch(providersProvider);
    final skillsAsync = ref.watch(skillsProvider);

    return Scaffold(
      backgroundColor: AppColors.darkBg,
      body: requestAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.gold),
        ),
        error: (_, __) => _ErrorBody(
          message: t.req.error,
          onBack: () => context.pop(),
        ),
        data: (request) {
          final providers = providersAsync.valueOrNull ?? [];
          final providerMap = {for (final p in providers) p.id: p};
          final skills = skillsAsync.valueOrNull ?? [];
          final skill = skills.where((s) => s.id == request.skillId).toList();
          final skillName = skill.isEmpty ? null : skill.first.localizedName(locale.code);

          final customerCoord = request.lat != null && request.lng != null
              ? LatLng(latitude: request.lat!, longitude: request.lng!)
              : null;

          final offers = offersAsync.valueOrNull ?? [];
          final sorted = _sortOffers(offers, customerCoord, providerMap);

          return CustomScrollView(
            slivers: [
              SliverAppBar(
                pinned: true,
                backgroundColor: AppColors.tabBarBg,
                leading: IconButton(
                  onPressed: () => context.pop(),
                  icon: Icon(
                    locale.isRtl ? FeatherIcons.arrowRight : FeatherIcons.arrowLeft,
                    color: Colors.white,
                  ),
                ),
                title: Text(t.req.requestDetails, style: const TextStyle(color: Colors.white)),
              ),
              SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.05),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.white12),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: AppColors.gold.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  _statusLabel(request.status, t),
                                  style: const TextStyle(color: AppColors.gold, fontSize: 12),
                                ),
                              ),
                              const Spacer(),
                              Text(
                                '#${request.requestNumber}',
                                style: TextStyle(color: Colors.white.withValues(alpha: 0.5)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(
                            skillName ?? t.req.newTitle,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          if (request.description != null) ...[
                            const SizedBox(height: 8),
                            Text(
                              request.description!,
                              style: TextStyle(color: Colors.white.withValues(alpha: 0.8)),
                            ),
                          ],
                          if (request.address != null) ...[
                            const SizedBox(height: 10),
                            Row(
                              children: [
                                const Icon(FeatherIcons.mapPin, size: 14, color: AppColors.gold),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: Text(
                                    request.address!,
                                    style: const TextStyle(color: Colors.white70),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ],
                      ),
                    ),
                    if (request.imageUrl != null || request.videoUrl != null) ...[
                      const SizedBox(height: 16),
                      if (request.imageUrl != null)
                        AuthedImage(objectPath: request.imageUrl, height: 200),
                      if (request.videoUrl != null) ...[
                        const SizedBox(height: 12),
                        Text(
                          t.req.watchVideo,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 8),
                        RequestVideoPlayer(objectPath: request.videoUrl, height: 220),
                      ],
                    ],
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        Text(
                          t.req.offersFor,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 17,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const Spacer(),
                        if (sorted.isNotEmpty)
                          Text(
                            t.req.sortNearest,
                            style: TextStyle(
                              color: AppColors.gold.withValues(alpha: 0.8),
                              fontSize: 11,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    if (offersAsync.isLoading)
                      const Padding(
                        padding: EdgeInsets.all(24),
                        child: Center(
                          child: CircularProgressIndicator(color: AppColors.gold),
                        ),
                      )
                    else if (sorted.isEmpty)
                      _EmptyOffers(
                        title: t.req.noOffers,
                        subtitle: request.isPending ? t.req.waitingOffers : t.req.noOffersSub,
                      )
                    else
                      ...sorted.map((offer) {
                        final p = providerMap[offer.providerId];
                        double? dist;
                        if (customerCoord != null && p?.lat != null && p?.lng != null) {
                          dist = haversineKm(
                            customerCoord,
                            LatLng(latitude: p!.lat!, longitude: p.lng!),
                          );
                        }
                        return OfferCard(
                          offer: offer,
                          provider: p,
                          request: request,
                          distanceKm: dist,
                          currency: t.req.currency,
                          chooseLabel: t.req.chooseOffer,
                          acceptedLabel: t.req.accepted,
                          noRatingLabel: t.req.noRating,
                          providerFallback: t.req.provider,
                          accepting: _acceptingId == offer.id,
                          onAccept: () => _acceptOffer(offer),
                        );
                      }),
                    const SizedBox(height: 80),
                  ]),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _EmptyOffers extends StatelessWidget {
  const _EmptyOffers({required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          const Icon(FeatherIcons.inbox, size: 36, color: Colors.white38),
          const SizedBox(height: 12),
          Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white.withValues(alpha: 0.5)),
          ),
        ],
      ),
    );
  }
}

class _ErrorBody extends StatelessWidget {
  const _ErrorBody({required this.message, required this.onBack});

  final String message;
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(FeatherIcons.alertTriangle, color: Colors.white38, size: 40),
          const SizedBox(height: 12),
          Text(message),
          TextButton(onPressed: onBack, child: const Text('OK')),
        ],
      ),
    );
  }
}
