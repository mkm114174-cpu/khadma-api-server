import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_feather_icons/flutter_feather_icons.dart';

import '../constants/home_services.dart';
import '../core/theme/app_colors.dart';
import '../l10n/app_locale.dart';

class ServiceCategoryCard extends StatelessWidget {
  const ServiceCategoryCard({
    super.key,
    required this.service,
    required this.locale,
    required this.onTap,
    this.selected = false,
    this.compact = false,
  });

  final HomeServiceDef service;
  final AppLocale locale;
  final VoidCallback onTap;
  final bool selected;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final texts = serviceTexts(locale, service.id);

    return Material(
      color: const Color(0xFF1E1E28),
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: selected
                  ? AppColors.gold
                  : Colors.white.withValues(alpha: 0.08),
              width: selected ? 2 : 1,
            ),
          ),
          padding: EdgeInsets.fromLTRB(10, compact ? 8 : 14, 10, compact ? 8 : 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: compact ? 44 : 64,
                height: compact ? 44 : 64,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: service.gradient,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: service.gradient.first.withValues(alpha: 0.35),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: ClipOval(
                  child: CachedNetworkImage(
                    imageUrl: service.imageUrl,
                    fit: BoxFit.cover,
                    placeholder: (_, __) => Icon(
                      service.icon,
                      color: Colors.white70,
                      size: compact ? 22 : 26,
                    ),
                    errorWidget: (_, __, ___) => Icon(
                      service.icon,
                      color: Colors.white70,
                      size: compact ? 22 : 26,
                    ),
                  ),
                ),
              ),
              SizedBox(height: compact ? 6 : 10),
              Text(
                texts.title,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: compact ? 11 : 13,
                  fontWeight: FontWeight.w700,
                  height: 1.15,
                ),
              ),
              if (!compact) ...[
                const SizedBox(height: 4),
                Text(
                  texts.subtitle,
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.55),
                    fontSize: 11,
                    height: 1.1,
                  ),
                ),
              ],
              if (!compact) ...[
                const Spacer(),
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.gold.withValues(alpha: 0.15),
                    border: Border.all(color: AppColors.gold.withValues(alpha: 0.4)),
                  ),
                  child: const Icon(
                    FeatherIcons.chevronLeft,
                    size: 16,
                    color: AppColors.gold,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
