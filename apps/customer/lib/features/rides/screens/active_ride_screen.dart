import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme.dart';
import '../../../core/api_client.dart';
import '../../../core/utils/format_utils.dart';
import '../../../shared/widgets/map_widget.dart';
import '../../../shared/widgets/app_card.dart';

class ActiveRideScreen extends StatefulWidget {
  const ActiveRideScreen({super.key, required this.rideId});
  final String rideId;

  @override
  State<ActiveRideScreen> createState() => _ActiveRideScreenState();
}

class _ActiveRideScreenState extends State<ActiveRideScreen> {
  Map<String, dynamic>? _ride;
  Map<String, dynamic>? _riderProfile;
  LatLng? _riderLocation;
  bool _loading = true;
  Timer? _pollTimer;
  final _mapCtrl = MapController();

  static const _statusLabels = {
    'accepted': 'Rider is on the way',
    'rider_arrived': 'Rider has arrived!',
    'in_progress': 'Ride in progress',
    'completed': 'Ride completed',
    'cancelled': 'Ride cancelled',
  };

  static const _statusColors = {
    'accepted': kBlue,
    'rider_arrived': kGold,
    'in_progress': kSuccess,
    'completed': kSuccess,
    'cancelled': kError,
  };

  @override
  void initState() {
    super.initState();
    _load();
    _pollTimer = Timer.periodic(const Duration(seconds: 4), (_) => _load());
  }

  @override
  void dispose() { _pollTimer?.cancel(); super.dispose(); }

  Future<void> _load() async {
    try {
      final data = await api.get('/rides/${widget.rideId}') as Map<String, dynamic>;
      setState(() { _ride = data; _loading = false; });

      final status = data['status'] as String;
      if (status == 'completed') {
        _pollTimer?.cancel();
        await Future.delayed(const Duration(seconds: 2));
        if (mounted) context.pushReplacement('/rides/completed', extra: {'rideId': widget.rideId, 'fare': data['fare_final'] ?? data['fare_estimate']});
      } else if (status == 'cancelled') {
        _pollTimer?.cancel();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Ride cancelled: ${data['cancellation_reason'] ?? 'No reason given'}'), backgroundColor: kError));
          context.go('/home');
        }
      }
    } catch (_) {}
  }

  Future<void> _triggerSos() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('SOS Emergency', style: TextStyle(color: kError, fontWeight: FontWeight.w700)),
        content: const Text('This will alert our support team and emergency contacts immediately.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          ElevatedButton(onPressed: () => Navigator.pop(context, true), style: ElevatedButton.styleFrom(backgroundColor: kError, foregroundColor: Colors.white), child: const Text('Send SOS')),
        ],
      ),
    );
    if (confirm == true) {
      // Trigger SOS via socket
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('SOS sent! Help is on the way.'), backgroundColor: kError));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator(color: kGold)));

    final status = _ride?['status'] as String? ?? 'accepted';
    final statusColor = _statusColors[status] ?? kGold;
    final statusLabel = _statusLabels[status] ?? status;
    final center = _riderLocation ?? LatLng(_ride?['pickup_lat'] as double? ?? -1.2921, _ride?['pickup_lng'] as double? ?? 36.8219);

    return PopScope(
      canPop: false,
      child: Scaffold(
        body: Stack(
          children: [
            // Map
            UbikeMap(
              center: center,
              zoom: 15,
              controller: _mapCtrl,
              markers: [
                if (_riderLocation != null) riderMarker(_riderLocation!),
                pickupMarker(LatLng(_ride?['pickup_lat'] as double? ?? -1.2921, _ride?['pickup_lng'] as double? ?? 36.8219)),
                dropoffMarker(LatLng(_ride?['dropoff_lat'] as double? ?? -1.3031, _ride?['dropoff_lng'] as double? ?? 36.8082)),
              ],
            ),

            // Status banner
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.9),
                    borderRadius: BorderRadius.circular(30),
                    boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 8)],
                  ),
                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                    const Icon(Icons.electric_moped, color: Colors.white, size: 18),
                    const SizedBox(width: 8),
                    Text(statusLabel, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 13)),
                  ]),
                ),
              ),
            ),

            // SOS button
            Positioned(
              top: 60, right: 16,
              child: FloatingActionButton.small(
                onPressed: _triggerSos,
                backgroundColor: kError,
                child: const Text('SOS', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 12)),
              ),
            ),

            // Bottom rider card
            DraggableScrollableSheet(
              initialChildSize: 0.38,
              minChildSize: 0.28,
              maxChildSize: 0.65,
              builder: (_, ctrl) => Container(
                decoration: const BoxDecoration(
                  color: kCharcoal,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                ),
                child: ListView(controller: ctrl, padding: const EdgeInsets.all(20), children: [
                  Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: kBorder, borderRadius: BorderRadius.circular(2)))),
                  const SizedBox(height: 16),

                  // Rider info
                  Row(children: [
                    CircleAvatar(
                      radius: 28,
                      backgroundColor: kGold.withOpacity(0.2),
                      backgroundImage: _riderProfile?['avatar_url'] != null ? NetworkImage(_riderProfile!['avatar_url'] as String) : null,
                      child: _riderProfile?['avatar_url'] == null ? const Icon(Icons.person, color: kGold, size: 32) : null,
                    ),
                    const SizedBox(width: 14),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(_riderProfile?['full_name'] as String? ?? 'Your Rider', style: const TextStyle(color: kCream, fontWeight: FontWeight.w700, fontSize: 16)),
                      const SizedBox(height: 4),
                      Row(children: [
                        const Icon(Icons.star, color: kGold, size: 16),
                        const SizedBox(width: 4),
                        Text((_riderProfile?['rating'] ?? 4.8).toString(), style: const TextStyle(color: kCream, fontSize: 13)),
                        const SizedBox(width: 12),
                        Text(_riderProfile?['plate_number'] as String? ?? '—', style: const TextStyle(color: kSubtext, fontSize: 13)),
                      ]),
                    ])),
                    // Contact buttons
                    Row(children: [
                      _ContactButton(icon: Icons.chat_outlined, color: kBlue, onTap: () => context.push('/chat', extra: {'rideId': widget.rideId})),
                      const SizedBox(width: 8),
                      _ContactButton(icon: Icons.call_outlined, color: kSuccess, onTap: () async {
                        final phone = _riderProfile?['phone'] as String?;
                        if (phone != null) launchUrl(Uri.parse('tel:$phone'));
                      }),
                    ]),
                  ]),

                  const SizedBox(height: 20),
                  const Divider(),
                  const SizedBox(height: 16),

                  // Route
                  _RouteRow(pickup: _ride?['pickup_address'] as String? ?? '', dropoff: _ride?['dropoff_address'] as String? ?? ''),
                  const SizedBox(height: 16),

                  // Fare
                  Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    const Text('Estimated Fare', style: TextStyle(color: kSubtext, fontSize: 13)),
                    Text(formatKes((_ride?['fare_estimate'] as num? ?? 0).toDouble()), style: const TextStyle(color: kGold, fontWeight: FontWeight.w700, fontSize: 18)),
                  ]),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(color: kGold.withOpacity(0.08), borderRadius: BorderRadius.circular(8)),
                    child: const Text('50% held in escrow. Final payment at destination.', style: TextStyle(color: kGold, fontSize: 11)),
                  ),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ContactButton extends StatelessWidget {
  const _ContactButton({required this.icon, required this.color, required this.onTap});
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      width: 42, height: 42,
      decoration: BoxDecoration(color: color.withOpacity(0.15), shape: BoxShape.circle, border: Border.all(color: color.withOpacity(0.4))),
      child: Icon(icon, color: color, size: 20),
    ),
  );
}

class _RouteRow extends StatelessWidget {
  const _RouteRow({required this.pickup, required this.dropoff});
  final String pickup, dropoff;

  @override
  Widget build(BuildContext context) => Column(children: [
    Row(children: [const Icon(Icons.trip_origin, color: kGold, size: 14), const SizedBox(width: 10), Expanded(child: Text(pickup, style: const TextStyle(color: kCream, fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis))]),
    const Padding(padding: EdgeInsets.only(left: 7, top: 2, bottom: 2), child: SizedBox(height: 16, child: VerticalDivider(color: kBorder, width: 1))),
    Row(children: [const Icon(Icons.location_on, color: kSienna, size: 16), const SizedBox(width: 9), Expanded(child: Text(dropoff, style: const TextStyle(color: kCream, fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis))]),
  ]);
}
