import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme.dart';
import '../../../core/api_client.dart';

class RideRequestScreen extends ConsumerStatefulWidget {
  const RideRequestScreen({super.key});

  @override
  ConsumerState<RideRequestScreen> createState() => _RideRequestScreenState();
}

class _RideRequestScreenState extends ConsumerState<RideRequestScreen> {
  final _pickupCtrl = TextEditingController();
  final _dropoffCtrl = TextEditingController();
  String _vehicleType = 'standard';
  Map<String, dynamic>? _estimate;
  bool _loadingEstimate = false;
  bool _requesting = false;
  String? _error;

  @override
  void dispose() {
    _pickupCtrl.dispose();
    _dropoffCtrl.dispose();
    super.dispose();
  }

  Future<void> _getEstimate() async {
    // For demo - in production use real geocoding
    setState(() { _loadingEstimate = true; _error = null; });
    try {
      final res = await api.post('/rides/estimate', data: {
        'pickup_lat': -1.2921,
        'pickup_lng': 36.8219,
        'dropoff_lat': -1.3031,
        'dropoff_lng': 36.8082,
        'vehicle_type': _vehicleType,
      });
      setState(() => _estimate = res.data['data']);
    } catch (e) {
      setState(() => _error = 'Could not get estimate');
    } finally {
      setState(() => _loadingEstimate = false);
    }
  }

  Future<void> _requestRide() async {
    if (_pickupCtrl.text.isEmpty || _dropoffCtrl.text.isEmpty) {
      setState(() => _error = 'Enter pickup and dropoff locations');
      return;
    }
    setState(() { _requesting = true; _error = null; });
    try {
      final res = await api.post('/rides', data: {
        'pickup_address': _pickupCtrl.text,
        'pickup_lat': -1.2921,
        'pickup_lng': 36.8219,
        'dropoff_address': _dropoffCtrl.text,
        'dropoff_lat': -1.3031,
        'dropoff_lng': 36.8082,
        'vehicle_type': _vehicleType,
      });
      final rideId = res.data['data']['id'];
      if (mounted) context.push('/ride/$rideId/tracking');
    } catch (e) {
      setState(() => _error = 'Failed to request ride. Try again.');
    } finally {
      if (mounted) setState(() => _requesting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Book a Ride')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Pickup
            TextField(
              controller: _pickupCtrl,
              decoration: const InputDecoration(
                labelText: 'Pickup Location',
                prefixIcon: Icon(Icons.my_location, color: kGold),
              ),
              onChanged: (_) { if (_dropoffCtrl.text.isNotEmpty) _getEstimate(); },
            ),
            const SizedBox(height: 12),

            // Dropoff
            TextField(
              controller: _dropoffCtrl,
              decoration: const InputDecoration(
                labelText: 'Dropoff Location',
                prefixIcon: Icon(Icons.location_on, color: kSienna),
              ),
              onChanged: (_) { if (_pickupCtrl.text.isNotEmpty) _getEstimate(); },
            ),

            const SizedBox(height: 20),

            // Vehicle type
            const Text('Vehicle Type', style: TextStyle(color: kOnSurface, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Row(
              children: [
                _VehicleOption(
                  label: 'Standard',
                  icon: Icons.electric_moped,
                  selected: _vehicleType == 'standard',
                  onTap: () { setState(() => _vehicleType = 'standard'); _getEstimate(); },
                ),
                const SizedBox(width: 12),
                _VehicleOption(
                  label: 'Electric',
                  icon: Icons.electric_bolt,
                  selected: _vehicleType == 'electric',
                  onTap: () { setState(() => _vehicleType = 'electric'); _getEstimate(); },
                ),
              ],
            ),

            const SizedBox(height: 20),

            // Estimate
            if (_loadingEstimate)
              const Center(child: CircularProgressIndicator(color: kGold))
            else if (_estimate != null)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: kGold.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: kGold.withOpacity(0.3)),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Estimated Fare', style: TextStyle(color: Color(0xFF8B8578))),
                        Text('KES ${_estimate!['totalFare']}', style: const TextStyle(color: kGold, fontSize: 20, fontWeight: FontWeight.w700)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('${_estimate!['distanceKm']} km', style: const TextStyle(color: Color(0xFF8B8578), fontSize: 13)),
                        Text('~${_estimate!['durationMinutes']} min', style: const TextStyle(color: Color(0xFF8B8578), fontSize: 13)),
                      ],
                    ),
                  ],
                ),
              ),

            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: const TextStyle(color: Color(0xFFE8A898))),
            ],

            const SizedBox(height: 24),

            ElevatedButton(
              onPressed: _requesting ? null : _requestRide,
              child: _requesting
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: kCharcoal))
                  : const Text('Request Ride'),
            ),
          ],
        ),
      ),
    );
  }
}

class _VehicleOption extends StatelessWidget {
  const _VehicleOption({required this.label, required this.icon, required this.selected, required this.onTap});
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: selected ? kGold.withOpacity(0.15) : kSurface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: selected ? kGold : const Color(0xFF4A4540), width: selected ? 2 : 1),
          ),
          child: Column(
            children: [
              Icon(icon, color: selected ? kGold : const Color(0xFF6B6660), size: 28),
              const SizedBox(height: 4),
              Text(label, style: TextStyle(color: selected ? kGold : const Color(0xFF8B8578), fontWeight: FontWeight.w500)),
            ],
          ),
        ),
      ),
    );
  }
}
