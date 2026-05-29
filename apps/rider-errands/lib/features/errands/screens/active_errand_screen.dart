import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:latlong2/latlong.dart';
import '../../../core/theme.dart';
import '../../../core/api_client.dart';

class ActiveErrandScreen extends StatefulWidget {
  const ActiveErrandScreen({super.key, required this.errandId});
  final String errandId;
  @override
  State<ActiveErrandScreen> createState() => _ActiveErrandScreenState();
}

class _ActiveErrandScreenState extends State<ActiveErrandScreen> {
  Map<String, dynamic>? _errand;
  bool _loading = true;
  Timer? _poll;
  final _picker = ImagePicker();

  @override
  void initState() { super.initState(); _load(); _poll = Timer.periodic(const Duration(seconds: 6), (_) => _load()); }
  @override
  void dispose() { _poll?.cancel(); super.dispose(); }

  Future<void> _load() async {
    try { final d = await api.get('/errands/${widget.errandId}') as Map<String, dynamic>; setState(() { _errand = d; _loading = false; }); if (d['status'] == 'delivered') { _poll?.cancel(); if (mounted) context.go('/dashboard'); } } catch (_) {}
  }

  Future<void> _action(String endpoint, {String? proofUrl}) async {
    try { await api.post('/errands/${widget.errandId}/$endpoint', data: proofUrl != null ? {'proof_url': proofUrl} : null); _load(); }
    catch (e) { ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e'), backgroundColor: kError)); }
  }

  Future<void> _takeProofPhoto() async {
    final img = await _picker.pickImage(source: ImageSource.camera, imageQuality: 70);
    if (img == null) return;
    // In production: upload to Supabase storage
    await _action('complete', proofUrl: 'proof_photo_uploaded');
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator(color: kSienna)));
    final status = _errand?['status'] as String? ?? 'accepted';
    final pickup = LatLng(_errand?['pickup_lat'] as double? ?? -1.2921, _errand?['pickup_lng'] as double? ?? 36.8219);
    final dropoff = LatLng(_errand?['dropoff_lat'] as double? ?? -1.3031, _errand?['dropoff_lng'] as double? ?? 36.8082);
    final center = LatLng((pickup.latitude + dropoff.latitude) / 2, (pickup.longitude + dropoff.longitude) / 2);

    final steps = {
      'accepted': 'Go to pickup location',
      'picked_up': 'Item collected — head to delivery address',
      'in_transit': 'Delivering — take proof photo on arrival',
    };

    return PopScope(
      canPop: false,
      child: Scaffold(
        body: Stack(children: [
          FlutterMap(
            options: MapOptions(initialCenter: center, initialZoom: 13),
            children: [
              TileLayer(urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', userAgentPackageName: 'com.ubike.errands'),
              MarkerLayer(markers: [
                Marker(point: pickup, width: 36, height: 36, child: const Icon(Icons.trip_origin, color: kGold, size: 28)),
                Marker(point: dropoff, width: 36, height: 36, child: const Icon(Icons.location_on, color: kSienna, size: 32)),
              ]),
              PolylineLayer(polylines: [Polyline(points: [pickup, dropoff], color: kSienna, strokeWidth: 4)]),
            ],
          ),

          SafeArea(child: Padding(padding: const EdgeInsets.all(16), child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(color: kSienna.withOpacity(0.9), borderRadius: BorderRadius.circular(20)),
            child: Text(status.replaceAll('_', ' ').toUpperCase(), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 13)),
          ))),

          DraggableScrollableSheet(
            initialChildSize: 0.45,
            minChildSize: 0.35,
            maxChildSize: 0.8,
            builder: (_, ctrl) => Container(
              decoration: const BoxDecoration(color: kCharcoalLight, borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
              child: ListView(controller: ctrl, padding: const EdgeInsets.all(20), children: [
                Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: kBorder, borderRadius: BorderRadius.circular(2)))),
                const SizedBox(height: 16),

                // Category + description
                Row(children: [
                  Container(width: 44, height: 44, decoration: BoxDecoration(color: kSienna.withOpacity(0.15), shape: BoxShape.circle), child: const Icon(Icons.local_shipping, color: kSienna, size: 24)),
                  const SizedBox(width: 12),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(_errand?['category']?.toString().replaceAll('_', ' ').toUpperCase() ?? 'ERRAND', style: const TextStyle(color: kSienna, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1)),
                    Text(_errand?['description'] as String? ?? '', style: const TextStyle(color: kCream, fontSize: 13), maxLines: 2, overflow: TextOverflow.ellipsis),
                  ])),
                ]),

                const SizedBox(height: 16),

                // Step instruction
                if (steps.containsKey(status)) Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: kGold.withOpacity(0.1), borderRadius: BorderRadius.circular(10), border: Border.all(color: kGold.withOpacity(0.4))),
                  child: Row(children: [
                    const Icon(Icons.info_outline, color: kGold, size: 18),
                    const SizedBox(width: 8),
                    Expanded(child: Text(steps[status]!, style: const TextStyle(color: kGold, fontSize: 12))),
                  ]),
                ),

                const SizedBox(height: 16),

                // Addresses
                Row(children: [const Icon(Icons.trip_origin, color: kGold, size: 14), const SizedBox(width: 8), Expanded(child: Text(_errand?['pickup_address'] as String? ?? '', style: const TextStyle(color: kCream, fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis))]),
                const Padding(padding: EdgeInsets.only(left: 7), child: SizedBox(height: 14, child: VerticalDivider(color: kBorder))),
                Row(children: [const Icon(Icons.location_on, color: kSienna, size: 16), const SizedBox(width: 7), Expanded(child: Text(_errand?['dropoff_address'] as String? ?? '', style: const TextStyle(color: kCream, fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis))]),

                // Recipient
                if (_errand?['recipient_name'] != null) ...[
                  const SizedBox(height: 12),
                  Row(children: [
                    const Icon(Icons.person_outline, color: kSubtext, size: 16),
                    const SizedBox(width: 8),
                    Text('${_errand!['recipient_name']} • ${_errand!['recipient_phone'] ?? ''}', style: const TextStyle(color: kSubtext, fontSize: 12)),
                  ]),
                ],

                const SizedBox(height: 20),

                // Action buttons
                if (status == 'accepted') ElevatedButton.icon(onPressed: () => _action('pickup'), icon: const Icon(Icons.shopping_bag_outlined), label: const Text('Mark Item Picked Up')),
                if (status == 'picked_up') ElevatedButton.icon(onPressed: () => _action('transit'), icon: const Icon(Icons.local_shipping), label: const Text('Start Delivery')),
                if (status == 'in_transit') ElevatedButton.icon(
                  onPressed: _takeProofPhoto,
                  icon: const Icon(Icons.camera_alt_outlined),
                  label: const Text('Take Proof & Complete'),
                  style: ElevatedButton.styleFrom(backgroundColor: kSuccess, foregroundColor: Colors.white),
                ),

                const SizedBox(height: 12),
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  const Text('Earning', style: TextStyle(color: kSubtext, fontSize: 13)),
                  Text('KES ${((_errand?['fare_estimate'] as num? ?? 0) * 0.8).toStringAsFixed(0)}', style: const TextStyle(color: kGold, fontWeight: FontWeight.w800, fontSize: 18)),
                ]),
              ]),
            ),
          ),
        ]),
      ),
    );
  }
}
