import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/theme.dart';
import '../providers/auth_provider.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _navigate();
  }

  Future<void> _navigate() async {
    await Future.delayed(const Duration(milliseconds: 2800));
    if (!mounted) return;
    final auth = ref.read(authProvider);
    if (auth.isAuthenticated) {
      context.go('/home');
    } else {
      context.go('/welcome');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kCharcoal,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Logo mark
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: kGold.withOpacity(0.12),
                shape: BoxShape.circle,
                border: Border.all(color: kGold.withOpacity(0.4), width: 2),
              ),
              child: const Icon(Icons.electric_moped, color: kGold, size: 60),
            )
            .animate()
            .fadeIn(duration: 600.ms)
            .scale(begin: const Offset(0.7, 0.7), curve: Curves.elasticOut),

            const SizedBox(height: 24),

            Text(
              'u-bike',
              style: TextStyle(
                color: kGold,
                fontSize: 48,
                fontWeight: FontWeight.w800,
                letterSpacing: -1.5,
              ),
            )
            .animate(delay: 300.ms)
            .fadeIn(duration: 500.ms)
            .slideY(begin: 0.3, curve: Curves.easeOut),

            const SizedBox(height: 8),

            Text(
              'Premium Motorbike Rides & Errands',
              style: TextStyle(color: kSubtext, fontSize: 13, letterSpacing: 0.3),
            )
            .animate(delay: 500.ms)
            .fadeIn(duration: 400.ms),

            const SizedBox(height: 80),

            SizedBox(
              width: 32,
              height: 32,
              child: CircularProgressIndicator(
                strokeWidth: 2.5,
                color: kGold.withOpacity(0.6),
              ),
            )
            .animate(delay: 800.ms)
            .fadeIn(duration: 400.ms),
          ],
        ),
      ),
    );
  }
}
