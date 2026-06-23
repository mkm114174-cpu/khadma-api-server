import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../constants/home_services.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/language_provider.dart';
import '../../widgets/service_category_grid.dart';

/// Services tab — same 12 canonical services as home.
class ServicesScreen extends ConsumerStatefulWidget {
  const ServicesScreen({super.key});

  @override
  ConsumerState<ServicesScreen> createState() => _ServicesScreenState();
}

class _ServicesScreenState extends ConsumerState<ServicesScreen> {
  String _search = '';

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(appStringsProvider);
    final locale = ref.watch(languageProvider);

    return Scaffold(
      backgroundColor: AppColors.darkBg,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      height: 46,
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: Colors.white12),
                      ),
                      child: TextField(
                        onChanged: (v) => setState(() => _search = v),
                        style: const TextStyle(color: Colors.white),
                        decoration: InputDecoration(
                          hintText: t.home.searchService,
                          hintStyle: const TextStyle(color: Colors.white38),
                          border: InputBorder.none,
                          icon: const Icon(Icons.search, color: Colors.white38, size: 20),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 4),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    t.home.categories,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    '${kHomeServices.length}',
                    style: const TextStyle(color: AppColors.gold, fontSize: 14),
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                children: [
                  ServiceCategoryGrid(
                    locale: locale,
                    searchQuery: _search,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
