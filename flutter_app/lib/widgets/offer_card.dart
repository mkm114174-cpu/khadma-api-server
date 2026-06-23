import 'package:flutter/material.dart';
import 'package:flutter_feather_icons/flutter_feather_icons.dart';

import '../core/theme/app_colors.dart';
import '../core/utils/routing.dart';
import '../models/offer.dart';
import '../models/provider_profile.dart';
import '../models/service_request.dart';

class OfferCard extends StatelessWidget {
  const OfferCard({
    super.key,
    required this.offer,
    required this.provider,
    required this.request,
    required this.distanceKm,
    required this.currency,
    required this.chooseLabel,
    required this.acceptedLabel,
    required this.noRatingLabel,
    required this.providerFallback,
    required this.onAccept,
    this.accepting = false,
  });

  final Offer offer;
  final ProviderProfile? provider;
  final ServiceRequest request;
  final double? distanceKm;
  final String currency;
  final String chooseLabel;
  final String acceptedLabel;
  final String noRatingLabel;
  final String providerFallback;
  final VoidCallback? onAccept;
  final bool accepting;

  @override
  Widget build(BuildContext context) {
    final canAccept = request.isPending && offer.isPending;
    final isAccepted = offer.isAccepted;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isAccepted
            ? const Color(0xFF0F1A0F)
            : Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isAccepted ? const Color(0xFF4CAF50) : Colors.white12,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.gold.withValues(alpha: 0.15),
                      ),
                      child: const Icon(FeatherIcons.user, color: AppColors.gold, size: 18),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            provider?.name ?? providerFallback,
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          if (provider != null && provider!.ratingCount > 0)
                            Text(
                              '★ ${provider!.rating.toStringAsFixed(1)} (${provider!.ratingCount})',
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.6),
                                fontSize: 12,
                              ),
                            )
                          else
                            Text(
                              noRatingLabel,
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.5),
                                fontSize: 12,
                              ),
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '${offer.price}',
                    style: const TextStyle(
                      color: AppColors.gold,
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(currency, style: TextStyle(color: Colors.white.withValues(alpha: 0.5), fontSize: 12)),
                ],
              ),
            ],
          ),
          if (offer.message != null && offer.message!.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              offer.message!,
              style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 14),
            ),
          ],
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            children: [
              if (distanceKm != null)
                _MetaChip(
                  icon: FeatherIcons.mapPin,
                  label: formatDistance(distanceKm!),
                ),
              if (offer.availableTime != null)
                _MetaChip(icon: FeatherIcons.calendar, label: _fmt(offer.availableTime!)),
            ],
          ),
          if (isAccepted) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(FeatherIcons.checkCircle, color: Color(0xFF4CAF50), size: 16),
                const SizedBox(width: 6),
                Text(acceptedLabel, style: const TextStyle(color: Color(0xFF4CAF50))),
              ],
            ),
          ],
          if (canAccept && onAccept != null) ...[
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: accepting ? null : onAccept,
              icon: accepting
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(FeatherIcons.check, size: 16),
              label: Text(chooseLabel),
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.gold,
                foregroundColor: Colors.black,
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _fmt(String iso) {
    final d = DateTime.tryParse(iso);
    if (d == null) return iso;
    return '${d.day}/${d.month} ${d.hour}:${d.minute.toString().padLeft(2, '0')}';
  }
}

class _MetaChip extends StatelessWidget {
  const _MetaChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: Colors.white54),
          const SizedBox(width: 4),
          Text(label, style: const TextStyle(color: Colors.white54, fontSize: 12)),
        ],
      ),
    );
  }
}
