import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme.dart';
import '../../../core/api_client.dart';
import '../../../core/utils/format_utils.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_card.dart';

const _categories = [
  ('shopping', Icons.shopping_cart_outlined, 'Shopping', kGold),
  ('food_delivery', Icons.fastfood_outlined, 'Food', Color(0xFFFF7043)),
  ('parcel_delivery', Icons.inventory_2_outlined, 'Parcel', kBlue),
  ('document_delivery', Icons.description_outlined, 'Document', Color(0xFF9C27B0)),
  ('pharmacy', Icons.local_pharmacy_outlined, 'Pharmacy', kSuccess),
  ('bill_payment', Icons.receipt_long_outlined, 'Bills', Color(0xFF607D8B)),
  ('laundry', Icons.local_laundry_service_outlined, 'Laundry', Color(0xFF795548)),
  ('other', Icons.more_horiz, 'Other', kSubtext),
];

class ErrandRequestScreen extends StatefulWidget {
  const ErrandRequestScreen({super.key, this.category});
  final String? category;
  @override
  State<ErrandRequestScreen> createState() => _ErrandRequestScreenState();
}

class _ErrandRequestScreenState extends State<ErrandRequestScreen> {
  final _form = GlobalKey<FormState>();
  final _descCtrl = TextEditingController();
  final _pickupCtrl = TextEditingController();
  final _dropoffCtrl = TextEditingController();
  final _recipientCtrl = TextEditingController();
  final _recipientPhoneCtrl = TextEditingController();
  final _itemValueCtrl = TextEditingController();
  String? _category;
  bool _requesting = false;
  Map<String, dynamic>? _estimate;

  @override
  void initState() { super.initState(); _category = widget.category ?? 'other'; }
  @override
  void dispose() { _descCtrl.dispose(); _pickupCtrl.dispose(); _dropoffCtrl.dispose(); _recipientCtrl.dispose(); _recipientPhoneCtrl.dispose(); _itemValueCtrl.dispose(); super.dispose(); }

  Future<void> _submit() async {
    if (!_form.currentState!.validate() || _category == null) return;
    setState(() => _requesting = true);
    try {
      final data = await api.post('/errands', data: {
        'category': _category,
        'description': _descCtrl.text,
        'pickup_address': _pickupCtrl.text,
        'pickup_lat': -1.2921,
        'pickup_lng': 36.8219,
        'dropoff_address': _dropoffCtrl.text,
        'dropoff_lat': -1.3031,
        'dropoff_lng': 36.8082,
        if (_recipientCtrl.text.isNotEmpty) 'recipient_name': _recipientCtrl.text,
        if (_recipientPhoneCtrl.text.isNotEmpty) 'recipient_phone': _recipientPhoneCtrl.text,
        if (_itemValueCtrl.text.isNotEmpty) 'item_value': double.tryParse(_itemValueCtrl.text),
      }) as Map<String, dynamic>;

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Errand requested! Finding a rider...'), backgroundColor: kSuccess));
        context.go('/home');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e'), backgroundColor: kError));
    } finally {
      if (mounted) setState(() => _requesting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Request an Errand')),
      body: Form(
        key: _form,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const Text('Category', style: TextStyle(color: kCream, fontWeight: FontWeight.w600, fontSize: 15)),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _categories.map(((String value, IconData icon, String label, Color color) c) {
                final sel = _category == c.$1;
                return GestureDetector(
                  onTap: () => setState(() => _category = c.$1),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: sel ? c.$4.withOpacity(0.15) : kCharcoalLight,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: sel ? c.$4 : kBorder, width: sel ? 2 : 1),
                    ),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      Icon(c.$2, color: sel ? c.$4 : kSubtext, size: 18),
                      const SizedBox(width: 6),
                      Text(c.$3, style: TextStyle(color: sel ? c.$4 : kSubtext, fontSize: 13, fontWeight: FontWeight.w500)),
                    ]),
                  ),
                );
              }).toList(),
            ),

            const SizedBox(height: 24),
            const Text('Details', style: TextStyle(color: kCream, fontWeight: FontWeight.w600, fontSize: 15)),
            const SizedBox(height: 12),

            TextFormField(
              controller: _descCtrl,
              maxLines: 3,
              decoration: const InputDecoration(labelText: 'Description', hintText: 'Describe what you need done...'),
              validator: (v) => v == null || v.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 14),

            TextFormField(
              controller: _pickupCtrl,
              decoration: const InputDecoration(labelText: 'Pickup / Collection Address', prefixIcon: Icon(Icons.trip_origin, color: kGold)),
              validator: (v) => v == null || v.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 14),

            TextFormField(
              controller: _dropoffCtrl,
              decoration: const InputDecoration(labelText: 'Delivery Address', prefixIcon: Icon(Icons.location_on, color: kSienna)),
              validator: (v) => v == null || v.isEmpty ? 'Required' : null,
            ),

            const SizedBox(height: 24),
            const Text('Recipient (Optional)', style: TextStyle(color: kCream, fontWeight: FontWeight.w600, fontSize: 15)),
            const SizedBox(height: 12),

            TextFormField(controller: _recipientCtrl, decoration: const InputDecoration(labelText: 'Recipient Name', prefixIcon: Icon(Icons.person_outline, color: kGold))),
            const SizedBox(height: 14),
            TextFormField(controller: _recipientPhoneCtrl, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Recipient Phone', prefixIcon: Icon(Icons.phone_outlined, color: kGold))),
            const SizedBox(height: 14),
            TextFormField(controller: _itemValueCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Item Value (KES) for insurance', prefixIcon: Icon(Icons.inventory_2_outlined, color: kGold))),

            const SizedBox(height: 24),

            // Fare estimate hint
            AppCard(
              color: kSienna.withOpacity(0.1),
              child: Row(children: [
                const Icon(Icons.info_outline, color: kSienna, size: 20),
                const SizedBox(width: 12),
                const Expanded(child: Text('Fare is calculated based on distance. Starting from KES 150.', style: TextStyle(color: kSubtext, fontSize: 12))),
              ]),
            ),

            const SizedBox(height: 24),

            AppButton(
              label: 'Request Errand',
              onPressed: _submit,
              loading: _requesting,
              color: kSienna,
              textColor: Colors.white,
              icon: Icons.local_shipping,
            ),
          ],
        ),
      ),
    );
  }
}
