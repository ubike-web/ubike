import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme.dart';
import '../providers/auth_provider.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});
  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() { super.initState(); _nav(); }

  Future<void> _nav() async {
    await Future.delayed(const Duration(milliseconds: 2500));
    if (!mounted) return;
    final auth = ref.read(authProvider);
    context.go(auth.isAuthenticated ? '/dashboard' : '/onboarding');
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: kCharcoal,
    body: Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      Container(width: 110, height: 110, decoration: BoxDecoration(color: kGold.withOpacity(0.12), shape: BoxShape.circle, border: Border.all(color: kGold.withOpacity(0.4), width: 2)), child: const Icon(Icons.electric_moped, color: kGold, size: 56))
          .animate().scale(begin: const Offset(0.5, 0.5), curve: Curves.elasticOut, duration: 700.ms),
      const SizedBox(height: 20),
      const Text('u-bike Rider', style: TextStyle(color: kGold, fontSize: 36, fontWeight: FontWeight.w800))
          .animate(delay: 300.ms).fadeIn(duration: 400.ms).slideY(begin: 0.3),
      const SizedBox(height: 6),
      const Text('Passenger Transport', style: TextStyle(color: kSubtext, fontSize: 13))
          .animate(delay: 450.ms).fadeIn(duration: 400.ms),
      const SizedBox(height: 60),
      const SizedBox(width: 28, height: 28, child: CircularProgressIndicator(strokeWidth: 2, color: kGold))
          .animate(delay: 800.ms).fadeIn(duration: 400.ms),
    ])),
  );
}
