import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme.dart';
import '../../../shared/widgets/animated_auth_card.dart';
import '../providers/auth_provider.dart';
import 'splash_screen.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});
  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _loading = false;
  bool _obscure = true;
  String? _error;

  @override
  void dispose() { _emailCtrl.dispose(); _passCtrl.dispose(); super.dispose(); }

  Future<void> _login() async {
    if (_emailCtrl.text.isEmpty || _passCtrl.text.isEmpty) {
      setState(() => _error = 'Please fill in all fields');
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      await ref.read(authProvider.notifier).loginEmail(_emailCtrl.text.trim(), _passCtrl.text);
      if (mounted) context.go('/home');
    } catch (_) {
      setState(() => _error = ref.read(authProvider).error ?? 'Login failed');
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
                UbikeLogo(size: 80, color: kWhite)
                  .animate().scale(begin: const Offset(0.5, 0.5), curve: Curves.elasticOut, duration: 600.ms),

                const SizedBox(height: 12),
                const Text('U-BIKE', style: TextStyle(color: kWhite, fontSize: 30, fontWeight: FontWeight.w900, letterSpacing: 4))
                  .animate(delay: 200.ms).fadeIn(duration: 400.ms),

                const SizedBox(height: 32),

                AnimatedAuthCard(
                  child: Padding(
                    padding: const EdgeInsets.all(28),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                          const Icon(Icons.login, color: kOceanLight, size: 18),
                          const SizedBox(width: 8),
                          const Text('SIGN IN', style: TextStyle(color: kWhite, fontSize: 14, fontWeight: FontWeight.w700, letterSpacing: 3)),
                        ]),

                        const SizedBox(height: 24),

                        _DarkField(controller: _emailCtrl, hint: 'Email or Phone', icon: Icons.person_outline),
                        const SizedBox(height: 14),
                        _DarkField(
                          controller: _passCtrl,
                          hint: 'Password',
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
                          label: 'Sign In',
                          loading: _loading,
                          onTap: _login,
                          color: const Color(0xFF42C8F5),
                        ),

                        const SizedBox(height: 16),
                        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                          GestureDetector(
                            onTap: () {},
                            child: Text('Forgot Password?', style: TextStyle(color: kWhite.withOpacity(0.5), fontSize: 12)),
                          ),
                          GestureDetector(
                            onTap: () => context.push('/phone'),
                            child: const Text('Use OTP instead', style: TextStyle(color: kOceanLight, fontSize: 12, fontWeight: FontWeight.w600)),
                          ),
                        ]),

                        const SizedBox(height: 20),

                        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                          Text("Don't have an account? ", style: TextStyle(color: kWhite.withOpacity(0.5), fontSize: 12)),
                          GestureDetector(
                            onTap: () => context.push('/register'),
                            child: const Text('Sign up', style: TextStyle(color: Color(0xFFFF7096), fontWeight: FontWeight.w700, fontSize: 12)),
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

// ─── Shared auth widgets ──────────────────────────────────────────────────────

class _DarkField extends StatelessWidget {
  const _DarkField({required this.controller, required this.hint, required this.icon, this.obscure = false, this.suffixIcon, this.keyboardType});
  final TextEditingController controller;
  final String hint;
  final IconData icon;
  final bool obscure;
  final Widget? suffixIcon;
  final TextInputType? keyboardType;

  @override
  Widget build(BuildContext context) => TextField(
    controller: controller,
    obscureText: obscure,
    keyboardType: keyboardType,
    style: const TextStyle(color: kWhite, fontSize: 14),
    decoration: InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: Color(0xFF6B7A8D), fontSize: 14),
      filled: true,
      fillColor: const Color(0xFF0A1218),
      prefixIcon: Icon(icon, color: kOceanLight, size: 18),
      suffixIcon: suffixIcon,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(30), borderSide: const BorderSide(color: kWhite, width: 1.5)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(30), borderSide: BorderSide(color: kWhite.withOpacity(0.3), width: 1.5)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(30), borderSide: const BorderSide(color: Color(0xFF42C8F5), width: 2)),
    ),
  );
}

class _GlowButton extends StatefulWidget {
  const _GlowButton({required this.label, required this.onTap, this.loading = false, this.color = kOcean});
  final String label;
  final VoidCallback onTap;
  final bool loading;
  final Color color;

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
        color: widget.color,
        borderRadius: BorderRadius.circular(30),
        boxShadow: _hover ? [BoxShadow(color: widget.color.withOpacity(0.7), blurRadius: 24, spreadRadius: 2)] : [BoxShadow(color: widget.color.withOpacity(0.3), blurRadius: 8)],
      ),
      child: Center(
        child: widget.loading
          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF0A1A2E)))
          : Text(widget.label, style: const TextStyle(color: Color(0xFF0A1A2E), fontWeight: FontWeight.w700, fontSize: 15)),
      ),
    ),
  );
}
