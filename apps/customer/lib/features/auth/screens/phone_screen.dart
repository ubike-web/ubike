import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme.dart';
import '../../../shared/widgets/app_button.dart';
import '../providers/auth_provider.dart';

class PhoneScreen extends ConsumerStatefulWidget {
  const PhoneScreen({super.key});
  @override
  ConsumerState<PhoneScreen> createState() => _PhoneScreenState();
}

class _PhoneScreenState extends ConsumerState<PhoneScreen> {
  final _ctrl = TextEditingController();
  final _focus = FocusNode();
  bool _loading = false;
  String? _error;
  String _countryCode = '+254';

  final _codes = ['+254', '+255', '+256', '+251', '+233', '+234'];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _focus.requestFocus());
  }

  @override
  void dispose() { _ctrl.dispose(); _focus.dispose(); super.dispose(); }

  Future<void> _send() async {
    final phone = '$_countryCode${_ctrl.text.trim().replaceAll(RegExp(r'^0'), '')}';
    if (_ctrl.text.trim().length < 9) {
      setState(() => _error = 'Enter a valid phone number');
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      await ref.read(authProvider.notifier).sendOtp(phone);
      if (mounted) context.push('/otp', extra: {'phone': phone});
    } catch (e) {
      setState(() => _error = ref.read(authProvider).error ?? 'Failed to send OTP');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Enter Phone')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 16),
              const Text('Your phone number', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w700, color: kCream)),
              const SizedBox(height: 8),
              const Text("We'll send you a verification code", style: TextStyle(color: kSubtext, fontSize: 14)),
              const SizedBox(height: 32),

              // Phone field
              Row(children: [
                // Country code
                GestureDetector(
                  onTap: () => _showCountryCodes(),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
                    decoration: BoxDecoration(
                      color: kCharcoalLight,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: kBorder.withOpacity(0.6)),
                    ),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      Text(_countryCode, style: const TextStyle(color: kCream, fontWeight: FontWeight.w600)),
                      const SizedBox(width: 4),
                      const Icon(Icons.expand_more, color: kSubtext, size: 18),
                    ]),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextField(
                    controller: _ctrl,
                    focusNode: _focus,
                    keyboardType: TextInputType.phone,
                    style: const TextStyle(color: kCream, fontSize: 18, fontWeight: FontWeight.w500, letterSpacing: 1.5),
                    decoration: const InputDecoration(hintText: '700 000 000'),
                    onSubmitted: (_) => _send(),
                  ),
                ),
              ]),

              if (_error != null) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: kError.withOpacity(0.1), borderRadius: BorderRadius.circular(10), border: Border.all(color: kError.withOpacity(0.5))),
                  child: Row(children: [
                    const Icon(Icons.error_outline, color: kError, size: 18),
                    const SizedBox(width: 8),
                    Expanded(child: Text(_error!, style: const TextStyle(color: kError, fontSize: 13))),
                  ]),
                ),
              ],

              const Spacer(),
              AppButton(label: 'Send OTP', onPressed: _send, loading: _loading, icon: Icons.send),
              const SizedBox(height: 12),
              Center(child: TextButton(
                onPressed: () => context.push('/register'),
                child: const Text("Don't have an account? Register with Email"),
              )),
            ],
          ),
        ),
      ),
    );
  }

  void _showCountryCodes() {
    showModalBottomSheet(
      context: context,
      builder: (_) => Column(mainAxisSize: MainAxisSize.min, children: [
        const Padding(padding: EdgeInsets.all(16), child: Text('Select Country Code', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16))),
        ..._codes.map((c) => ListTile(
          title: Text(c),
          trailing: _countryCode == c ? const Icon(Icons.check, color: kGold) : null,
          onTap: () { setState(() => _countryCode = c); Navigator.pop(context); },
        )),
        const SizedBox(height: 16),
      ]),
    );
  }
}
