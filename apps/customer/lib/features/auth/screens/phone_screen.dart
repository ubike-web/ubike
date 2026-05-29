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
  final _controller = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _sendOtp() async {
    final phone = _controller.text.trim();
    if (phone.length < 9) {
      setState(() => _error = 'Enter a valid phone number');
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      await ref.read(authProvider.notifier).sendOtp(phone);
      if (mounted) context.push('/otp', extra: {'phone': phone});
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Phone Number')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 16),
              const Text('Enter your phone number',
                  style: TextStyle(color: kOnSurface, fontSize: 24, fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              const Text('We\'ll send you a 6-digit OTP to verify your number.',
                  style: TextStyle(color: Color(0xFF8B8578))),
              const SizedBox(height: 32),
              TextField(
                controller: _controller,
                keyboardType: TextInputType.phone,
                style: const TextStyle(color: kOnSurface, fontSize: 18),
                decoration: const InputDecoration(
                  labelText: 'Phone Number',
                  hintText: '+254 700 000 000',
                  prefixIcon: Icon(Icons.phone, color: kGold),
                ),
                onSubmitted: (_) => _sendOtp(),
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: kSienna.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: kSienna),
                  ),
                  child: Text(_error!, style: const TextStyle(color: Color(0xFFE8A898), fontSize: 13)),
                ),
              ],
              const Spacer(),
              ElevatedButton(
                onPressed: _loading ? null : _sendOtp,
                child: _loading
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: kCharcoal))
                    : const Text('Send OTP'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
