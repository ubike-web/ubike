import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme.dart';
import '../../../shared/widgets/animated_auth_card.dart';
import '../providers/auth_provider.dart';

// Import UbikeLogo and _DarkField / _GlowButton from customer app equivalents
// (they're duplicated here since apps are separate)

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
    backgroundColor: const Color(0xFF0D1B2A),
    body: SafeArea(
      child: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const SizedBox(height: 20),

              // Rider badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: kOcean.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: kOcean.withOpacity(0.5)),
                ),
                child: const Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.electric_moped, color: kOceanLight, size: 18),
                  SizedBox(width: 8),
                  Text('Rider Portal', style: TextStyle(color: kOceanLight, fontWeight: FontWeight.w700, fontSize: 13)),
                ]),
              ).animate().fadeIn(duration: 400.ms),

              const SizedBox(height: 32),

              AnimatedAuthCard(
                child: Padding(
                  padding: const EdgeInsets.all(28),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('RIDER SIGN IN', style: TextStyle(color: kWhite, fontSize: 13, fontWeight: FontWeight.w700, letterSpacing: 3)),
                      const SizedBox(height: 6),
                      Text('Enter your phone to receive an OTP', style: TextStyle(color: kWhite.withOpacity(0.5), fontSize: 12)),
                      const SizedBox(height: 24),

                      // Phone field
                      Container(
                        decoration: BoxDecoration(
                          color: const Color(0xFF0A1218),
                          borderRadius: BorderRadius.circular(30),
                          border: Border.all(color: kWhite.withOpacity(0.3), width: 1.5),
                        ),
                        child: Row(children: [
                          const Padding(
                            padding: EdgeInsets.symmetric(horizontal: 14),
                            child: Text('+254', style: TextStyle(color: kOceanLight, fontWeight: FontWeight.w700, fontSize: 14)),
                          ),
                          Container(width: 1, height: 28, color: kWhite.withOpacity(0.2)),
                          Expanded(
                            child: TextField(
                              controller: _ctrl,
                              keyboardType: TextInputType.phone,
                              style: const TextStyle(color: kWhite, fontSize: 15),
                              onSubmitted: (_) => _send(),
                              decoration: const InputDecoration(
                                hintText: '700 000 000',
                                hintStyle: TextStyle(color: Color(0xFF6B7A8D)),
                                border: InputBorder.none,
                                enabledBorder: InputBorder.none,
                                focusedBorder: InputBorder.none,
                                contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                              ),
                            ),
                          ),
                        ]),
                      ),

                      if (_error != null) ...[
                        const SizedBox(height: 12),
                        Text(_error!, style: const TextStyle(color: Color(0xFFFF7096), fontSize: 12), textAlign: TextAlign.center),
                      ],

                      const SizedBox(height: 20),

                      _GlowButton(label: 'Send OTP', loading: _loading, onTap: _send),
                    ],
                  ),
                ),
              ).animate(delay: 200.ms).fadeIn(duration: 500.ms).slideY(begin: 0.4),
            ],
          ),
        ),
      ),
    ),
  );
}

class _GlowButton extends StatefulWidget {
  const _GlowButton({required this.label, required this.onTap, this.loading = false});
  final String label;
  final VoidCallback onTap;
  final bool loading;

  @override
  State<_GlowButton> createState() => _GlowButtonState();
}

class _GlowButtonState extends State<_GlowButton> {
  bool _hover = false;

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTapDown: (_) => setState(() => _hover = true),
    onTapUp: (_) { setState(() => _hover = false); widget.onTap(); },
    onTapCancel: () => setState(() => _hover = false),
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 14),
      decoration: BoxDecoration(
        color: const Color(0xFF42C8F5),
        borderRadius: BorderRadius.circular(30),
        boxShadow: _hover ? [const BoxShadow(color: Color(0x9942C8F5), blurRadius: 24, spreadRadius: 2)] : [const BoxShadow(color: Color(0x4242C8F5), blurRadius: 8)],
      ),
      child: Center(
        child: widget.loading
          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF0A1A2E)))
          : const Text('Send OTP', style: TextStyle(color: Color(0xFF0A1A2E), fontWeight: FontWeight.w700, fontSize: 15)),
      ),
    ),
  );
}
