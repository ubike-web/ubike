import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Spacer(),
              // Logo
              Center(
                child: Column(
                  children: [
                    Container(
                      width: 96,
                      height: 96,
                      decoration: BoxDecoration(
                        color: kGold.withOpacity(0.15),
                        shape: BoxShape.circle,
                        border: Border.all(color: kGold, width: 2),
                      ),
                      child: const Icon(Icons.electric_moped, color: kGold, size: 48),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'u-bike',
                      style: TextStyle(
                        color: kGold,
                        fontSize: 40,
                        fontWeight: FontWeight.w700,
                        letterSpacing: -1,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Premium Motorbike Ride-Hailing',
                      style: TextStyle(color: Color(0xFF8B8578), fontSize: 15),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              // Features
              _Feature(icon: Icons.bolt, label: 'Instant ride matching in 30 seconds'),
              const SizedBox(height: 12),
              _Feature(icon: Icons.shield_outlined, label: 'KYC-verified riders only'),
              const SizedBox(height: 12),
              _Feature(icon: Icons.local_shipping_outlined, label: 'Errands & delivery, same day'),
              const Spacer(),
              ElevatedButton(
                onPressed: () => context.push('/phone'),
                child: const Text('Get Started'),
              ),
              const SizedBox(height: 12),
              Center(
                child: Text(
                  'By continuing you agree to our Terms & Privacy Policy',
                  style: TextStyle(color: Colors.grey[600], fontSize: 12),
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}

class _Feature extends StatelessWidget {
  const _Feature({required this.icon, required this.label});
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: kGold.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: kGold, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(label, style: const TextStyle(color: Color(0xFFBBB5A8), fontSize: 14)),
        ),
      ],
    );
  }
}
