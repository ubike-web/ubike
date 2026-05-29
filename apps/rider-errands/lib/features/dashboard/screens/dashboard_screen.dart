import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme.dart';
import '../../../core/api_client.dart';
import '../../auth/providers/auth_provider.dart';

class ErrandsDashboardScreen extends ConsumerStatefulWidget {
  const ErrandsDashboardScreen({super.key});
  @override
  ConsumerState<ErrandsDashboardScreen> createState() => _ErrandsDashboardScreenState();
}

class _ErrandsDashboardScreenState extends ConsumerState<ErrandsDashboardScreen> {
  int _tab = 0;
  bool _online = false;
  Map<String, dynamic>? _earnings;
  Timer? _locationTimer;

  @override
  void initState() { super.initState(); _loadEarnings(); }
  @override
  void dispose() { _locationTimer?.cancel(); super.dispose(); }

  Future<void> _loadEarnings() async {
    try { final d = await api.get('/riders/earnings'); setState(() => _earnings = d as Map<String, dynamic>); } catch (_) {}
  }

  Future<void> _toggleOnline(bool val) async {
    try {
      await api.patch('/riders/availability', data: {'available': val});
      setState(() => _online = val);
      if (val) { _locationTimer = Timer.periodic(const Duration(seconds: 10), (_) async { try { final p = await Geolocator.getCurrentPosition(); await api.post('/riders/location', data: {'lat': p.latitude, 'lng': p.longitude}); } catch (_) {} }); }
      else _locationTimer?.cancel();
    } catch (e) { ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e'), backgroundColor: kError)); }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    return Scaffold(
      body: IndexedStack(index: _tab, children: [
        _HomeTab(online: _online, onToggle: _toggleOnline, earnings: _earnings),
        const _HistoryTab(),
        const _WalletTab(),
      ]),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _tab,
        onTap: (i) => setState(() => _tab = i),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard_outlined), activeIcon: Icon(Icons.dashboard), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.history_outlined), activeIcon: Icon(Icons.history), label: 'Deliveries'),
          BottomNavigationBarItem(icon: Icon(Icons.account_balance_wallet_outlined), activeIcon: Icon(Icons.account_balance_wallet), label: 'Wallet'),
        ],
      ),
    );
  }
}

class _HomeTab extends StatelessWidget {
  const _HomeTab({required this.online, required this.onToggle, required this.earnings});
  final bool online;
  final ValueChanged<bool> onToggle;
  final Map<String, dynamic>? earnings;

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: const Text('Errands Dashboard'),
      actions: [
        Padding(padding: const EdgeInsets.only(right: 12), child: GestureDetector(
          onTap: () => onToggle(!online),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            width: 68, height: 34,
            decoration: BoxDecoration(color: online ? kSuccess : kBorder, borderRadius: BorderRadius.circular(20)),
            child: Stack(children: [
              AnimatedPositioned(duration: const Duration(milliseconds: 300), left: online ? 34 : 4, top: 4, child: Container(width: 26, height: 26, decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle))),
            ]),
          ),
        )),
      ],
    ),
    body: ListView(padding: const EdgeInsets.all(16), children: [
      // Status
      Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: online ? kSuccess.withOpacity(0.1) : kWarning.withOpacity(0.1), borderRadius: BorderRadius.circular(14), border: Border.all(color: online ? kSuccess.withOpacity(0.4) : kWarning.withOpacity(0.4))),
        child: Row(children: [
          Icon(online ? Icons.local_shipping : Icons.local_shipping_outlined, color: online ? kSuccess : kWarning, size: 28),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(online ? 'Online — Receiving errands' : 'Offline', style: TextStyle(color: online ? kSuccess : kWarning, fontWeight: FontWeight.w700)),
            Text(online ? 'You\'ll be notified of new delivery requests' : 'Go online to start receiving deliveries', style: const TextStyle(color: kSubtext, fontSize: 12)),
          ])),
          if (!online) TextButton(onPressed: () => onToggle(true), child: const Text('Go Online')),
        ]),
      ).animate().fadeIn(duration: 300.ms),

      const SizedBox(height: 16),

      // Stats
      Row(children: [
        Expanded(child: _Stat(label: 'Total Earnings', value: 'KES ${earnings?['totalEarnings']?.toStringAsFixed(0) ?? '0'}', color: kGold, icon: Icons.payments_outlined)),
        const SizedBox(width: 10),
        Expanded(child: _Stat(label: 'Deliveries', value: '${earnings?['totalRides'] ?? 0}', color: kSienna, icon: Icons.local_shipping)),
      ]).animate(delay: 100.ms).fadeIn(duration: 400.ms),

      const SizedBox(height: 10),

      Row(children: [
        Expanded(child: _Stat(label: 'Pending Pay', value: 'KES ${earnings?['pendingEarnings']?.toStringAsFixed(0) ?? '0'}', color: kWarning, icon: Icons.pending_outlined)),
        const SizedBox(width: 10),
        Expanded(child: _Stat(label: 'Rating', value: '${earnings?['rating'] ?? '—'} ⭐', color: kSuccess, icon: Icons.star_outline)),
      ]).animate(delay: 150.ms).fadeIn(duration: 400.ms),

      const SizedBox(height: 24),

      const Text('Quick Actions', style: TextStyle(color: kCream, fontWeight: FontWeight.w600, fontSize: 15)),
      const SizedBox(height: 12),
      Row(children: [
        Expanded(child: _Action(icon: Icons.verified_user_outlined, label: 'KYC Docs', color: kBlue, onTap: () => context.push('/kyc'))),
        const SizedBox(width: 10),
        Expanded(child: _Action(icon: Icons.history, label: 'History', color: kGold, onTap: () {})),
        const SizedBox(width: 10),
        Expanded(child: _Action(icon: Icons.support_agent, label: 'Support', color: kSienna, onTap: () {})),
      ]).animate(delay: 200.ms).fadeIn(duration: 400.ms),
    ]),
  );
}

class _Stat extends StatelessWidget {
  const _Stat({required this.label, required this.value, required this.color, required this.icon});
  final String label, value;
  final Color color;
  final IconData icon;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(14), border: Border.all(color: color.withOpacity(0.3))),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Icon(icon, color: color, size: 20),
      const SizedBox(height: 6),
      Text(value, style: TextStyle(color: color, fontWeight: FontWeight.w800, fontSize: 15)),
      Text(label, style: const TextStyle(color: kSubtext, fontSize: 10)),
    ]),
  );
}

class _Action extends StatelessWidget {
  const _Action({required this.icon, required this.label, required this.color, required this.onTap});
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
      child: Column(children: [Icon(icon, color: color, size: 24), const SizedBox(height: 6), Text(label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600))]),
    ),
  );
}

class _HistoryTab extends StatelessWidget {
  const _HistoryTab();
  @override
  Widget build(BuildContext context) => Scaffold(appBar: AppBar(title: const Text('Delivery History')), body: const Center(child: Text('Delivery history', style: TextStyle(color: kSubtext))));
}

class _WalletTab extends StatelessWidget {
  const _WalletTab();
  @override
  Widget build(BuildContext context) => Scaffold(appBar: AppBar(title: const Text('Wallet')), body: const Center(child: Text('Earnings & withdrawals', style: TextStyle(color: kSubtext))));
}
