import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme.dart';
import '../../../core/api_client.dart';

class RideTrackingScreen extends StatefulWidget {
  const RideTrackingScreen({super.key, required this.rideId});
  final String rideId;

  @override
  State<RideTrackingScreen> createState() => _RideTrackingScreenState();
}

class _RideTrackingScreenState extends State<RideTrackingScreen> {
  Map<String, dynamic>? _ride;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadRide();
  }

  Future<void> _loadRide() async {
    try {
      final res = await api.get('/rides/${widget.rideId}');
      setState(() { _ride = res.data['data']; _loading = false; });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _cancelRide() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: kSurface,
        title: const Text('Cancel Ride?', style: TextStyle(color: kOnSurface)),
        content: const Text('Are you sure you want to cancel this ride?', style: TextStyle(color: Color(0xFF8B8578))),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('No', style: TextStyle(color: kGold))),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Yes, cancel', style: TextStyle(color: kSienna))),
        ],
      ),
    );

    if (confirm == true) {
      await api.post('/rides/${widget.rideId}/cancel', data: {'reason': 'Cancelled by customer'});
      if (mounted) context.go('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator(color: kGold)));
    }

    final status = _ride?['status'] ?? 'requested';
    final statusSteps = ['requested', 'accepted', 'rider_arrived', 'in_progress', 'completed'];
    final stepIndex = statusSteps.indexOf(status);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Ride Tracking'),
        actions: [
          if (!['completed', 'cancelled'].contains(status))
            TextButton(
              onPressed: _cancelRide,
              child: const Text('Cancel', style: TextStyle(color: kSienna)),
            ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: kSurface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF4A4540)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.electric_moped, color: kGold, size: 32),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Status', style: TextStyle(color: Color(0xFF8B8578), fontSize: 12)),
                      Text(
                        status.replaceAll('_', ' ').toUpperCase(),
                        style: const TextStyle(color: kGold, fontWeight: FontWeight.w600, fontSize: 16),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Progress steps
            ...List.generate(statusSteps.length, (i) {
              final label = statusSteps[i].replaceAll('_', ' ');
              final isDone = i < stepIndex;
              final isCurrent = i == stepIndex;
              return Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Row(
                  children: [
                    Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: isDone ? kGold : isCurrent ? kGold.withOpacity(0.2) : kSurface,
                        shape: BoxShape.circle,
                        border: Border.all(color: isDone || isCurrent ? kGold : const Color(0xFF4A4540)),
                      ),
                      child: Icon(
                        isDone ? Icons.check : Icons.circle,
                        size: isDone ? 18 : 12,
                        color: isDone ? kCharcoal : isCurrent ? kGold : const Color(0xFF4A4540),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      label,
                      style: TextStyle(
                        color: isDone || isCurrent ? kOnSurface : const Color(0xFF4A4540),
                        fontWeight: isCurrent ? FontWeight.w600 : FontWeight.normal,
                      ),
                    ),
                  ],
                ),
              );
            }),

            const Spacer(),

            // Fare
            if (_ride?['fare_estimate'] != null)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: kGold.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: kGold.withOpacity(0.3)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Estimated Fare', style: TextStyle(color: Color(0xFF8B8578))),
                    Text(
                      'KES ${_ride!['fare_final'] ?? _ride!['fare_estimate']}',
                      style: const TextStyle(color: kGold, fontSize: 18, fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
              ),

            if (status == 'completed') ...[
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => context.go('/home'),
                child: const Text('Done'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
