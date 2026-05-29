import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme.dart';
import '../../../core/api_client.dart';
import '../../../features/auth/providers/auth_provider.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});
  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  int _tab = 0;
  bool _online = false;
  Map<String, dynamic>? _earnings;
  Map<String, dynamic>? _activeRide;
  Timer? _locationTimer;
  Timer? _ridePoller;

  @override
  void initState() { super.initState(); _loadEarnings(); _checkActiveRide(); }
  @override
  void dispose() { _locationTimer?.cancel(); _ridePoller?.cancel(); super.dispose(); }

  Future<void> _loadEarnings() async {
    try {
      final data = await api.get('/riders/earnings');
      setState(() => _earnings = data as Map<String, dynamic>);
    } catch (_) {}
  }

  Future<void> _checkActiveRide() async {
    _ridePoller = Timer.periodic(const Duration(seconds: 5), (_) async {
      if (!_online) return;
      // Poll for incoming ride requests
    });
  }

  Future<void> _toggleOnline(bool val) async {
    final user = ref.read(authProvider).user;
    if (user != null && !user.isKycVerified && val) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('KYC verification required before going online'), backgroundColor: kWarning));
      return;
    }
    try {
      await api.patch('/riders/availability', data: {'available': val});
      setState(() => _online = val);
      if (val) _startLocationUpdates();
      else _locationTimer?.cancel();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e'), backgroundColor: kError));
    }
  }

  void _startLocationUpdates() {
    _locationTimer = Timer.periodic(const Duration(seconds: 10), (_) async {
      try {
        final pos = await Geolocator.getCurrentPosition();
        await api.post('/riders/location', data: {'lat': pos.latitude, 'lng': pos.longitude});
      } catch (_) {}
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;

    return Scaffold(
      body: IndexedStack(
        index: _tab,
        children: [
          _HomeTab(online: _online, onToggle: _toggleOnline, earnings: _earnings, user: user),
          const _RideHistoryTab(),
          const _WalletTab(),
          const _PerformanceTab(),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _tab,
        onTap: (i) => setState(() => _tab = i),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard_outlined), activeIcon: Icon(Icons.dashboard), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.history_outlined), activeIcon: Icon(Icons.history), label: 'Trips'),
          BottomNavigationBarItem(icon: Icon(Icons.account_balance_wallet_outlined), activeIcon: Icon(Icons.account_balance_wallet), label: 'Wallet'),
          BottomNavigationBarItem(icon: Icon(Icons.bar_chart_outlined), activeIcon: Icon(Icons.bar_chart), label: 'Stats'),
        ],
      ),
    );
  }
}

class _HomeTab extends StatelessWidget {
  const _HomeTab({required this.online, required this.onToggle, required this.earnings, required this.user});
  final bool online;
  final ValueChanged<bool> onToggle;
  final Map<String, dynamic>? earnings;
  final dynamic user;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            pinned: true,
            backgroundColor: kCharcoalDark,
            expandedHeight: 180,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                padding: const EdgeInsets.all(20),
                child: SafeArea(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const SizedBox(height: 8),
                    Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('Hey, ${(user?.fullName ?? 'Rider').split(' ').first}!', style: const TextStyle(color: kCream, fontSize: 20, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 4),
                        Text(online ? '🟢 Online — accepting rides' : '🔴 Offline', style: TextStyle(color: online ? kSuccess : kSubtext, fontSize: 13)),
                      ]),
                      // Online toggle
                      GestureDetector(
                        onTap: () => onToggle(!online),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 300),
                          width: 70,
                          height: 36,
                          decoration: BoxDecoration(
                            color: online ? kSuccess : kBorder,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Stack(children: [
                            AnimatedPositioned(
                              duration: const Duration(milliseconds: 300),
                              left: online ? 36 : 4,
                              top: 4,
                              child: Container(width: 28, height: 28, decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle)),
                            ),
                          ]),
                        ),
                      ),
                    ]),
                  ]),
                ),
              ),
            ),
          ),

          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // Earnings cards
                Row(children: [
                  Expanded(child: _EarningCard(label: 'Today', value: 'KES ${earnings?['totalEarnings']?.toStringAsFixed(0) ?? '0'}', icon: Icons.today, color: kGold)),
                  const SizedBox(width: 12),
                  Expanded(child: _EarningCard(label: 'Pending', value: 'KES ${earnings?['pendingEarnings']?.toStringAsFixed(0) ?? '0'}', icon: Icons.pending_outlined, color: kWarning)),
                ]).animate().fadeIn(duration: 400.ms),

                const SizedBox(height: 12),

                Row(children: [
                  Expanded(child: _EarningCard(label: 'Total Rides', value: '${earnings?['totalRides'] ?? 0}', icon: Icons.electric_moped, color: kBlue)),
                  const SizedBox(width: 12),
                  Expanded(child: _EarningCard(label: 'Rating', value: '${earnings?['rating'] ?? '—'} ⭐', icon: Icons.star_outline, color: kSuccess)),
                ]).animate(delay: 100.ms).fadeIn(duration: 400.ms),

                const SizedBox(height: 24),

                // Status banner
                if (!online) Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(color: kWarning.withOpacity(0.1), borderRadius: BorderRadius.circular(14), border: Border.all(color: kWarning.withOpacity(0.4))),
                  child: Row(children: [
                    const Icon(Icons.power_settings_new, color: kWarning, size: 24),
                    const SizedBox(width: 12),
                    const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('You\'re offline', style: TextStyle(color: kWarning, fontWeight: FontWeight.w700)),
                      Text('Toggle online to start receiving ride requests', style: TextStyle(color: kSubtext, fontSize: 12)),
                    ])),
                    TextButton(onPressed: () => onToggle(true), child: const Text('Go Online')),
                  ]),
                ).animate().fadeIn(duration: 300.ms)
                else Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(color: kSuccess.withOpacity(0.1), borderRadius: BorderRadius.circular(14), border: Border.all(color: kSuccess.withOpacity(0.4))),
                  child: const Row(children: [
                    Icon(Icons.sensors, color: kSuccess, size: 24),
                    SizedBox(width: 12),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('Looking for rides...', style: TextStyle(color: kSuccess, fontWeight: FontWeight.w700)),
                      Text('You\'ll be notified when a customer matches', style: TextStyle(color: kSubtext, fontSize: 12)),
                    ])),
                    SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2, color: kSuccess)),
                  ]),
                ).animate(onPlay: (c) => c.repeat(reverse: true)).shimmer(duration: 2000.ms, color: kSuccess.withOpacity(0.3)),

                const SizedBox(height: 24),

                // Quick actions
                const Text('Quick Actions', style: TextStyle(color: kCream, fontWeight: FontWeight.w600, fontSize: 15)),
                const SizedBox(height: 12),
                GridView.count(
                  crossAxisCount: 3,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  childAspectRatio: 1.1,
                  children: [
                    _QuickAction(icon: Icons.verified_user_outlined, label: 'KYC', color: kBlue, onTap: () => context.push('/kyc')),
                    _QuickAction(icon: Icons.support_agent, label: 'Support', color: kSienna, onTap: () {}),
                    _QuickAction(icon: Icons.share, label: 'Refer', color: kGold, onTap: () {}),
                  ],
                ),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}

class _EarningCard extends StatelessWidget {
  const _EarningCard({required this.label, required this.value, required this.icon, required this.color});
  final String label, value;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(14), border: Border.all(color: color.withOpacity(0.3))),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Icon(icon, color: color, size: 22),
      const SizedBox(height: 8),
      Text(value, style: TextStyle(color: color, fontWeight: FontWeight.w800, fontSize: 16)),
      Text(label, style: const TextStyle(color: kSubtext, fontSize: 11)),
    ]),
  );
}

class _QuickAction extends StatelessWidget {
  const _QuickAction({required this.icon, required this.label, required this.color, required this.onTap});
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(12), border: Border.all(color: color.withOpacity(0.3))),
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(icon, color: color, size: 26),
        const SizedBox(height: 6),
        Text(label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600)),
      ]),
    ),
  );
}

class _RideHistoryTab extends StatelessWidget {
  const _RideHistoryTab();
  @override
  Widget build(BuildContext context) => Scaffold(appBar: AppBar(title: const Text('My Trips')), body: const Center(child: Text('Trip history', style: TextStyle(color: kSubtext))));
}

class _WalletTab extends StatelessWidget {
  const _WalletTab();
  @override
  Widget build(BuildContext context) => Scaffold(appBar: AppBar(title: const Text('Wallet')), body: const Center(child: Text('Wallet & withdrawals', style: TextStyle(color: kSubtext))));
}

class _PerformanceTab extends StatelessWidget {
  const _PerformanceTab();
  @override
  Widget build(BuildContext context) => Scaffold(appBar: AppBar(title: const Text('Performance')), body: const Center(child: Text('Stats & ratings', style: TextStyle(color: kSubtext))));
}
