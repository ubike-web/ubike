import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_map_location_marker/flutter_map_location_marker.dart';
import 'package:latlong2/latlong.dart';
import '../../core/theme.dart';
import '../../core/constants.dart';

class UbikeMap extends StatelessWidget {
  const UbikeMap({
    super.key,
    required this.center,
    this.zoom = 14.5,
    this.markers = const [],
    this.polylines = const [],
    this.showCurrentLocation = true,
    this.controller,
    this.onTap,
    this.children = const [],
  });

  final LatLng center;
  final double zoom;
  final List<Marker> markers;
  final List<Polyline> polylines;
  final bool showCurrentLocation;
  final MapController? controller;
  final void Function(TapPosition, LatLng)? onTap;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return FlutterMap(
      mapController: controller,
      options: MapOptions(
        initialCenter: center,
        initialZoom: zoom,
        onTap: onTap,
        interactionOptions: const InteractionOptions(flags: InteractiveFlag.all),
      ),
      children: [
        TileLayer(
          urlTemplate: kMapTileUrl,
          userAgentPackageName: 'com.ubike.customer',
          tileProvider: CancellableNetworkTileProvider(),
        ),
        if (showCurrentLocation) CurrentLocationLayer(
          alignPositionOnUpdate: AlignOnUpdate.never,
          style: LocationMarkerStyle(
            marker: DefaultLocationMarker(color: kGold),
            accuracyCircleColor: kGold.withOpacity(0.1),
            headingSectorColor: kGold.withOpacity(0.6),
          ),
        ),
        if (polylines.isNotEmpty) PolylineLayer(polylines: polylines),
        if (markers.isNotEmpty) MarkerLayer(markers: markers),
        ...children,
        RichAttributionWidget(attributions: [
          TextSourceAttribution(kMapAttribution),
        ]),
      ],
    );
  }
}

// Standard map marker
Widget buildMarker({required LatLng point, Color color = kGold, IconData icon = Icons.location_on, double size = 36}) => Marker(
  point: point,
  width: size,
  height: size,
  child: Icon(icon, color: color, size: size),
) as Widget;

Marker pickupMarker(LatLng point) => Marker(
  point: point,
  width: 40,
  height: 40,
  child: const Icon(Icons.trip_origin, color: kGold, size: 28),
);

Marker dropoffMarker(LatLng point) => Marker(
  point: point,
  width: 40,
  height: 40,
  child: const Icon(Icons.location_on, color: kSienna, size: 36),
);

Marker riderMarker(LatLng point) => Marker(
  point: point,
  width: 48,
  height: 48,
  child: Container(
    decoration: BoxDecoration(color: kGold, shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 2)),
    child: const Icon(Icons.electric_moped, color: kCharcoal, size: 24),
  ),
);
