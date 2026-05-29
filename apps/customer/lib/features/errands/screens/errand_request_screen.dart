import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme.dart';
import '../../../core/api_client.dart';

const _categories = [
  ('shopping', Icons.shopping_cart, 'Shopping'),
  ('food_delivery', Icons.fastfood, 'Food'),
  ('parcel_delivery', Icons.inventory_2, 'Parcel'),
  ('document_delivery', Icons.description, 'Document'),
  ('pharmacy', Icons.local_pharmacy, 'Pharmacy'),
  ('bill_payment', Icons.receipt, 'Bills'),
  ('laundry', Icons.local_laundry_service, 'Laundry'),
  ('other', Icons.more_horiz, 'Other'),
];

class ErrandRequestScreen extends StatefulWidget {
  const ErrandRequestScreen({super.key});

  @override
  State<ErrandRequestScreen> createState() => _ErrandRequestScreenState();
}

class _ErrandRequestScreenState extends State<ErrandRequestScreen> {
  final _pickupCtrl = TextEditingController();
  final _dropoffCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  String _category = 'other';
  bool _requesting = false;
  String? _error;

  @override
  void dispose() {
    _pickupCtrl.dispose();
    _dropoffCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  Future<void> _request() async {
    if (_descCtrl.text.isEmpty || _pickupCtrl.text.isEmpty || _dropoffCtrl.text.isEmpty) {
      setState(() => _error = 'Fill in all fields');
      return;
    }
    setState(() { _requesting = true; _error = null; });
    try {
      await api.post('/errands', data: {
        'category': _category,
        'description': _descCtrl.text,
        'pickup_address': _pickupCtrl.text,
        'pickup_lat': -1.2921,
        'pickup_lng': 36.8219,
        'dropoff_address': _dropoffCtrl.text,
        'dropoff_lat': -1.3031,
        'dropoff_lng': 36.8082,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Errand requested! Finding a rider...'), backgroundColor: kGold),
        );
        context.go('/home');
      }
    } catch (e) {
      setState(() => _error = 'Failed to request errand');
    } finally {
      if (mounted) setState(() => _requesting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Request an Errand')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Category', style: TextStyle(color: kOnSurface, fontWeight: FontWeight.w600)),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _categories.map((c) {
                final (value, icon, label) = c;
                final selected = _category == value;
                return GestureDetector(
                  onTap: () => setState(() => _category = value),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: selected ? kGold.withOpacity(0.15) : kSurface,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: selected ? kGold : const Color(0xFF4A4540)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(icon, color: selected ? kGold : const Color(0xFF6B6660), size: 16),
                        const SizedBox(width: 6),
                        Text(label, style: TextStyle(color: selected ? kGold : const Color(0xFF8B8578), fontSize: 13)),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),

            const SizedBox(height: 20),

            TextField(
              controller: _descCtrl,
              maxLines: 3,
              decoration: const InputDecoration(labelText: 'Description', hintText: 'Describe what you need done...'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _pickupCtrl,
              decoration: const InputDecoration(
                labelText: 'Pickup Location',
                prefixIcon: Icon(Icons.my_location, color: kGold),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _dropoffCtrl,
              decoration: const InputDecoration(
                labelText: 'Dropoff / Delivery Address',
                prefixIcon: Icon(Icons.location_on, color: kSienna),
              ),
            ),

            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: const TextStyle(color: Color(0xFFE8A898))),
            ],

            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _requesting ? null : _request,
              style: ElevatedButton.styleFrom(backgroundColor: kSienna, foregroundColor: Colors.white),
              child: _requesting
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Request Errand'),
            ),
          ],
        ),
      ),
    );
  }
}
