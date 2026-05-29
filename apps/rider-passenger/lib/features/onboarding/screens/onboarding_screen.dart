import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});
  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _ctrl = PageController();
  int _page = 0;

  final _pages = [
    _OnboardPage(
      icon: Icons.electric_moped,
      color: kGold,
      title: 'Welcome, Rider!',
      subtitle: 'Join Kenya\'s fastest growing motorbike platform.\nEarn on your own schedule.',
    ),
    _OnboardPage(
      icon: Icons.checklist_rtl_outlined,
      color: kBlue,
      title: 'Requirements',
      subtitle: 'You\'ll need:\n• Functional motorcycle with working lights\n• Helmet (mandatory)\n• National ID\n• Driving License\n• Bike inspection pass',
      isChecklist: true,
    ),
    _OnboardPage(
      icon: Icons.payments_outlined,
      color: kSuccess,
      title: 'Membership Fee',
      subtitle: 'One-time registration fee of KES 2,000.\nNon-refundable. Failed inspection does not qualify for refund.',
      highlight: 'KES 2,000',
    ),
    _OnboardPage(
      icon: Icons.security,
      color: kGold,
      title: 'Safety First',
      subtitle: 'All riders are background-checked.\nCustomers can rate and review you.\nYour safety is our priority.',
    ),
  ];

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kCharcoal,
      body: SafeArea(
        child: Column(
          children: [
            // Skip
            Align(alignment: Alignment.topRight, child: Padding(
              padding: const EdgeInsets.all(16),
              child: TextButton(onPressed: () => context.go('/register'), child: const Text('Skip')),
            )),

            Expanded(
              child: PageView.builder(
                controller: _ctrl,
                onPageChanged: (i) => setState(() => _page = i),
                itemCount: _pages.length,
                itemBuilder: (_, i) => _pages[i],
              ),
            ),

            // Indicators + nav
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(children: [
                Row(mainAxisAlignment: MainAxisAlignment.center, children: List.generate(_pages.length, (i) =>
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    width: i == _page ? 24 : 8,
                    height: 8,
                    decoration: BoxDecoration(color: i == _page ? kGold : kBorder, borderRadius: BorderRadius.circular(4)),
                  ),
                )),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () {
                    if (_page < _pages.length - 1) {
                      _ctrl.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
                    } else {
                      context.go('/register');
                    }
                  },
                  child: Text(_page < _pages.length - 1 ? 'Next' : 'Get Started'),
                ),
              ]),
            ),
          ],
        ),
      ),
    );
  }
}

class _OnboardPage extends StatelessWidget {
  const _OnboardPage({required this.icon, required this.color, required this.title, required this.subtitle, this.isChecklist = false, this.highlight});
  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;
  final bool isChecklist;
  final String? highlight;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 32),
    child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      Container(
        width: 120, height: 120,
        decoration: BoxDecoration(color: color.withOpacity(0.12), shape: BoxShape.circle, border: Border.all(color: color.withOpacity(0.4), width: 2)),
        child: Icon(icon, color: color, size: 60),
      ).animate().scale(begin: const Offset(0.6, 0.6), curve: Curves.elasticOut, duration: 600.ms),

      const SizedBox(height: 32),

      Text(title, style: const TextStyle(color: kCream, fontSize: 26, fontWeight: FontWeight.w800), textAlign: TextAlign.center)
          .animate(delay: 200.ms).fadeIn(duration: 400.ms).slideY(begin: 0.3),

      const SizedBox(height: 16),

      if (highlight != null) ...[
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          decoration: BoxDecoration(color: kGold.withOpacity(0.15), borderRadius: BorderRadius.circular(30), border: Border.all(color: kGold.withOpacity(0.5))),
          child: Text(highlight!, style: const TextStyle(color: kGold, fontSize: 28, fontWeight: FontWeight.w800)),
        ),
        const SizedBox(height: 16),
      ],

      Text(subtitle, style: const TextStyle(color: kSubtext, fontSize: 14, height: 1.8), textAlign: TextAlign.center)
          .animate(delay: 300.ms).fadeIn(duration: 400.ms),
    ]),
  );
}
