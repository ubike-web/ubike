import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kCharcoal,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              flex: 5,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  // Background gradient
                  Container(
                    decoration: BoxDecoration(
                      gradient: RadialGradient(
                        center: Alignment.center,
                        radius: 1.2,
                        colors: [kGold.withOpacity(0.08), kCharcoal],
                      ),
                    ),
                  ),

                  // Animated logo center
                  Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Stack(
                          alignment: Alignment.center,
                          children: [
                            Container(
                              width: 160,
                              height: 160,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(color: kGold.withOpacity(0.15), width: 24),
                              ),
                            ),
                            Container(
                              width: 120,
                              height: 120,
                              decoration: BoxDecoration(
                                color: kGold.withOpacity(0.1),
                                shape: BoxShape.circle,
                                border: Border.all(color: kGold.withOpacity(0.5), width: 2),
                              ),
                              child: const Icon(Icons.electric_moped, color: kGold, size: 64),
                            ),
                          ],
                        ).animate().fadeIn(duration: 700.ms).scale(begin: const Offset(0.6, 0.6), curve: Curves.elasticOut),

                        const SizedBox(height: 28),

                        Text('u-bike', style: TextStyle(color: kGold, fontSize: 52, fontWeight: FontWeight.w800, letterSpacing: -2))
                            .animate(delay: 300.ms).fadeIn(duration: 500.ms).slideY(begin: 0.4),

                        const SizedBox(height: 10),

                        Text('Rides • Errands • Deliveries', style: TextStyle(color: kSubtext, fontSize: 14, letterSpacing: 1))
                            .animate(delay: 500.ms).fadeIn(duration: 400.ms),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Bottom section
            Expanded(
              flex: 4,
              child: Padding(
                padding: const EdgeInsets.all(28),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    // Feature pills
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      alignment: WrapAlignment.center,
                      children: [
                        _Pill(icon: Icons.bolt, label: '30s Matching'),
                        _Pill(icon: Icons.shield_outlined, label: 'KYC Verified'),
                        _Pill(icon: Icons.payments_outlined, label: 'Escrow Safe'),
                        _Pill(icon: Icons.sos, label: 'SOS Ready'),
                      ],
                    ).animate(delay: 600.ms).fadeIn(duration: 500.ms).slideY(begin: 0.3),

                    const SizedBox(height: 36),

                    // Phone CTA
                    ElevatedButton.icon(
                      onPressed: () => context.push('/phone'),
                      icon: const Icon(Icons.phone_android),
                      label: const Text('Continue with Phone'),
                    )
                    .animate(delay: 700.ms).fadeIn(duration: 400.ms).slideY(begin: 0.3),

                    const SizedBox(height: 12),

                    // Email CTA
                    OutlinedButton.icon(
                      onPressed: () => context.push('/register'),
                      icon: const Icon(Icons.email_outlined),
                      label: const Text('Continue with Email'),
                    )
                    .animate(delay: 800.ms).fadeIn(duration: 400.ms).slideY(begin: 0.3),

                    const SizedBox(height: 20),

                    Text(
                      'By continuing you agree to our Terms of Service\nand Privacy Policy',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: kSubtext, fontSize: 11, height: 1.5),
                    ).animate(delay: 900.ms).fadeIn(duration: 400.ms),

                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  const _Pill({required this.icon, required this.label});
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
    decoration: BoxDecoration(
      color: kGold.withOpacity(0.1),
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: kGold.withOpacity(0.3)),
    ),
    child: Row(mainAxisSize: MainAxisSize.min, children: [
      Icon(icon, color: kGold, size: 15),
      const SizedBox(width: 5),
      Text(label, style: const TextStyle(color: kGold, fontSize: 12, fontWeight: FontWeight.w500)),
    ]),
  );
}
