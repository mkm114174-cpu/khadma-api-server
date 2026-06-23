import 'package:flutter/material.dart';
import 'package:flutter_feather_icons/flutter_feather_icons.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';

import '../../constants/home_services.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/language_provider.dart';
import '../../providers/notification_providers.dart';
import '../../providers/tab_provider.dart';
import '../../router/app_router.dart';
import '../../widgets/featured_service_banner.dart';
import '../../widgets/logo_icon.dart';
import '../../widgets/service_category_grid.dart';

/// Home tab — clean layout with featured maintenance service.
class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  String _locationName = '';
  bool _locating = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final t = ref.read(appStringsProvider);
      setState(() => _locationName = t.home.currentLocation);
      _acquireLocation();
    });
  }

  Future<void> _acquireLocation({bool manual = false}) async {
    if (_locating) return;
    final t = ref.read(appStringsProvider);
    setState(() => _locating = true);

    try {
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        if (manual && mounted) {
          _showLocationDenied(t.home.locationDenied, t.home.openSettings);
        }
        return;
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.medium,
        ),
      );

      final placemarks = await placemarkFromCoordinates(
        position.latitude,
        position.longitude,
      );

      if (placemarks.isNotEmpty) {
        final p = placemarks.first;
        final parts = [p.subLocality, p.locality]
            .where((e) => e != null && e.isNotEmpty)
            .cast<String>()
            .toList();
        if (parts.isNotEmpty && mounted) {
          setState(() => _locationName = parts.join('، '));
        } else if (manual && mounted) {
          _showSnack(t.home.locationError);
        }
      } else if (manual && mounted) {
        _showSnack(t.home.locationError);
      }
    } catch (_) {
      if (manual && mounted) _showSnack(t.home.locationError);
    } finally {
      if (mounted) setState(() => _locating = false);
    }
  }

  void _showSnack(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  void _showLocationDenied(String msg, String settingsLabel) {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(ref.read(appStringsProvider).home.currentLocation),
        content: Text(msg),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(ref.read(appStringsProvider).req.cancel),
          ),
          TextButton(
            onPressed: () {
              Geolocator.openAppSettings();
              Navigator.pop(ctx);
            },
            child: Text(settingsLabel),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(appStringsProvider);
    final locale = ref.watch(languageProvider);
    final notifications = ref.watch(notificationsProvider);
    final unreadCount = notifications.maybeWhen(
      data: (list) => list.where((n) => !n.isRead).length,
      orElse: () => 0,
    );
    final maintenance = homeServiceById('maintenance')!;

    return Scaffold(
      backgroundColor: AppColors.darkBg,
      body: CustomScrollView(
        physics: const ClampingScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(
            child: _HeroSection(
              t: t,
              locationName: _locationName,
              locating: _locating,
              unreadCount: unreadCount,
              onUpdateLocation: () => _acquireLocation(manual: true),
              onNotifications: () => context.push(AppRoutes.notifications),
              onProfile: () => goToMainTab(ref, 4),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 100),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                FeaturedServiceBanner(
                  service: maintenance,
                  locale: locale,
                  bookLabel: t.home.bookNow,
                ),
                const SizedBox(height: 22),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      t.home.categories,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 17,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    GestureDetector(
                      onTap: () => goToMainTab(ref, 1),
                      child: Text(
                        t.home.viewAll,
                        style: const TextStyle(color: AppColors.gold, fontSize: 14),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                ServiceCategoryGrid(
                  locale: locale,
                  excludeId: 'maintenance',
                  compact: true,
                  columns: 3,
                ),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}

class _HeroSection extends StatelessWidget {
  const _HeroSection({
    required this.t,
    required this.locationName,
    required this.locating,
    required this.unreadCount,
    required this.onUpdateLocation,
    required this.onNotifications,
    required this.onProfile,
  });

  final dynamic t;
  final String locationName;
  final bool locating;
  final int unreadCount;
  final VoidCallback onUpdateLocation;
  final VoidCallback onNotifications;
  final VoidCallback onProfile;

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.paddingOf(context).top;

    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Color(0xFF1F1A14),
            Color(0xFF141210),
            AppColors.darkBg,
          ],
          stops: [0.0, 0.65, 1.0],
        ),
      ),
      child: Padding(
        padding: EdgeInsets.fromLTRB(20, top + 12, 20, 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _IconCircle(icon: FeatherIcons.user, onTap: onProfile),
                Row(
                  children: [
                    Text(
                      t.home.appName,
                      style: const TextStyle(
                        color: AppColors.gold,
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(width: 8),
                    const LogoIcon(size: 36),
                  ],
                ),
                _IconCircle(
                  icon: FeatherIcons.bell,
                  onTap: onNotifications,
                  badge: unreadCount > 0,
                ),
              ],
            ),
            const SizedBox(height: 16),
            Align(
              alignment: AlignmentDirectional.centerEnd,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    t.home.goodEvening,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 26,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    t.home.weAreHere,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.7),
                      fontSize: 15,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            GestureDetector(
              onTap: locating ? null : onUpdateLocation,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E1E1E),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
                ),
                child: Row(
                  children: [
                    if (locating)
                      const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: AppColors.gold,
                        ),
                      )
                    else
                      const Icon(FeatherIcons.mapPin, size: 18, color: AppColors.gold),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            t.home.currentLocation,
                            style: const TextStyle(color: Color(0xFF888888), fontSize: 11),
                          ),
                          Text(
                            locationName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (!locating) ...[
                      const SizedBox(width: 8),
                      Text(
                        t.home.update,
                        style: const TextStyle(
                          color: AppColors.gold,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _IconCircle extends StatelessWidget {
  const _IconCircle({
    required this.icon,
    required this.onTap,
    this.badge = false,
  });

  final IconData icon;
  final VoidCallback onTap;
  final bool badge;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white.withValues(alpha: 0.1),
            ),
            child: Icon(icon, color: Colors.white, size: 20),
          ),
          if (badge)
            Positioned(
              top: 8,
              right: 8,
              child: Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.red,
                  border: Border.all(color: Colors.white),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
