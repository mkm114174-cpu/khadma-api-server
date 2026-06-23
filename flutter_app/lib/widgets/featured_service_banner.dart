import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_feather_icons/flutter_feather_icons.dart';
import 'package:go_router/go_router.dart';

import '../constants/home_services.dart';
import '../core/theme/app_colors.dart';
import '../l10n/app_locale.dart';
import '../router/app_router.dart';

/// Large featured card for the primary home service (صيانة المنزل).
class FeaturedServiceBanner extends StatelessWidget {
  const FeaturedServiceBanner({
    super.key,
    required this.service,
    required this.locale,
    required this.bookLabel,
  });

  final HomeServiceDef service;
  final AppLocale locale;
  final String bookLabel;

  @override
  Widget build(BuildContext context) {
    final texts = serviceTexts(locale, service.id);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => context.push('${AppRoutes.newRequest}?category=${service.id}'),
        borderRadius: BorderRadius.circular(20),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: SizedBox(
            height: 128,
            child: Stack(
              fit: StackFit.expand,
              children: [
                CachedNetworkImage(
                  imageUrl: service.imageUrl,
                  fit: BoxFit.cover,
                  placeholder: (_, __) => DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(colors: service.gradient),
                    ),
                  ),
                  errorWidget: (_, __, ___) => DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(colors: service.gradient),
                    ),
                    child: Icon(service.icon, color: Colors.white54, size: 48),
                  ),
                ),
                DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.centerRight,
                      end: Alignment.centerLeft,
                      colors: [
                        Colors.black.withValues(alpha: 0.15),
                        Colors.black.withValues(alpha: 0.88),
                      ],
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.gold.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: AppColors.gold.withValues(alpha: 0.5)),
                              ),
                              child: Text(
                                texts.subtitle,
                                style: const TextStyle(
                                  color: AppColors.gold,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              texts.title,
                              textAlign: TextAlign.right,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 22,
                                fontWeight: FontWeight.bold,
                                height: 1.2,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              locale == AppLocale.ar
                                  ? 'فنيين معتمدين بالقرب منك'
                                  : locale == AppLocale.he
                                      ? 'טכנאים מאושרים בקרבתך'
                                      : 'Certified pros near you',
                              textAlign: TextAlign.right,
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.75),
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 14),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          color: AppColors.gold,
                          borderRadius: BorderRadius.circular(14),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.gold.withValues(alpha: 0.35),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              bookLabel,
                              style: const TextStyle(
                                color: Colors.black,
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                            const SizedBox(width: 6),
                            const Icon(FeatherIcons.arrowLeft, size: 16, color: Colors.black),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
