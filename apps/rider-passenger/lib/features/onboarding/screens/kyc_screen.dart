import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme.dart';
import '../../../core/api_client.dart';

class KycScreen extends StatefulWidget {
  const KycScreen({super.key});
  @override
  State<KycScreen> createState() => _KycScreenState();
}

class _KycScreenState extends State<KycScreen> {
  final _plateCtrl = TextEditingController();
  final _picker = ImagePicker();
  final _uploads = <String, XFile?>{
    'License': null,
    'National ID': null,
    'Vehicle Photo': null,
    'Insurance': null,
  };
  bool _submitting = false;
  bool _termsAccepted = false;

  @override
  void dispose() { _plateCtrl.dispose(); super.dispose(); }

  Future<void> _pick(String key) async {
    final file = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
    if (file != null) setState(() => _uploads[key] = file);
  }

  Future<void> _submit() async {
    if (!_termsAccepted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please accept the terms'), backgroundColor: kWarning));
      return;
    }
    if (_plateCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter plate number'), backgroundColor: kWarning));
      return;
    }
    // In production: upload images to Supabase storage and get URLs
    setState(() => _submitting = true);
    try {
      await api.post('/riders/kyc', data: {
        'plate_number': _plateCtrl.text,
        'license_url': 'pending_upload',
        'national_id_url': 'pending_upload',
        'vehicle_photo_url': 'pending_upload',
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('KYC submitted! Under review (24-48hrs)'), backgroundColor: kSuccess));
        context.go('/dashboard');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e'), backgroundColor: kError));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('KYC Verification')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Status banner
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: kBlue.withOpacity(0.1), borderRadius: BorderRadius.circular(12), border: Border.all(color: kBlue.withOpacity(0.4))),
            child: const Row(children: [
              Icon(Icons.info_outline, color: kBlue, size: 20),
              SizedBox(width: 10),
              Expanded(child: Text('Documents reviewed within 24-48 hours. You cannot go online until approved.', style: TextStyle(color: kBlue, fontSize: 12))),
            ]),
          ),

          const SizedBox(height: 24),

          TextField(
            controller: _plateCtrl,
            textCapitalization: TextCapitalization.characters,
            decoration: const InputDecoration(labelText: 'Motorcycle Plate Number', hintText: 'e.g. KMBL 123A', prefixIcon: Icon(Icons.directions_bike, color: kGold)),
          ),

          const SizedBox(height: 24),
          const Text('Upload Documents', style: TextStyle(color: kCream, fontWeight: FontWeight.w600, fontSize: 15)),
          const SizedBox(height: 12),

          ..._uploads.entries.map((e) => _UploadTile(
            label: e.key,
            file: e.value,
            required: e.key != 'Insurance',
            onTap: () => _pick(e.key),
          )),

          const SizedBox(height: 24),

          // Membership fee
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: kGold.withOpacity(0.1), borderRadius: BorderRadius.circular(14), border: Border.all(color: kGold.withOpacity(0.4))),
            child: Column(children: [
              const Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text('Membership Fee', style: TextStyle(color: kSubtext)),
                Text('KES 2,000', style: TextStyle(color: kGold, fontWeight: FontWeight.w800, fontSize: 20)),
              ]),
              const SizedBox(height: 8),
              const Text('One-time, non-refundable. Pay after document approval.', style: TextStyle(color: kSubtext, fontSize: 11)),
            ]),
          ),

          const SizedBox(height: 20),

          // Terms
          Row(children: [
            Checkbox(value: _termsAccepted, onChanged: (v) => setState(() => _termsAccepted = v!), activeColor: kGold),
            const Expanded(child: Text('I agree to the u-bike Rider Terms, Safety Policy, and understand the membership fee is non-refundable.', style: TextStyle(color: kSubtext, fontSize: 12))),
          ]),

          const SizedBox(height: 20),

          ElevatedButton(
            onPressed: _submitting ? null : _submit,
            child: _submitting ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: kCharcoal)) : const Text('Submit KYC Documents'),
          ),
        ],
      ),
    );
  }
}

class _UploadTile extends StatelessWidget {
  const _UploadTile({required this.label, required this.file, required this.required, required this.onTap});
  final String label;
  final XFile? file;
  final bool required;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: file != null ? kSuccess.withOpacity(0.08) : kCharcoalLight,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: file != null ? kSuccess.withOpacity(0.4) : kBorder.withOpacity(0.5)),
      ),
      child: Row(children: [
        Container(width: 40, height: 40, decoration: BoxDecoration(color: (file != null ? kSuccess : kGold).withOpacity(0.15), shape: BoxShape.circle), child: Icon(file != null ? Icons.check_circle_outline : Icons.upload_file_outlined, color: file != null ? kSuccess : kGold, size: 22)),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Text(label, style: const TextStyle(color: kCream, fontWeight: FontWeight.w500, fontSize: 13)),
            if (required) const Text(' *', style: TextStyle(color: kSienna)),
          ]),
          Text(file != null ? '✓ Uploaded' : 'Tap to upload', style: TextStyle(color: file != null ? kSuccess : kSubtext, fontSize: 11)),
        ])),
        Icon(Icons.chevron_right, color: kSubtext, size: 20),
      ]),
    ),
  );
}
