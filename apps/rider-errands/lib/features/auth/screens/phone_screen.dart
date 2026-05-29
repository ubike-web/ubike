import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme.dart';
import '../providers/auth_provider.dart';

class PhoneScreen extends ConsumerStatefulWidget {
  const PhoneScreen({super.key});
  @override
  ConsumerState<PhoneScreen> createState() => _PhoneScreenState();
}

class _PhoneScreenState extends ConsumerState<PhoneScreen> {
  final _ctrl = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  Future<void> _send() async {
    if (_ctrl.text.trim().length < 9) { setState(() => _error = 'Enter a valid phone number'); return; }
    setState(() { _loading = true; _error = null; });
    final phone = '+254${_ctrl.text.trim().replaceAll(RegExp(r'^0'), '')}';
    try {
      await ref.read(authProvider.notifier).sendOtp(phone);
      if (mounted) context.push('/otp', extra: {'phone': phone});
    } catch (_) { setState(() => _error = ref.read(authProvider).error ?? 'Failed'); }
    finally { if (mounted) setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Rider Sign In')),
    body: Padding(padding: const EdgeInsets.all(24), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const SizedBox(height: 16),
      const Text('Your Phone Number', style: TextStyle(color: kCream, fontSize: 24, fontWeight: FontWeight.w700)),
      const SizedBox(height: 8),
      const Text('We\'ll verify you with a 6-digit OTP', style: TextStyle(color: kSubtext)),
      const SizedBox(height: 32),
      TextField(controller: _ctrl, keyboardType: TextInputType.phone, style: const TextStyle(color: kCream, fontSize: 18), decoration: const InputDecoration(hintText: '07XX XXX XXX', prefixIcon: Icon(Icons.phone, color: kGold), prefixText: '+254  '), onSubmitted: (_) => _send()),
      if (_error != null) ...[const SizedBox(height: 12), Text(_error!, style: const TextStyle(color: kError))],
      const Spacer(),
      ElevatedButton(onPressed: _loading ? null : _send, child: _loading ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: kCharcoal)) : const Text('Send OTP')),
    ])),
  );
}
