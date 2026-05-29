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
  final _controller = TextEditingController();
  bool _loading = false;
  String? _error;

  Future<void> _verify(String otp) async {
    if (otp.length < 6) return;
    setState(() { _loading = true; _error = null; });
    try {
      await ref.read(authProvider.notifier).verifyOtp(widget.phone, otp);
      if (mounted) context.go('/home');
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final defaultPinTheme = PinTheme(
      width: 52,
      height: 56,
      textStyle: const TextStyle(color: kOnSurface, fontSize: 20, fontWeight: FontWeight.w600),
      decoration: BoxDecoration(
        color: kSurface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF4A4540)),
      ),
    );

    return Scaffold(
      appBar: AppBar(title: const Text('Verify OTP')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 24),
              const Icon(Icons.sms_outlined, color: kGold, size: 56),
              const SizedBox(height: 16),
              Text(
                'Enter OTP sent to\n${widget.phone}',
                textAlign: TextAlign.center,
                style: const TextStyle(color: kOnSurface, fontSize: 18, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 32),
              Pinput(
                controller: _controller,
                length: 6,
                defaultPinTheme: defaultPinTheme,
                focusedPinTheme: defaultPinTheme.copyWith(
                  decoration: defaultPinTheme.decoration!.copyWith(
                    border: Border.all(color: kGold, width: 2),
                  ),
                ),
                onCompleted: _verify,
                autofocus: true,
              ),
              if (_error != null) ...[
                const SizedBox(height: 16),
                Text(_error!, style: const TextStyle(color: Color(0xFFE8A898), fontSize: 13), textAlign: TextAlign.center),
              ],
              const SizedBox(height: 32),
              if (_loading)
                const CircularProgressIndicator(color: kGold)
              else
                ElevatedButton(
                  onPressed: () => _verify(_controller.text),
                  child: const Text('Verify'),
                ),
              const SizedBox(height: 16),
              TextButton(
                onPressed: () async {
                  await ref.read(authProvider.notifier).sendOtp(widget.phone);
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('OTP resent'), backgroundColor: kGold),
                    );
                  }
                },
                child: const Text('Resend OTP', style: TextStyle(color: kGold)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
