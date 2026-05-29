import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme.dart';
import '../../../core/api_client.dart';
import '../../../core/utils/format_utils.dart';
import '../../../shared/widgets/app_button.dart';

class RiderMatchingScreen extends StatefulWidget {
  const RiderMatchingScreen({
    super.key,
    required this.pickupAddress,
    required this.pickupLat,
    required this.pickupLng,
    required this.dropoffAddress,
    required this.dropoffLat,
    required this.dropoffLng,
    required this.vehicleType,
    required this.fareEstimate,
    this.scheduledAt,
  });

  final String pickupAddress, dropoffAddress;
  final double pickupLat, pickupLng, dropoffLat, dropoffLng, fareEstimate;
  final String vehicleType;
  final String? scheduledAt;

  @override
  State<RiderMatchingScreen> createState() => _RiderMatchingScreenState();
}

class _RiderMatchingScreenState extends State<RiderMatchingScreen> {
  String? _rideId;
  String _status = 'searching'; // searching | negotiating | accepted | timeout
  Map<String, dynamic>? _rider;
  double? _proposedFare;
  int _searchSeconds = 30;
  Timer? _timer;
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    _createRide();
  }

  @override
  void dispose() { _timer?.cancel(); _pollTimer?.cancel(); super.dispose(); }

  Future<void> _createRide() async {
    try {
      final data = await api.post('/rides', data: {
        'pickup_address': widget.pickupAddress,
        'pickup_lat': widget.pickupLat,
        'pickup_lng': widget.pickupLng,
        'dropoff_address': widget.dropoffAddress,
        'dropoff_lat': widget.dropoffLat,
        'dropoff_lng': widget.dropoffLng,
        'vehicle_type': widget.vehicleType,
        if (widget.scheduledAt != null) 'scheduled_at': widget.scheduledAt,
      }) as Map<String, dynamic>;

      setState(() => _rideId = data['id'] as String);
      _startCountdown();
      _startPolling();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to create ride: $e'), backgroundColor: kError));
        context.pop();
      }
    }
  }

  void _startCountdown() {
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_searchSeconds <= 0) { t.cancel(); setState(() => _status = 'timeout'); return; }
      setState(() => _searchSeconds--);
    });
  }

  void _startPolling() {
    _pollTimer = Timer.periodic(const Duration(seconds: 3), (_) async {
      if (_rideId == null) return;
      try {
        final data = await api.get('/rides/$_rideId') as Map<String, dynamic>;
        final status = data['status'] as String;
        if (status == 'accepted' || status == 'fare_negotiation') {
          setState(() {
            _status = status == 'fare_negotiation' ? 'negotiating' : 'accepted';
            _rider = data['rider_profile'] as Map<String, dynamic>?;
          });
          if (status == 'accepted') {
            _timer?.cancel();
            _pollTimer?.cancel();
            await Future.delayed(const Duration(seconds: 1));
            if (mounted) context.pushReplacement('/rides/tracking', extra: {'rideId': _rideId});
          }
        } else if (status == 'cancelled') {
          setState(() => _status = 'timeout');
          _timer?.cancel();
          _pollTimer?.cancel();
        }
      } catch (_) {}
    });
  }

  Future<void> _cancelRide() async {
    if (_rideId != null) {
      try { await api.post('/rides/$_rideId/cancel', data: {'reason': 'Cancelled by customer'}); } catch (_) {}
    }
    if (mounted) context.pop();
  }

  Future<void> _acceptFare() async {
    try {
      await api.post('/rides/$_rideId/fare/respond', data: {'accepted': true});
    } catch (_) {}
  }

  Future<void> _rejectFare() async {
    try {
      await api.post('/rides/$_rideId/fare/respond', data: {'accepted': false});
      setState(() => _status = 'searching');
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      child: Scaffold(
        backgroundColor: kCharcoal,
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                const SizedBox(height: 20),

                if (_status == 'searching') ...[
                  _SearchingView(seconds: _searchSeconds),
                ] else if (_status == 'negotiating') ...[
                  _NegotiatingView(
                    proposedFare: _proposedFare ?? widget.fareEstimate * 1.2,
                    originalFare: widget.fareEstimate,
                    onAccept: _acceptFare,
                    onReject: _rejectFare,
                  ),
                ] else if (_status == 'timeout') ...[
                  _TimeoutView(onRetry: () { setState(() { _searchSeconds = 30; _status = 'searching'; }); _createRide(); }),
                ],

                const Spacer(),

                // Route summary
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(color: kCharcoalLight, borderRadius: BorderRadius.circular(14), border: Border.all(color: kBorder.withOpacity(0.5))),
                  child: Column(children: [
                    Row(children: [
                      const Icon(Icons.trip_origin, color: kGold, size: 16),
                      const SizedBox(width: 8),
                      Expanded(child: Text(widget.pickupAddress, style: const TextStyle(color: kCream, fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis)),
                    ]),
                    const Padding(padding: EdgeInsets.symmetric(vertical: 6, horizontal: 8), child: SizedBox(height: 16, child: VerticalDivider(color: kBorder, width: 2))),
                    Row(children: [
                      const Icon(Icons.location_on, color: kSienna, size: 16),
                      const SizedBox(width: 8),
                      Expanded(child: Text(widget.dropoffAddress, style: const TextStyle(color: kCream, fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis)),
                    ]),
                    const SizedBox(height: 12),
                    Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                      Text('Estimated', style: const TextStyle(color: kSubtext, fontSize: 12)),
                      Text(formatKes(widget.fareEstimate), style: const TextStyle(color: kGold, fontWeight: FontWeight.w700, fontSize: 16)),
                    ]),
                  ]),
                ),

                const SizedBox(height: 16),

                if (_status == 'searching') AppButton(
                  label: 'Cancel Search',
                  onPressed: _cancelRide,
                  color: kCharcoalLight,
                  textColor: kSienna,
                  outlined: true,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SearchingView extends StatelessWidget {
  const _SearchingView({required this.seconds});
  final int seconds;

  @override
  Widget build(BuildContext context) => Column(children: [
    Stack(alignment: Alignment.center, children: [
      SizedBox(
        width: 120, height: 120,
        child: CircularProgressIndicator(value: seconds / 30, strokeWidth: 4, color: kGold, backgroundColor: kBorder),
      ),
      Text('$seconds', style: const TextStyle(color: kGold, fontSize: 36, fontWeight: FontWeight.w800)),
    ]).animate(onPlay: (c) => c.repeat()).shimmer(duration: 1500.ms, color: kGoldLight),

    const SizedBox(height: 24),
    const Text('Finding your rider...', style: TextStyle(color: kCream, fontSize: 20, fontWeight: FontWeight.w700)),
    const SizedBox(height: 8),
    const Text('Connecting to nearby verified riders', style: TextStyle(color: kSubtext, fontSize: 13)),
    const SizedBox(height: 24),

    // Pulse dots
    Row(mainAxisAlignment: MainAxisAlignment.center, children: List.generate(3, (i) =>
      Container(
        width: 8, height: 8,
        margin: const EdgeInsets.symmetric(horizontal: 4),
        decoration: const BoxDecoration(color: kGold, shape: BoxShape.circle),
      ).animate(delay: Duration(milliseconds: i * 200), onPlay: (c) => c.repeat())
       .fadeIn(duration: 400.ms).then().fadeOut(duration: 400.ms),
    )),
  ]);
}

class _NegotiatingView extends StatelessWidget {
  const _NegotiatingView({required this.proposedFare, required this.originalFare, required this.onAccept, required this.onReject});
  final double proposedFare;
  final double originalFare;
  final VoidCallback onAccept;
  final VoidCallback onReject;

  @override
  Widget build(BuildContext context) => Column(children: [
    const Icon(Icons.price_change_outlined, color: kWarning, size: 56),
    const SizedBox(height: 16),
    const Text('Fare Adjustment', style: TextStyle(color: kCream, fontSize: 22, fontWeight: FontWeight.w700)),
    const SizedBox(height: 8),
    const Text('Your rider has proposed a new fare', style: TextStyle(color: kSubtext)),
    const SizedBox(height: 24),
    Row(mainAxisAlignment: MainAxisAlignment.center, children: [
      Column(children: [
        Text(formatKes(originalFare), style: const TextStyle(color: kSubtext, fontSize: 16, decoration: TextDecoration.lineThrough)),
        const Text('Original', style: TextStyle(color: kSubtext, fontSize: 11)),
      ]),
      const Padding(padding: EdgeInsets.symmetric(horizontal: 16), child: Icon(Icons.arrow_forward, color: kSubtext)),
      Column(children: [
        Text(formatKes(proposedFare), style: const TextStyle(color: kGold, fontSize: 26, fontWeight: FontWeight.w800)),
        const Text('Proposed', style: TextStyle(color: kSubtext, fontSize: 11)),
      ]),
    ]),
    const SizedBox(height: 8),
    Text('+${((proposedFare - originalFare) / originalFare * 100).toStringAsFixed(0)}% above estimate', style: const TextStyle(color: kWarning, fontSize: 12)),
    const SizedBox(height: 28),
    Row(children: [
      Expanded(child: AppButton(label: 'Accept', onPressed: onAccept, color: kSuccess, textColor: Colors.white)),
      const SizedBox(width: 12),
      Expanded(child: AppButton(label: 'Decline', onPressed: onReject, color: kError, textColor: Colors.white)),
    ]),
  ]);
}

class _TimeoutView extends StatelessWidget {
  const _TimeoutView({required this.onRetry});
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) => Column(children: [
    const Icon(Icons.moped_outlined, color: kSubtext, size: 72),
    const SizedBox(height: 20),
    const Text('No riders nearby', style: TextStyle(color: kCream, fontSize: 22, fontWeight: FontWeight.w700)),
    const SizedBox(height: 8),
    const Text('All riders are busy. Please try again in a moment.', textAlign: TextAlign.center, style: TextStyle(color: kSubtext)),
    const SizedBox(height: 28),
    AppButton(label: 'Try Again', onPressed: onRetry, icon: Icons.refresh),
  ]);
}
