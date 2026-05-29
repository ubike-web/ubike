import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';
import '../rides/screens/ride_request_screen.dart';
import '../errands/screens/errand_request_screen.dart';
import '../profile/profile_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  final _pages = const [
    _HomePage(),
    RideRequestScreen(),
    ErrandRequestScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _pages[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (i) => setState(() => _currentIndex = i),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined), activeIcon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.electric_moped_outlined), activeIcon: Icon(Icons.electric_moped), label: 'Ride'),
          BottomNavigationBarItem(icon: Icon(Icons.local_shipping_outlined), activeIcon: Icon(Icons.local_shipping), label: 'Errands'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline), activeIcon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}

class _HomePage extends StatelessWidget {
  const _HomePage();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('u-bike'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined, color: kGold),
            onPressed: () {},
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Good morning! 👋', style: TextStyle(color: Color(0xFF8B8578))),
            const SizedBox(height: 4),
            const Text('Where are you going?', style: TextStyle(color: kOnSurface, fontSize: 22, fontWeight: FontWeight.w700)),
            const SizedBox(height: 20),

            // Quick search
            GestureDetector(
              onTap: () => context.push('/ride/request'),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: kSurface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFF4A4540)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.search, color: kGold),
                    const SizedBox(width: 12),
                    const Text('Search destination...', style: TextStyle(color: Color(0xFF6B6660))),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),
            const Text('Our Services', style: TextStyle(color: kOnSurface, fontSize: 16, fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),

            Row(
              children: [
                Expanded(
                  child: _ServiceCard(
                    icon: Icons.electric_moped,
                    label: 'Ride',
                    subtitle: 'Get a boda boda',
                    color: kGold,
                    onTap: () => context.push('/ride/request'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _ServiceCard(
                    icon: Icons.local_shipping,
                    label: 'Errands',
                    subtitle: 'Send & receive',
                    color: kSienna,
                    onTap: () => context.push('/errand/request'),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 24),
            const Text('Recent Activity', style: TextStyle(color: kOnSurface, fontSize: 16, fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: kSurface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF4A4540)),
              ),
              child: const Center(
                child: Text('No recent trips', style: TextStyle(color: Color(0xFF6B6660))),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ServiceCard extends StatelessWidget {
  const _ServiceCard({required this.icon, required this.label, required this.subtitle, required this.color, required this.onTap});
  final IconData icon;
  final String label;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 32),
            const SizedBox(height: 12),
            Text(label, style: TextStyle(color: color, fontSize: 16, fontWeight: FontWeight.w600)),
            Text(subtitle, style: const TextStyle(color: Color(0xFF8B8578), fontSize: 12)),
          ],
        ),
      ),
    );
  }
}
