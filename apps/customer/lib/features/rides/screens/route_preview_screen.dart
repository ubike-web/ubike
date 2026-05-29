import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import '../../../core/theme.dart';
import '../../../core/api_client.dart';
import '../../../core/utils/format_utils.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/map_widget.dart';
import '../../../shared/widgets/app_card.dart';

class RoutePreviewScreen extends StatefulWidget {
  const RoutePreviewScreen({
    super.key,
    required this.pickupAddress,
    required this.pickupLat,
    required this.pickupLng,
    required this.dropoffAddress,
    required this.dropoffLat,
    required this.dropoffLng,
    this.vehicleType = 'standard',
    this.scheduledAt,
  });

  final String pickupAddress;
  final double pickupLat;
  final double pickupLng;
  final String dropoffAddress;
  final double dropoffLat;
  final double dropoffLng;
  final String vehicleType;
  final String? scheduledAt;

  @override
  State<RoutePreviewScreen> createState() => _RoutePreviewScreenState();
}

class _RoutePreviewScreenState extends State<RoutePreviewScreen> {
  Map<String, dynamic>? _estimate;
  bool _loading = true;
  String? _error;
  String _vehicleType = 'standard';

  @override
  void initState() {
    super.initState();
    _vehicleType = widget.vehicleType;
    _loadEstimate();
  }

  Future<void> _loadEstimate() async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await api.post('/rides/estimate', data: {
        'pickup_lat': widget.pickupLat,
        'pickup_lng': widget.pickupLng,
        'dropoff_lat': widget.dropoffLat,
        'dropoff_lng': widget.dropoffLng,
        'vehicle_type': _vehicleType,
      });
      setState(() { _estimate = data as Map<String, dynamic>; _loading = false; });
    } catch (e) {
      setState(() { _error = 'Could not get fare estimate'; _loading = false; });
    }
  }

  LatLng get _midpoint => LatLng(
    (widget.pickupLat + widget.dropoffLat) / 2,
    (widget.pickupLng + widget.dropoffLng) / 2,
  );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Map
          UbikeMap(
            center: _midpoint,
            zoom: 13,
            showCurrentLocation: false,
            markers: [
              pickupMarker(LatLng(widget.pickupLat, widget.pickupLng)),
              dropoffMarker(LatLng(widget.dropoffLat, widget.dropoffLng)),
            ],
            polylines: [
              Polyline(
                points: [
                  LatLng(widget.pickupLat, widget.pickupLng),
                  LatLng(widget.dropoffLat, widget.dropoffLng),
                ],
                color: kGold,
                strokeWidth: 4,
              ),
            ],
          ),

          // Top back button
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: CircleAvatar(
                backgroundColor: kCharcoal.withOpacity(0.9),
                child: IconButton(
                  icon: const Icon(Icons.arrow_back, color: kCream, size: 20),
                  onPressed: () => context.pop(),
                ),
              ),
            ),
          ),

          // Bottom sheet
          DraggableScrollableSheet(
            initialChildSize: 0.45,
            minChildSize: 0.35,
            maxChildSize: 0.75,
            builder: (_, ctrl) => Container(
              decoration: const BoxDecoration(
                color: kCharcoal,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                children: [
                  const SizedBox(height: 8),
                  Container(width: 40, height: 4, decoration: BoxDecoration(color: kBorder, borderRadius: BorderRadius.circular(2))),
                  Expanded(
                    child: ListView(controller: ctrl, padding: const EdgeInsets.all(20), children: [
                      // Route info
                      Row(children: [
                        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Container(width: 10, height: 10, decoration: const BoxDecoration(color: kGold, shape: BoxShape.circle)),
                          Container(width: 2, height: 30, margin: const EdgeInsets.symmetric(vertical: 2, horizontal: 4), color: kBorder),
                          const Icon(Icons.location_on, color: kSienna, size: 18),
                        ]),
                        const SizedBox(width: 12),
                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(widget.pickupAddress, style: const TextStyle(color: kCream, fontWeight: FontWeight.w600, fontSize: 14), maxLines: 1, overflow: TextOverflow.ellipsis),
                          const SizedBox(height: 14),
                          Text(widget.dropoffAddress, style: const TextStyle(color: kCream, fontWeight: FontWeight.w600, fontSize: 14), maxLines: 1, overflow: TextOverflow.ellipsis),
                        ])),
                      ]),

                      const SizedBox(height: 20),

                      // Vehicle type selector
                      Row(children: [
                        _VehicleOption(type: 'standard', label: 'Standard', icon: Icons.electric_moped, price: _estimate?['totalFare']?.toStringAsFixed(0) ?? '...', selected: _vehicleType == 'standard', onTap: () { setState(() => _vehicleType = 'standard'); _loadEstimate(); }),
                        const SizedBox(width: 10),
                        _VehicleOption(type: 'electric', label: 'Electric', icon: Icons.electric_bolt, price: _estimate != null ? ((_estimate!['totalFare'] as num) * 1.2).toStringAsFixed(0) : '...', selected: _vehicleType == 'electric', onTap: () { setState(() => _vehicleType = 'electric'); _loadEstimate(); }),
                      ]),

                      const SizedBox(height: 20),

                      // Estimate
                      if (_loading) const Center(child: CircularProgressIndicator(color: kGold, strokeWidth: 2))
                      else if (_error != null) Text(_error!, style: const TextStyle(color: kError))
                      else if (_estimate != null) AppCard(
                        color: kGold.withOpacity(0.1),
                        child: Column(children: [
                          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                            const Text('Fare Estimate', style: TextStyle(color: kSubtext, fontSize: 13)),
                            Text(formatKes((_estimate!['totalFare'] as num).toDouble()), style: const TextStyle(color: kGold, fontSize: 22, fontWeight: FontWeight.w800)),
                          ]),
                          const SizedBox(height: 12),
                          InfoRow(label: 'Distance', value: formatDistance((_estimate!['distanceKm'] as num).toDouble())),
                          const SizedBox(height: 6),
                          InfoRow(label: 'Duration', value: formatDuration((_estimate!['durationMinutes'] as num).toInt())),
                          const SizedBox(height: 6),
                          InfoRow(label: 'Payment', value: '50% now + 50% on arrival'),
                        ]),
                      ),

                      const SizedBox(height: 20),

                      AppButton(
                        label: 'Find Rider',
                        onPressed: _estimate == null ? null : () => context.push('/rides/matching', extra: {
                          'pickupAddress': widget.pickupAddress,
                          'pickupLat': widget.pickupLat,
                          'pickupLng': widget.pickupLng,
                          'dropoffAddress': widget.dropoffAddress,
                          'dropoffLat': widget.dropoffLat,
                          'dropoffLng': widget.dropoffLng,
                          'vehicleType': _vehicleType,
                          'fareEstimate': _estimate!['totalFare'],
                          'scheduledAt': widget.scheduledAt,
                        }),
                        icon: Icons.search,
                      ),
                    ]),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _VehicleOption extends StatelessWidget {
  const _VehicleOption({required this.type, required this.label, required this.icon, required this.price, required this.selected, required this.onTap});
  final String type;
  final String label;
  final IconData icon;
  final String price;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Expanded(
    child: GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: selected ? kGold.withOpacity(0.15) : kCharcoalLight,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: selected ? kGold : kBorder, width: selected ? 2 : 1),
        ),
        child: Column(children: [
          Icon(icon, color: selected ? kGold : kSubtext, size: 30),
          const SizedBox(height: 6),
          Text(label, style: TextStyle(color: selected ? kGold : kSubtext, fontWeight: FontWeight.w600, fontSize: 13)),
          const SizedBox(height: 2),
          Text('KES $price', style: const TextStyle(color: kCream, fontSize: 12)),
        ]),
      ),
    ),
  );
}
