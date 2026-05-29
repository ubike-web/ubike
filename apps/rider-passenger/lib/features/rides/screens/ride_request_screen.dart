import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme.dart';
import '../../../core/api_client.dart';

// This screen is shown as a full-screen modal when a new ride request comes in
class RideRequestModal extends StatefulWidget {
  const RideRequestModal({super.key, required this.rideData});
  final Map<String, dynamic> rideData;
  @override
  State<RideRequestModal> createState() => _RideRequestModalState();
}

class _RideRequestModalState extends State<RideRequestModal> {
  int _countdown = 30;
  Timer? _timer;
  bool _responding = false;
  double _customFare = 0;
  bool _showFareAdjust = false;

  @override
  void initState() {
    super.initState();
    _customFare = (widget.rideData['fareEstimate'] as num? ?? 0).toDouble();
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_countdown <= 0) { t.cancel(); if (mounted) Navigator.pop(context); return; }
      setState(() => _countdown--);
    });
  }

  @override
  void dispose() { _timer?.cancel(); super.dispose(); }

  Future<void> _accept() async {
    setState(() => _responding = true);
    try {
      await api.post('/rides/${widget.rideData['rideId']}/accept');
      if (mounted) {
        Navigator.pop(context, 'accepted');
        context.push('/rides/active', extra: {'rideId': widget.rideData['rideId']});
      }
    } catch (e) {
      setState(() => _responding = false);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e'), backgroundColor: kError));
    }
  }

  Future<void> _proposeFare() async {
    final maxFare = (_customFare * 1.3).roundToDouble();
    if (_customFare > maxFare) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cannot exceed 30% above estimate'), backgroundColor: kWarning));
      return;
    }
    try {
      await api.post('/rides/${widget.rideData['rideId']}/fare/propose', data: {'proposed_fare': _customFare});
      setState(() => _showFareAdjust = false);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Fare proposal sent to customer'), backgroundColor: kBlue));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e'), backgroundColor: kError));
    }
  }

  @override
  Widget build(BuildContext context) {
    final fare = (widget.rideData['fareEstimate'] as num? ?? 0).toDouble();
    final distance = widget.rideData['distanceKm'] ?? '—';
    final pickup = widget.rideData['pickupAddress'] ?? '';
    final dropoff = widget.rideData['dropoffAddress'] ?? '';
    final maxAllowed = fare * 1.3;

    return PopScope(
      canPop: false,
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(color: kCharcoalLight, borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          // Timer
          Stack(alignment: Alignment.center, children: [
            SizedBox(width: 64, height: 64, child: CircularProgressIndicator(value: _countdown / 30, strokeWidth: 4, color: kGold, backgroundColor: kBorder)),
            Text('$_countdown', style: const TextStyle(color: kGold, fontSize: 22, fontWeight: FontWeight.w800)),
          ]).animate(onPlay: (c) => c.repeat()).shimmer(duration: 1200.ms, color: kGoldLight),

          const SizedBox(height: 16),
          const Text('New Ride Request!', style: TextStyle(color: kCream, fontSize: 20, fontWeight: FontWeight.w800)),
          const SizedBox(height: 20),

          // Fare
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: kGold.withOpacity(0.1), borderRadius: BorderRadius.circular(14), border: Border.all(color: kGold.withOpacity(0.4))),
            child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Fare Estimate', style: TextStyle(color: kSubtext, fontSize: 12)),
                Text('KES ${fare.toStringAsFixed(0)}', style: const TextStyle(color: kGold, fontSize: 28, fontWeight: FontWeight.w800)),
              ]),
              Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                const Text('Distance', style: TextStyle(color: kSubtext, fontSize: 12)),
                Text('$distance km', style: const TextStyle(color: kCream, fontSize: 16, fontWeight: FontWeight.w600)),
              ]),
            ]),
          ),

          const SizedBox(height: 16),

          // Route
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: kCharcoal, borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorder.withOpacity(0.4))),
            child: Column(children: [
              Row(children: [const Icon(Icons.trip_origin, color: kGold, size: 14), const SizedBox(width: 8), Expanded(child: Text(pickup, style: const TextStyle(color: kCream, fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis))]),
              const Padding(padding: EdgeInsets.only(left: 7), child: SizedBox(height: 16, child: VerticalDivider(color: kBorder))),
              Row(children: [const Icon(Icons.location_on, color: kSienna, size: 16), const SizedBox(width: 7), Expanded(child: Text(dropoff, style: const TextStyle(color: kCream, fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis))]),
            ]),
          ),

          // Fare adjustment
          if (_showFareAdjust) ...[
            const SizedBox(height: 16),
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Propose fare (max KES ${maxAllowed.toStringAsFixed(0)})', style: const TextStyle(color: kSubtext, fontSize: 12)),
              const SizedBox(height: 8),
              Slider(
                value: _customFare,
                min: fare,
                max: maxAllowed,
                divisions: 10,
                activeColor: kGold,
                inactiveColor: kBorder,
                onChanged: (v) => setState(() => _customFare = v),
              ),
              Center(child: Text('KES ${_customFare.toStringAsFixed(0)}', style: const TextStyle(color: kGold, fontSize: 20, fontWeight: FontWeight.w700))),
            ]),
          ],

          const SizedBox(height: 20),

          Row(children: [
            Expanded(child: ElevatedButton(
              onPressed: _responding ? null : _accept,
              style: ElevatedButton.styleFrom(backgroundColor: kSuccess, foregroundColor: Colors.white),
              child: _responding ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Accept'),
            )),
            const SizedBox(width: 10),
            Expanded(child: ElevatedButton(
              onPressed: () => Navigator.pop(context, 'rejected'),
              style: ElevatedButton.styleFrom(backgroundColor: kError, foregroundColor: Colors.white),
              child: const Text('Reject'),
            )),
          ]),

          const SizedBox(height: 8),

          TextButton.icon(
            onPressed: () => setState(() => _showFareAdjust = !_showFareAdjust),
            icon: const Icon(Icons.price_change_outlined, size: 18),
            label: const Text('Adjust Fare (+max 30%)'),
          ),

          if (_showFareAdjust) ElevatedButton(onPressed: _proposeFare, child: const Text('Send Fare Proposal')),
        ]),
      ),
    );
  }
}
