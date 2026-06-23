import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../constants/home_services.dart';
import '../l10n/app_locale.dart';
import '../router/app_router.dart';
import 'service_category_card.dart';

class ServiceCategoryGrid extends StatelessWidget {
  const ServiceCategoryGrid({
    super.key,
    required this.locale,
    this.searchQuery = '',
    this.excludeId,
    this.onCategoryTap,
    this.selectedIds = const {},
    this.selectable = false,
    this.compact = false,
    this.columns = 2,
  });

  final AppLocale locale;
  final String searchQuery;
  final String? excludeId;
  final void Function(String categoryId)? onCategoryTap;
  final Set<String> selectedIds;
  final bool selectable;
  final bool compact;
  final int columns;

  @override
  Widget build(BuildContext context) {
    final q = searchQuery.trim().toLowerCase();
    final items = kHomeServices.where((s) {
      if (excludeId != null && s.id == excludeId) return false;
      if (q.isEmpty) return true;
      final t = serviceTexts(locale, s.id);
      return t.title.toLowerCase().contains(q) ||
          t.subtitle.toLowerCase().contains(q);
    }).toList();

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: EdgeInsets.zero,
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: columns,
        mainAxisSpacing: compact ? 8 : 12,
        crossAxisSpacing: compact ? 8 : 12,
        childAspectRatio: compact ? (columns >= 3 ? 0.88 : 0.95) : 0.72,
      ),
      itemCount: items.length,
      itemBuilder: (context, i) {
        final s = items[i];
        return ServiceCategoryCard(
          service: s,
          locale: locale,
          compact: compact,
          selected: selectedIds.contains(s.id),
          onTap: () {
            if (onCategoryTap != null) {
              onCategoryTap!(s.id);
            } else {
              context.push('${AppRoutes.newRequest}?category=${s.id}');
            }
          },
        );
      },
    );
  }
}
