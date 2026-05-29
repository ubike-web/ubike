import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme.dart';
import '../../../core/api_client.dart';

class ActiveRideScreen extends StatefulWidget {
  const ActiveRideScreen({super.key, required this.rideId});
  final String rideId;
  @override
  State<ActiveRideScreen> createState() => _ActiveRideScreenState();
}

class _ActiveRideScreenState extends State<ActiveRideScreen> {
  Map<String, dynamic>? _ride;
  bool _loading = true;
  final _mapCtrl = MapController();
  Timer? _poll;

  final _actions = [
    ('Arrived', 'rider_arrived', Icons.location_on),
    ('Start', 'in_progress', Icons.play_arrow),
    ('Complete', 'completed', Icons.check_circle),
  ];

  @override
  void initState() { super.initState(); _load(); _poll = Timer.periodic(const Duration(seconds: 6), (_) => _load()); }
  @override
  void dispose() { _poll?.cancel(); super.dispose(); }

  Future<void> _load() async {
    try {
      final d = await api.get('/rides/${widget.rideId}') as Map<String, dynamic>;
      setState(() { _ride = d; _loading = false; });
      if (d['status'] == 'completed') { _poll?.cancel(); await Future.delayed(const Duration(seconds: 2)); if (mounted) context.go('/dashboard'); }
    } catch (_) {}
  }

  Future<void> _updateStatus(String endpoint) async {
    try {
      await api.post('/rides/${widget.rideId}/$endpoint');
      _load();
    } catch (e) { ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e'), backgroundColor: kError)); }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator(color: kGold)));
    final status = _ride?['status'] as String? ?? 'accepted';
    final pickup = LatLng(_ride?['pickup_lat'] as double? ?? -1.2921, _ride?['pickup_lng'] as double? ?? 36.8219);
    final dropoff = LatLng(_ride?['dropoff_lat'] as double? ?? -1.3031, _ride?['dropoff_lng'] as double? ?? 36.8082);
    final center = LatLng((pickup.latitude + dropoff.latitude) / 2, (pickup.longitude + dropoff.longitude) / 2);

    return PopScope(
      canPop: false,
      child: Scaffold(
        body: Stack(children: [
          FlutterMap(
            mapController: _mapCtrl,
            options: MapOptions(initialCenter: center, initialZoom: 14),
            children: [
              TileLayer(urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', userAgentPackageName: 'com.ubike.rider'),
              MarkerLayer(markers: [
                Marker(point: pickup, width: 36, height: 36, child: const Icon(Icons.trip_origin, color: kGold, size: 28)),
                Marker(point: dropoff, width: 36, height: 36, child: const Icon(Icons.location_on, color: kSienna, size: 32)),
              ]),
              PolylineLayer(polylines: [Polyline(points: [pickup, dropoff], color: kGold, strokeWidth: 4)]),
            ],
          ),

          // Status chip
          SafeArea(child: Padding(padding: const EdgeInsets.all(16), child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(color: kGold.withOpacity(0.9), borderRadius: BorderRadius.circular(20)),
            child: Text(status.replaceAll('_', ' ').toUpperCase(), style: const TextStyle(color: kCharcoal, fontWeight: FontWeight.w800, fontSize: 13)),
          ))),

          // Bottom panel
          DraggableScrollableSheet(
            initialChildSize: 0.4,
            minChildSize: 0.3,
            maxChildSize: 0.7,
            builder: (_, ctrl) => Container(
              decoration: const BoxDecoration(color: kCharcoalLight, borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
              child: ListView(controller: ctrl, padding: const EdgeInsets.all(20), children: [
                Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: kBorder, borderRadius: BorderRadius.circular(2)))),
                const SizedBox(height: 16),

                // Customer info
                Row(children: [
                  CircleAvatar(radius: 24, backgroundColor: kGold.withOpacity(0.2), child: const Icon(Icons.person, color: kGold, size: 26)),
                  const SizedBox(width: 12),
                  const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('Customer', style: TextStyle(color: kCream, fontWeight: FontWeight.w700)),
                    Text('Tap to contact', style: TextStyle(color: kSubtext, fontSize: 12)),
                  ])),
                  // Contact
                  IconButton(icon: const Icon(Icons.chat_outlined, color: kBlue), onPressed: () {}),
                  IconButton(icon: const Icon(Icons.call_outlined, color: kSuccess), onPressed: () {}),
                ]),

                const SizedBox(height: 20),
                const Divider(),
                const SizedBox(height: 12),

                // Route
                Row(children: [const Icon(Icons.trip_origin, color: kGold, size: 14), const SizedBox(width: 8), Expanded(child: Text(_ride?['pickup_address'] as String? ?? '', style: const TextStyle(color: kCream, fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis))]),
                const Padding(padding: EdgeInsets.only(left: 7), child: SizedBox(height: 16, child: VerticalDivider(color: kBorder))),
                Row(children: [const Icon(Icons.location_on, color: kSienna, size: 16), const SizedBox(width: 7), Expanded(child: Text(_ride?['dropoff_address'] as String? ?? '', style: const TextStyle(color: kCream, fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis))]),

                const SizedBox(height: 20),

                // Action buttons
                ..._actions.where((a) {
                  if (status == 'accepted' && a.$2 == 'rider_arrived') return true;
                  if (status == 'rider_arrived' && a.$2 == 'in_progress') return true;
                  if (status == 'in_progress' && a.$2 == 'completed') return true;
                  return false;
                }).map((a) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: ElevatedButton.icon(
                    onPressed: () => _updateStatus(a.$2 == 'rider_arrived' ? 'arrived' : a.$2 == 'in_progress' ? 'start' : 'complete'),
                    icon: Icon(a.$3),
                    label: Text(a.$1),
                    style: ElevatedButton.styleFrom(backgroundColor: a.$2 == 'completed' ? kSuccess : kGold, foregroundColor: a.$2 == 'completed' ? Colors.white : kCharcoal),
                  ),
                )),

                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  const Text('Earning', style: TextStyle(color: kSubtext, fontSize: 13)),
                  Text('KES ${((_ride?['fare_estimate'] as num? ?? 0) * 0.8).toStringAsFixed(0)}', style: const TextStyle(color: kGold, fontWeight: FontWeight.w800, fontSize: 18)),
                ]),
              ]),
            ),
          ),
        ]),
      ),
    );
  }
}
