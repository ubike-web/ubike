import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme.dart';
import 'splash_screen.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          // Top hero — ocean blue gradient
          Expanded(
            flex: 55,
            child: Container(
              width: double.infinity,
              decoration: const BoxDecoration(
                gradient: kOceanGradient,
                borderRadius: BorderRadius.vertical(bottom: Radius.circular(36)),
              ),
              child: SafeArea(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const SizedBox(height: 20),

                    UbikeLogo(size: 130)
                      .animate()
                      .scale(begin: const Offset(0.4, 0.4), curve: Curves.elasticOut, duration: 800.ms)
                      .fadeIn(duration: 500.ms),

                    const SizedBox(height: 20),

                    Text(
                      'U-BIKE',
                      style: TextStyle(
                        color: kWhite,
                        fontSize: 40,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 4,
                        shadows: [Shadow(color: kOceanDeep.withOpacity(0.5), blurRadius: 10, offset: const Offset(0, 3))],
                      ),
                    ).animate(delay: 300.ms).fadeIn(duration: 500.ms).slideY(begin: 0.3),

                    const SizedBox(height: 6),
                    Text(
                      'Premium Motorbike Platform',
                      style: TextStyle(color: kWhite.withOpacity(0.85), fontSize: 13, letterSpacing: 1.2),
                    ).animate(delay: 450.ms).fadeIn(duration: 400.ms),

                    const SizedBox(height: 28),

                    // Feature chips
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      alignment: WrapAlignment.center,
                      children: [
                        _Chip(icon: Icons.bolt, label: '30s Match'),
                        _Chip(icon: Icons.verified_user_outlined, label: 'KYC Verified'),
                        _Chip(icon: Icons.lock_outlined, label: 'Escrow Safe'),
                        _Chip(icon: Icons.sos, label: 'SOS Ready'),
                      ],
                    ).animate(delay: 600.ms).fadeIn(duration: 400.ms),

                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
          ),

          // Bottom section — white
          Expanded(
            flex: 45,
            child: Container(
              color: kWhite,
              padding: const EdgeInsets.fromLTRB(28, 28, 28, 20),
              child: Column(
                children: [
                  Text(
                    'Get started',
                    style: TextStyle(color: kDark, fontSize: 22, fontWeight: FontWeight.w800),
                  ).animate(delay: 700.ms).fadeIn(duration: 400.ms),

                  const SizedBox(height: 6),
                  Text(
                    'Kenya\'s fastest motorbike platform',
                    style: TextStyle(color: kGrey, fontSize: 13),
                  ).animate(delay: 750.ms).fadeIn(duration: 400.ms),

                  const SizedBox(height: 24),

                  ElevatedButton.icon(
                    onPressed: () => context.push('/phone'),
                    icon: const Icon(Icons.phone_android, size: 20),
                    label: const Text('Continue with Phone'),
                  ).animate(delay: 800.ms).fadeIn(duration: 400.ms).slideY(begin: 0.3),

                  const SizedBox(height: 12),

                  OutlinedButton.icon(
                    onPressed: () => context.push('/register'),
                    icon: const Icon(Icons.email_outlined, size: 20),
                    label: const Text('Continue with Email'),
                  ).animate(delay: 900.ms).fadeIn(duration: 400.ms).slideY(begin: 0.3),

                  const Spacer(),

                  Text(
                    'By continuing you agree to our Terms of Service\nand Privacy Policy',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: kGrey, fontSize: 11, height: 1.5),
                  ).animate(delay: 1000.ms).fadeIn(duration: 400.ms),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({required this.icon, required this.label});
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
    decoration: BoxDecoration(
      color: kWhite.withOpacity(0.18),
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: kWhite.withOpacity(0.4)),
    ),
    child: Row(mainAxisSize: MainAxisSize.min, children: [
      Icon(icon, color: kWhite, size: 14),
      const SizedBox(width: 5),
      Text(label, style: const TextStyle(color: kWhite, fontSize: 12, fontWeight: FontWeight.w500)),
    ]),
  );
}
