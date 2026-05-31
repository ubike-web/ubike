import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme.dart';
import '../../../shared/widgets/animated_auth_card.dart';
import '../providers/auth_provider.dart';
import 'login_screen.dart';
import 'splash_screen.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});
  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _loading = false;
  bool _obscure = true;
  String? _error;

  @override
  void dispose() { _nameCtrl.dispose(); _emailCtrl.dispose(); _passCtrl.dispose(); super.dispose(); }

  Future<void> _register() async {
    if (_nameCtrl.text.isEmpty || _emailCtrl.text.isEmpty || _passCtrl.text.isEmpty) {
      setState(() => _error = 'Please fill in all fields');
      return;
    }
    if (_passCtrl.text.length < 8) {
      setState(() => _error = 'Password must be at least 8 characters');
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      await ref.read(authProvider.notifier).registerEmail(_emailCtrl.text.trim(), _passCtrl.text, _nameCtrl.text.trim());
      if (mounted) context.go('/home');
    } catch (_) {
      setState(() => _error = ref.read(authProvider).error ?? 'Registration failed');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D1B2A),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                UbikeLogo(size: 70, color: kWhite)
                  .animate().scale(begin: const Offset(0.5, 0.5), curve: Curves.elasticOut, duration: 600.ms),

                const SizedBox(height: 10),
                const Text('U-BIKE', style: TextStyle(color: kWhite, fontSize: 26, fontWeight: FontWeight.w900, letterSpacing: 4))
                  .animate(delay: 200.ms).fadeIn(duration: 400.ms),

                const SizedBox(height: 28),

                AnimatedAuthCard(
                  child: Padding(
                    padding: const EdgeInsets.all(28),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                          const Icon(Icons.person_add_outlined, color: kOceanLight, size: 18),
                          const SizedBox(width: 8),
                          const Text('CREATE ACCOUNT', style: TextStyle(color: kWhite, fontSize: 13, fontWeight: FontWeight.w700, letterSpacing: 2)),
                        ]),

                        const SizedBox(height: 22),

                        _DarkField(controller: _nameCtrl, hint: 'Full Name', icon: Icons.badge_outlined),
                        const SizedBox(height: 12),
                        _DarkField(controller: _emailCtrl, hint: 'Email Address', icon: Icons.email_outlined, keyboardType: TextInputType.emailAddress),
                        const SizedBox(height: 12),
                        _DarkField(
                          controller: _passCtrl,
                          hint: 'Password (min 8 chars)',
                          icon: Icons.lock_outline,
                          obscure: _obscure,
                          suffixIcon: IconButton(
                            icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined, color: kOceanLight, size: 18),
                            onPressed: () => setState(() => _obscure = !_obscure),
                          ),
                        ),

                        if (_error != null) ...[
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            decoration: BoxDecoration(color: kError.withOpacity(0.15), borderRadius: BorderRadius.circular(8), border: Border.all(color: kError.withOpacity(0.5))),
                            child: Text(_error!, style: const TextStyle(color: Color(0xFFFF7096), fontSize: 12), textAlign: TextAlign.center),
                          ),
                        ],

                        const SizedBox(height: 20),

                        _GlowButton(
                          label: 'Create Account',
                          loading: _loading,
                          onTap: _register,
                          color: const Color(0xFF42C8F5),
                        ),

                        const SizedBox(height: 16),

                        // Divider
                        Row(children: [
                          Expanded(child: Divider(color: kWhite.withOpacity(0.15))),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            child: Text('or', style: TextStyle(color: kWhite.withOpacity(0.3), fontSize: 12)),
                          ),
                          Expanded(child: Divider(color: kWhite.withOpacity(0.15))),
                        ]),

                        const SizedBox(height: 16),

                        // Phone OTP option
                        GestureDetector(
                          onTap: () => context.push('/phone'),
                          child: Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(30),
                              border: Border.all(color: kOcean.withOpacity(0.6), width: 1.5),
                            ),
                            child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                              Icon(Icons.phone_android, color: kOcean, size: 16),
                              SizedBox(width: 8),
                              Text('Register with Phone OTP', style: TextStyle(color: kOcean, fontSize: 13, fontWeight: FontWeight.w600)),
                            ]),
                          ),
                        ),

                        const SizedBox(height: 20),
                        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                          Text("Already have an account? ", style: TextStyle(color: kWhite.withOpacity(0.5), fontSize: 12)),
                          GestureDetector(
                            onTap: () => context.push('/login'),
                            child: const Text('Sign in', style: TextStyle(color: Color(0xFFFF7096), fontWeight: FontWeight.w700, fontSize: 12)),
                          ),
                        ]),
                      ],
                    ),
                  ),
                ).animate(delay: 300.ms).fadeIn(duration: 500.ms).slideY(begin: 0.4),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
