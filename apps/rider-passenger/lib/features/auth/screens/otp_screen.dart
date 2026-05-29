import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pinput/pinput.dart';
import '../../../core/theme.dart';
import '../providers/auth_provider.dart';

class OtpScreen extends ConsumerStatefulWidget {
  const OtpScreen({super.key, required this.phone});
  final String phone;
  @override
  ConsumerState<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends ConsumerState<OtpScreen> {
  final _ctrl = TextEditingController();
  bool _loading = false;
  String? _error;
  int _countdown = 60;
  Timer? _timer;

  @override
  void initState() { super.initState(); _start(); }
  @override
  void dispose() { _ctrl.dispose(); _timer?.cancel(); super.dispose(); }

  void _start() { _timer = Timer.periodic(const Duration(seconds: 1), (t) { if (_countdown <= 0) t.cancel(); else setState(() => _countdown--); }); }

  Future<void> _verify(String otp) async {
    if (otp.length < 6) return;
    setState(() { _loading = true; _error = null; });
    try {
      await ref.read(authProvider.notifier).verifyOtp(widget.phone, otp);
      if (mounted) context.go('/dashboard');
    } catch (_) { setState(() { _error = ref.read(authProvider).error ?? 'Invalid OTP'; _loading = false; _ctrl.clear(); }); }
  }

  @override
  Widget build(BuildContext context) {
    final pin = PinTheme(width: 54, height: 58, textStyle: const TextStyle(color: kCream, fontSize: 20, fontWeight: FontWeight.w700), decoration: BoxDecoration(color: kCharcoalLight, borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorder)));
    return Scaffold(
      appBar: AppBar(title: const Text('Verify OTP')),
      body: Padding(padding: const EdgeInsets.all(24), child: Column(children: [
        const SizedBox(height: 24),
        const Icon(Icons.sms_outlined, color: kGold, size: 56),
        const SizedBox(height: 16),
        Text('Code sent to ${widget.phone}', style: const TextStyle(color: kCream, fontSize: 16, fontWeight: FontWeight.w600), textAlign: TextAlign.center),
        const SizedBox(height: 32),
        Pinput(controller: _ctrl, length: 6, defaultPinTheme: pin, focusedPinTheme: pin.copyWith(decoration: pin.decoration!.copyWith(border: Border.all(color: kGold, width: 2))), onCompleted: _verify, autofocus: true),
        if (_error != null) ...[const SizedBox(height: 12), Text(_error!, style: const TextStyle(color: kError), textAlign: TextAlign.center)],
        const SizedBox(height: 24),
        _countdown > 0 ? Text('Resend in ${_countdown}s', style: const TextStyle(color: kSubtext)) : TextButton(onPressed: () async { await ref.read(authProvider.notifier).sendOtp(widget.phone); setState(() => _countdown = 60); _start(); }, child: const Text('Resend OTP')),
        const Spacer(),
        if (_loading) const CircularProgressIndicator(color: kGold) else ElevatedButton(onPressed: () => _verify(_ctrl.text), child: const Text('Verify')),
      ])),
    );
  }
}
