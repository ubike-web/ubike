import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/theme.dart';
import '../../../shared/widgets/map_widget.dart';
import '../../auth/providers/auth_provider.dart';
import '../../notifications/screens/notifications_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _tab = 0;

  final _pages = const [_HomeTab(), _HistoryTab(), _WalletTab(), _ProfileTab()];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _pages[_tab],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _tab,
        onTap: (i) => setState(() => _tab = i),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined), activeIcon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.history_outlined), activeIcon: Icon(Icons.history), label: 'History'),
          BottomNavigationBarItem(icon: Icon(Icons.account_balance_wallet_outlined), activeIcon: Icon(Icons.account_balance_wallet), label: 'Wallet'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline), activeIcon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}

class _HomeTab extends ConsumerStatefulWidget {
  const _HomeTab();
  @override
  ConsumerState<_HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends ConsumerState<_HomeTab> {
  LatLng _center = const LatLng(-1.2921, 36.8219); // Nairobi default
  bool _locating = true;
  final _mapCtrl = MapController();

  @override
  void initState() {
    super.initState();
    _getLocation();
  }

  Future<void> _getLocation() async {
    try {
      final perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) await Geolocator.requestPermission();
      final pos = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
      setState(() { _center = LatLng(pos.latitude, pos.longitude); _locating = false; });
      _mapCtrl.move(_center, 14.5);
    } catch (_) {
      setState(() => _locating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    return Stack(
      children: [
        // Full-screen map
        UbikeMap(center: _center, zoom: 14.5, controller: _mapCtrl),

        // Top bar
        SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(
                  children: [
                    // Greeting + location
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('Hello, ${(user?.fullName ?? 'Rider').split(' ').first} 👋',
                          style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500,
                            shadows: [Shadow(blurRadius: 6, color: Colors.black54)])),
                        Row(children: [
                          const Icon(Icons.location_on, color: kGold, size: 14),
                          const SizedBox(width: 4),
                          const Text('Nairobi, Kenya', style: TextStyle(color: Colors.white70, fontSize: 12,
                            shadows: [Shadow(blurRadius: 4, color: Colors.black54)])),
                          if (_locating) ...[const SizedBox(width: 6), const SizedBox(width: 10, height: 10, child: CircularProgressIndicator(strokeWidth: 1.5, color: kGold))],
                        ]),
                      ]),
                    ),
                    // Notification
                    _MapButton(
                      icon: Icons.notifications_outlined,
                      badge: true,
                      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsScreen())),
                    ),
                    const SizedBox(width: 8),
                    // My location
                    _MapButton(icon: Icons.my_location, onTap: () {
                      _mapCtrl.move(_center, 15);
                    }),
                  ],
                ),
              ).animate().fadeIn(duration: 400.ms),

              // Search bar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: GestureDetector(
                  onTap: () => context.push('/rides/search'),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 12, offset: const Offset(0, 4))],
                    ),
                    child: Row(children: [
                      const Icon(Icons.search, color: kGold, size: 22),
                      const SizedBox(width: 10),
                      Text('Where do you want to go?', style: TextStyle(color: Colors.grey[600], fontSize: 15)),
                    ]),
                  ),
                ),
              ).animate(delay: 100.ms).fadeIn(duration: 400.ms).slideY(begin: -0.2),
            ],
          ),
        ),

        // Bottom service sheet
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: _ServiceSheet(),
        ),
      ],
    );
  }
}

class _MapButton extends StatelessWidget {
  const _MapButton({required this.icon, required this.onTap, this.badge = false});
  final IconData icon;
  final VoidCallback onTap;
  final bool badge;

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      width: 42, height: 42,
      decoration: BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
        boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 8)],
      ),
      child: Stack(
        children: [
          Center(child: Icon(icon, color: kCharcoal, size: 22)),
          if (badge) Positioned(
            right: 8, top: 8,
            child: Container(width: 8, height: 8, decoration: const BoxDecoration(color: kSienna, shape: BoxShape.circle)),
          ),
        ],
      ),
    ),
  );
}

class _ServiceSheet extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: kCharcoal,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: [BoxShadow(color: Colors.black38, blurRadius: 20, offset: Offset(0, -4))],
      ),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        const SizedBox(height: 8),
        Container(width: 40, height: 4, decoration: BoxDecoration(color: kBorder, borderRadius: BorderRadius.circular(2))),
        const SizedBox(height: 16),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Column(children: [
            // Services grid
            GridView.count(
              crossAxisCount: 3,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              childAspectRatio: 1.05,
              children: [
                _ServiceTile(icon: Icons.electric_moped, label: 'Standard\nRide', color: kGold, onTap: () => context.push('/rides/search')),
                _ServiceTile(icon: Icons.electric_bolt, label: 'Electric\nRide', color: const Color(0xFF4CAF50), onTap: () => context.push('/rides/search', extra: {'vehicleType': 'electric'})),
                _ServiceTile(icon: Icons.local_shipping, label: 'Errands', color: kSienna, onTap: () => context.push('/errands/request')),
                _ServiceTile(icon: Icons.card_membership, label: 'Commuter\nPlans', color: kBlue, onTap: () => context.push('/commuter')),
                _ServiceTile(icon: Icons.schedule, label: 'Scheduled\nTrip', color: const Color(0xFF9C27B0), onTap: () => context.push('/rides/search', extra: {'scheduled': true})),
                _ServiceTile(icon: Icons.business, label: 'Business\nDelivery', color: const Color(0xFF607D8B), onTap: () => context.push('/errands/business')),
              ],
            ),
            const SizedBox(height: 16),

            // Promo banner
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [kGold.withOpacity(0.2), kGoldDark.withOpacity(0.15)]),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: kGold.withOpacity(0.4)),
              ),
              child: Row(children: [
                const Icon(Icons.local_offer, color: kGold, size: 28),
                const SizedBox(width: 12),
                const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('First ride FREE!', style: TextStyle(color: kGold, fontWeight: FontWeight.w700, fontSize: 14)),
                  Text('Use code: UBIKE1 on your first booking', style: TextStyle(color: kSubtext, fontSize: 12)),
                ])),
                TextButton(onPressed: () {}, child: const Text('Claim')),
              ]),
            ),
            const SizedBox(height: 20),
          ]),
        ),
      ]),
    ).animate().slideY(begin: 0.3, curve: Curves.easeOut, duration: 400.ms);
  }
}

class _ServiceTile extends StatelessWidget {
  const _ServiceTile({required this.icon, required this.label, required this.color, required this.onTap});
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 150),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(icon, color: color, size: 28),
        const SizedBox(height: 6),
        Text(label, textAlign: TextAlign.center, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600, height: 1.2)),
      ]),
    ),
  );
}

// Placeholder tabs
class _HistoryTab extends StatelessWidget {
  const _HistoryTab();
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Ride History')),
      body: const Center(child: Text('History loaded from /rides/mine', style: TextStyle(color: kSubtext))),
    );
  }
}

class _WalletTab extends StatelessWidget {
  const _WalletTab();
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Wallet')),
      body: const Center(child: Text('Wallet screen', style: TextStyle(color: kSubtext))),
    );
  }
}

class _ProfileTab extends StatelessWidget {
  const _ProfileTab();
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: const Center(child: Text('Profile screen', style: TextStyle(color: kSubtext))),
    );
  }
}
