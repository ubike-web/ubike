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
import '../../wallet/screens/wallet_screen.dart';
import '../../profile/screens/profile_screen.dart';
import '../../../features/auth/screens/splash_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    final pages = [
      const _HomeTab(),
      const _HistoryTab(),
      const WalletScreen(),
      const ProfileScreen(),
    ];
    return Scaffold(
      body: IndexedStack(index: _tab, children: pages),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: kWhite,
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 16, offset: const Offset(0, -4))],
        ),
        child: BottomNavigationBar(
          currentIndex: _tab,
          onTap: (i) => setState(() => _tab = i),
          backgroundColor: kWhite,
          selectedItemColor: kOcean,
          unselectedItemColor: kGrey,
          elevation: 0,
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.home_outlined), activeIcon: Icon(Icons.home), label: 'Home'),
            BottomNavigationBarItem(icon: Icon(Icons.history_outlined), activeIcon: Icon(Icons.history), label: 'History'),
            BottomNavigationBarItem(icon: Icon(Icons.account_balance_wallet_outlined), activeIcon: Icon(Icons.account_balance_wallet), label: 'Wallet'),
            BottomNavigationBarItem(icon: Icon(Icons.person_outline), activeIcon: Icon(Icons.person), label: 'Profile'),
          ],
        ),
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
  LatLng _center = const LatLng(-1.2921, 36.8219);
  bool _locating = true;
  final _mapCtrl = MapController();

  @override
  void initState() { super.initState(); _getLocation(); }

  Future<void> _getLocation() async {
    try {
      final perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) await Geolocator.requestPermission();
      final pos = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
      setState(() { _center = LatLng(pos.latitude, pos.longitude); _locating = false; });
      _mapCtrl.move(_center, 15);
    } catch (_) { setState(() => _locating = false); }
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
              // App bar
              Container(
                margin: const EdgeInsets.fromLTRB(12, 8, 12, 0),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: kWhite,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 12, offset: const Offset(0, 2))],
                ),
                child: Row(children: [
                  UbikeLogo(size: 32, color: kOcean),
                  const SizedBox(width: 8),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('Hello, ${(user?.fullName ?? 'Rider').split(' ').first}!',
                      style: const TextStyle(color: kDark, fontWeight: FontWeight.w600, fontSize: 13)),
                    Row(children: [
                      const Icon(Icons.location_on, color: kOcean, size: 12),
                      const SizedBox(width: 3),
                      const Text('Nairobi, Kenya', style: TextStyle(color: kGrey, fontSize: 11)),
                      if (_locating) ...[const SizedBox(width: 6), const SizedBox(width: 10, height: 10, child: CircularProgressIndicator(strokeWidth: 1.5, color: kOcean))],
                    ]),
                  ])),
                  GestureDetector(
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsScreen())),
                    child: Stack(children: [
                      Container(
                        width: 38, height: 38,
                        decoration: BoxDecoration(color: kOceanPale, shape: BoxShape.circle),
                        child: const Icon(Icons.notifications_outlined, color: kOcean, size: 20),
                      ),
                      Positioned(right: 6, top: 6, child: Container(width: 8, height: 8, decoration: const BoxDecoration(color: kError, shape: BoxShape.circle))),
                    ]),
                  ),
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: () => _mapCtrl.move(_center, 15),
                    child: Container(width: 38, height: 38, decoration: BoxDecoration(color: kOceanPale, shape: BoxShape.circle), child: const Icon(Icons.my_location, color: kOcean, size: 20)),
                  ),
                ]),
              ).animate().fadeIn(duration: 400.ms),

              const SizedBox(height: 8),

              // Search bar
              GestureDetector(
                onTap: () => context.push('/rides/search'),
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 12),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  decoration: BoxDecoration(
                    color: kWhite,
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 12, offset: const Offset(0, 2))],
                  ),
                  child: Row(children: [
                    const Icon(Icons.search, color: kOcean, size: 22),
                    const SizedBox(width: 10),
                    Text('Where do you want to go?', style: TextStyle(color: kGrey, fontSize: 15)),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(color: kOcean, borderRadius: BorderRadius.circular(8)),
                      child: const Text('Go', style: TextStyle(color: kWhite, fontSize: 12, fontWeight: FontWeight.w700)),
                    ),
                  ]),
                ),
              ).animate(delay: 100.ms).fadeIn(duration: 400.ms).slideY(begin: -0.2),
            ],
          ),
        ),

        // Bottom service sheet
        Positioned(bottom: 0, left: 0, right: 0, child: _ServiceSheet()),
      ],
    );
  }
}

class _ServiceSheet extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: kWhite,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 20, offset: const Offset(0, -4))],
      ),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        const SizedBox(height: 8),
        Container(width: 40, height: 4, decoration: BoxDecoration(color: kLightGrey, borderRadius: BorderRadius.circular(2))),
        const SizedBox(height: 16),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Column(children: [
            // Services
            GridView.count(
              crossAxisCount: 3,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              childAspectRatio: 1.0,
              children: [
                _ServiceTile(icon: Icons.electric_moped, label: 'Standard\nRide', color: kOcean, onTap: () => context.push('/rides/search')),
                _ServiceTile(icon: Icons.electric_bolt, label: 'Electric\nRide', color: const Color(0xFF2E7D32), onTap: () => context.push('/rides/search', extra: {'vehicleType': 'electric'})),
                _ServiceTile(icon: Icons.local_shipping, label: 'Errands', color: const Color(0xFFF57C00), onTap: () => context.push('/errands/request')),
                _ServiceTile(icon: Icons.card_membership, label: 'Commuter\nPlans', color: const Color(0xFF6A1B9A), onTap: () => context.push('/commuter')),
                _ServiceTile(icon: Icons.schedule, label: 'Scheduled\nTrip', color: const Color(0xFF00838F), onTap: () => context.push('/rides/search', extra: {'scheduled': true})),
                _ServiceTile(icon: Icons.business, label: 'Business', color: const Color(0xFF37474F), onTap: () {}),
              ],
            ),
            const SizedBox(height: 14),

            // Promo banner
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [kOcean, kOceanDeep], begin: Alignment.centerLeft, end: Alignment.centerRight),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(children: [
                const Icon(Icons.local_offer_outlined, color: kWhite, size: 24),
                const SizedBox(width: 12),
                const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('First ride FREE!', style: TextStyle(color: kWhite, fontWeight: FontWeight.w700, fontSize: 13)),
                  Text('Use code: UBIKE1 on your first booking', style: TextStyle(color: Colors.white70, fontSize: 11)),
                ])),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(color: kWhite, borderRadius: BorderRadius.circular(8)),
                  child: const Text('Claim', style: TextStyle(color: kOcean, fontWeight: FontWeight.w700, fontSize: 12)),
                ),
              ]),
            ),
            const SizedBox(height: 18),
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
    child: Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withOpacity(0.25)),
      ),
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Container(
          width: 40, height: 40,
          decoration: BoxDecoration(color: color.withOpacity(0.12), shape: BoxShape.circle),
          child: Icon(icon, color: color, size: 22),
        ),
        const SizedBox(height: 6),
        Text(label, textAlign: TextAlign.center, style: TextStyle(color: color, fontSize: 10.5, fontWeight: FontWeight.w600, height: 1.2)),
      ]),
    ),
  );
}

class _HistoryTab extends StatelessWidget {
  const _HistoryTab();
  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: kWhite,
    appBar: AppBar(title: const Text('Ride History'), backgroundColor: kWhite, foregroundColor: kDark),
    body: Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      Icon(Icons.history, size: 64, color: kLightGrey),
      const SizedBox(height: 16),
      Text('No rides yet', style: TextStyle(color: kGrey, fontSize: 16, fontWeight: FontWeight.w600)),
      const SizedBox(height: 8),
      Text('Your ride history will appear here', style: TextStyle(color: kGrey, fontSize: 13)),
    ])),
  );
}
