import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../core/theme/app_colors.dart';

/// Small map preview with customer pin — used when submitting a request.
class LocationMapPreview extends StatelessWidget {
  const LocationMapPreview({
    super.key,
    required this.latitude,
    required this.longitude,
    this.height = 160,
  });

  final double latitude;
  final double longitude;
  final double height;

  @override
  Widget build(BuildContext context) {
    final target = LatLng(latitude, longitude);
    return ClipRRect(
      borderRadius: BorderRadius.circular(14),
      child: SizedBox(
        height: height,
        child: GoogleMap(
          initialCameraPosition: CameraPosition(target: target, zoom: 16),
          markers: {
            Marker(
              markerId: const MarkerId('customer'),
              position: target,
              icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueOrange),
            ),
          },
          zoomControlsEnabled: false,
          myLocationButtonEnabled: false,
          liteModeEnabled: true,
          mapToolbarEnabled: false,
        ),
      ),
    );
  }
}

/// Full navigation map for providers — customer destination + optional live position.
class NavigationMap extends StatefulWidget {
  const NavigationMap({
    super.key,
    required this.destinationLat,
    required this.destinationLng,
    this.liveLat,
    this.liveLng,
    this.onMapCreated,
  });

  final double destinationLat;
  final double destinationLng;
  final double? liveLat;
  final double? liveLng;
  final void Function(GoogleMapController)? onMapCreated;

  @override
  State<NavigationMap> createState() => _NavigationMapState();
}

class _NavigationMapState extends State<NavigationMap> {
  GoogleMapController? _map;

  LatLng get _dest => LatLng(widget.destinationLat, widget.destinationLng);

  Set<Marker> get _markers {
    final markers = <Marker>{
      Marker(
        markerId: const MarkerId('customer'),
        position: _dest,
        infoWindow: const InfoWindow(title: 'موقع العميل'),
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueOrange),
      ),
    };
    if (widget.liveLat != null && widget.liveLng != null) {
      markers.add(
        Marker(
          markerId: const MarkerId('provider'),
          position: LatLng(widget.liveLat!, widget.liveLng!),
          infoWindow: const InfoWindow(title: 'موقعك'),
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
        ),
      );
    }
    return markers;
  }

  Set<Polyline> get _polylines {
    if (widget.liveLat == null || widget.liveLng == null) return {};
    return {
      Polyline(
        polylineId: const PolylineId('route'),
        points: [
          LatLng(widget.liveLat!, widget.liveLng!),
          _dest,
        ],
        color: AppColors.gold,
        width: 4,
      ),
    };
  }

  @override
  Widget build(BuildContext context) {
    return GoogleMap(
      initialCameraPosition: CameraPosition(target: _dest, zoom: 14),
      markers: _markers,
      polylines: _polylines,
      myLocationEnabled: true,
      myLocationButtonEnabled: true,
      zoomControlsEnabled: true,
      onMapCreated: (c) {
        _map = c;
        widget.onMapCreated?.call(c);
        _fitBounds();
      },
    );
  }

  Future<void> _fitBounds() async {
    if (_map == null) return;
    final bounds = LatLngBounds(
      southwest: LatLng(
        widget.liveLat != null
            ? (widget.liveLat! < widget.destinationLat ? widget.liveLat! : widget.destinationLat) - 0.01
            : widget.destinationLat - 0.01,
        widget.liveLng != null
            ? (widget.liveLng! < widget.destinationLng ? widget.liveLng! : widget.destinationLng) - 0.01
            : widget.destinationLng - 0.01,
      ),
      northeast: LatLng(
        widget.liveLat != null
            ? (widget.liveLat! > widget.destinationLat ? widget.liveLat! : widget.destinationLat) + 0.01
            : widget.destinationLat + 0.01,
        widget.liveLng != null
            ? (widget.liveLng! > widget.destinationLng ? widget.liveLng! : widget.destinationLng) + 0.01
            : widget.destinationLng + 0.01,
      ),
    );
    await _map!.animateCamera(CameraUpdate.newLatLngBounds(bounds, 64));
  }

  @override
  void didUpdateWidget(covariant NavigationMap oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.liveLat != widget.liveLat || oldWidget.liveLng != widget.liveLng) {
      _fitBounds();
    }
  }
}
