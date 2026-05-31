import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme.dart';
import '../../../shared/widgets/animated_auth_card.dart';
import '../providers/auth_provider.dart';
import 'splash_screen.dart';

/// Welcome — Choose phone or email (shown only when NOT logged in)
class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});
  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> {
  bool _showForm = false;

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
                const SizedBox(height: 20),

                // Logo
                UbikeLogo(size: 110, color: kWhite)
                  .animate().scale(begin: const Offset(0.5, 0.5), curve: Curves.elasticOut, duration: 800.ms),

                const SizedBox(height: 16),
                const Text('U-BIKE', style: TextStyle(color: kWhite, fontSize: 38, fontWeight: FontWeight.w900, letterSpacing: 5))
                  .animate(delay: 300.ms).fadeIn(duration: 500.ms).slideY(begin: 0.3),

                const SizedBox(height: 4),
                Text('Premium Motorbike Platform', style: TextStyle(color: kWhite.withOpacity(0.6), fontSize: 12, letterSpacing: 2))
                  .animate(delay: 450.ms).fadeIn(duration: 400.ms),

                const SizedBox(height: 40),

                // Animated spinning border card
                AnimatedAuthCard(
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 500),
                    curve: Curves.easeOut,
                    padding: const EdgeInsets.all(28),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Title
                        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                          const Icon(Icons.login, color: kOceanLight, size: 20),
                          const SizedBox(width: 8),
                          const Text('GET STARTED', style: TextStyle(color: kWhite, fontSize: 15, fontWeight: FontWeight.w700, letterSpacing: 3)),
                        ]),

                        const SizedBox(height: 24),

                        // Phone button
                        _AnimButton(
                          label: 'Continue with Phone',
                          icon: Icons.phone_android,
                          color: kOcean,
                          glowColor: kOcean,
                          onTap: () => context.push('/phone'),
                        ).animate(delay: 200.ms).fadeIn(duration: 400.ms).slideY(begin: 0.3),

                        const SizedBox(height: 14),

                        // Email button
                        _AnimButton(
                          label: 'Continue with Email',
                          icon: Icons.email_outlined,
                          color: const Color(0xFF42C8F5),
                          glowColor: const Color(0xFF42C8F5),
                          onTap: () => context.push('/register'),
                        ).animate(delay: 300.ms).fadeIn(duration: 400.ms).slideY(begin: 0.3),

                        const SizedBox(height: 24),

                        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                          Text("Already have an account? ", style: TextStyle(color: kWhite.withOpacity(0.5), fontSize: 12)),
                          GestureDetector(
                            onTap: () => context.push('/login'),
                            child: const Text('Sign in', style: TextStyle(color: kOceanLight, fontSize: 12, fontWeight: FontWeight.w700)),
                          ),
                        ]),

                        const SizedBox(height: 16),
                        Text('By continuing you agree to our Terms & Privacy Policy',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: kWhite.withOpacity(0.3), fontSize: 10, height: 1.5)),
                      ],
                    ),
                  ),
                ).animate(delay: 600.ms).fadeIn(duration: 500.ms).slideY(begin: 0.4),

                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _AnimButton extends StatefulWidget {
  const _AnimButton({required this.label, required this.icon, required this.color, required this.glowColor, required this.onTap});
  final String label;
  final IconData icon;
  final Color color;
  final Color glowColor;
  final VoidCallback onTap;

  @override
  State<_AnimButton> createState() => _AnimButtonState();
}

class _AnimButtonState extends State<_AnimButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) { setState(() => _pressed = false); widget.onTap(); },
      onTapCancel: () => setState(() => _pressed = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: _pressed ? widget.color : Colors.transparent,
          borderRadius: BorderRadius.circular(30),
          border: Border.all(color: widget.color, width: 2),
          boxShadow: _pressed ? [BoxShadow(color: widget.glowColor.withOpacity(0.6), blurRadius: 20, spreadRadius: 2)] : null,
        ),
        child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(widget.icon, color: _pressed ? kWhite : widget.color, size: 18),
          const SizedBox(width: 10),
          Text(widget.label, style: TextStyle(color: _pressed ? kWhite : widget.color, fontWeight: FontWeight.w600, fontSize: 14)),
        ]),
      ),
    );
  }
}
