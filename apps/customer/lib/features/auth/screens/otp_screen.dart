import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pinput/pinput.dart';
import '../../../core/theme.dart';
import '../../../shared/widgets/app_button.dart';
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
  void initState() {
    super.initState();
    _startCountdown();
  }

  void _startCountdown() {
    _timer?.cancel();
    setState(() => _countdown = 60);
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_countdown <= 0) t.cancel();
      else setState(() => _countdown--);
    });
  }

  @override
  void dispose() { _ctrl.dispose(); _timer?.cancel(); super.dispose(); }

  Future<void> _verify(String otp) async {
    if (otp.length < 6) return;
    setState(() { _loading = true; _error = null; });
    try {
      await ref.read(authProvider.notifier).verifyOtp(widget.phone, otp);
      if (mounted) context.go('/home');
    } catch (_) {
      setState(() => _error = ref.read(authProvider).error ?? 'Invalid OTP');
      _ctrl.clear();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _resend() async {
    try {
      await ref.read(authProvider.notifier).sendOtp(widget.phone);
      _startCountdown();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('OTP resent!')));
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final pinTheme = PinTheme(
      width: 56,
      height: 60,
      textStyle: const TextStyle(color: kCream, fontSize: 22, fontWeight: FontWeight.w700),
      decoration: BoxDecoration(
        color: kCharcoalLight,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kBorder.withOpacity(0.6)),
      ),
    );

    return Scaffold(
      appBar: AppBar(title: const Text('Verify OTP')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const SizedBox(height: 24),
              Container(
                width: 80, height: 80,
                decoration: BoxDecoration(color: kGold.withOpacity(0.12), shape: BoxShape.circle, border: Border.all(color: kGold.withOpacity(0.4), width: 2)),
                child: const Icon(Icons.mark_email_unread_outlined, color: kGold, size: 40),
              ),
              const SizedBox(height: 20),
              const Text('Verification Code', style: TextStyle(color: kCream, fontSize: 22, fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              Text('Sent to ${widget.phone}', style: const TextStyle(color: kSubtext, fontSize: 13)),
              const SizedBox(height: 40),

              Pinput(
                controller: _ctrl,
                length: 6,
                defaultPinTheme: pinTheme,
                focusedPinTheme: pinTheme.copyWith(
                  decoration: pinTheme.decoration!.copyWith(border: Border.all(color: kGold, width: 2.5)),
                ),
                submittedPinTheme: pinTheme.copyWith(
                  decoration: pinTheme.decoration!.copyWith(color: kGold.withOpacity(0.15), border: Border.all(color: kGold)),
                ),
                errorPinTheme: pinTheme.copyWith(
                  decoration: pinTheme.decoration!.copyWith(border: Border.all(color: kError)),
                ),
                onCompleted: _verify,
                autofocus: true,
              ),

              const SizedBox(height: 20),

              if (_error != null) Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(color: kError.withOpacity(0.1), borderRadius: BorderRadius.circular(10), border: Border.all(color: kError.withOpacity(0.4))),
                child: Text(_error!, style: const TextStyle(color: kError, fontSize: 13), textAlign: TextAlign.center),
              ),

              const SizedBox(height: 24),

              // Resend
              _countdown > 0
                ? Text('Resend OTP in ${_countdown}s', style: const TextStyle(color: kSubtext, fontSize: 13))
                : TextButton(onPressed: _resend, child: const Text('Resend OTP')),

              const Spacer(),
              AppButton(label: 'Verify', onPressed: () => _verify(_ctrl.text), loading: _loading),
            ],
          ),
        ),
      ),
    );
  }
}
