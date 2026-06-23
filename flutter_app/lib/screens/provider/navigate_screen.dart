import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_feather_icons/flutter_feather_icons.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/routing.dart';
import '../../providers/language_provider.dart';
import '../../providers/request_providers.dart';
import '../../widgets/location_map_preview.dart';

/// Provider navigation to customer — full map + Google Maps / Waze.
class NavigateScreen extends ConsumerStatefulWidget {
  const NavigateScreen({super.key, required this.requestId});

  final int requestId;

  @override
  ConsumerState<NavigateScreen> createState() => _NavigateScreenState();
}

class _NavigateScreenState extends ConsumerState<NavigateScreen> {
  double? _liveLat;
  double? _liveLng;
  StreamSubscription<Position>? _positionSub;

  @override
  void initState() {
    super.initState();
    _trackLocation();
  }

  Future<void> _trackLocation() async {
    var perm = await Geolocator.checkPermission();
    if (perm == LocationPermission.denied) {
      perm = await Geolocator.requestPermission();
    }
    if (perm == LocationPermission.denied ||
        perm == LocationPermission.deniedForever) {
      return;
    }

    _positionSub = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.best,
        distanceFilter: 15,
      ),
    ).listen((pos) {
      if (mounted) {
        setState(() {
          _liveLat = pos.latitude;
          _liveLng = pos.longitude;
        });
      }
    });
  }

  @override
  void dispose() {
    _positionSub?.cancel();
    super.dispose();
  }

  Future<void> _openExternal(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(appStringsProvider);
    final requestAsync = ref.watch(requestDetailProvider(widget.requestId));

    return Scaffold(
      backgroundColor: AppColors.darkBg,
      body: requestAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.gold)),
        error: (_, __) => Center(child: Text(t.req.error)),
        data: (request) {
          if (request.lat == null || request.lng == null) {
            return Center(child: Text(t.provider.locationRequired));
          }

          final destLat = request.lat!;
          final destLng = request.lng!;
          double? dist;
          if (_liveLat != null && _liveLng != null) {
            dist = haversineKm(
              LatLng(latitude: _liveLat!, longitude: _liveLng!),
              LatLng(latitude: destLat, longitude: destLng),
            );
          }

          return Column(
            children: [
              SafeArea(
                bottom: false,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  child: Row(
                    children: [
                      IconButton(
                        onPressed: () => context.pop(),
                        icon: const Icon(FeatherIcons.arrowRight, color: Colors.white),
                      ),
                      Expanded(
                        child: Text(
                          t.provider.navigate,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 17,
                          ),
                        ),
                      ),
                      const SizedBox(width: 48),
                    ],
                  ),
                ),
              ),
              if (request.address != null)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  child: Text(
                    request.address!,
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.white.withValues(alpha: 0.8)),
                  ),
                ),
              if (dist != null)
                Text(
                  '${t.provider.distanceToCustomer}: ${formatDistance(dist)}',
                  style: const TextStyle(color: AppColors.gold, fontWeight: FontWeight.w600),
                ),
              const SizedBox(height: 8),
              Expanded(
                child: NavigationMap(
                  destinationLat: destLat,
                  destinationLng: destLng,
                  liveLat: _liveLat,
                  liveLng: _liveLng,
                ),
              ),
              SafeArea(
                top: false,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Expanded(
                        child: FilledButton.icon(
                          onPressed: () => _openExternal(
                            'https://www.google.com/maps/dir/?api=1&destination=$destLat,$destLng',
                          ),
                          icon: const Icon(FeatherIcons.map),
                          label: Text(t.provider.openGoogleMaps),
                          style: FilledButton.styleFrom(
                            backgroundColor: AppColors.gold,
                            foregroundColor: Colors.black,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _openExternal(
                            'https://waze.com/ul?ll=$destLat,$destLng&navigate=yes',
                          ),
                          icon: const Icon(FeatherIcons.navigation),
                          label: Text(t.provider.openWaze),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.gold,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
