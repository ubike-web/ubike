import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'dart:async';
import '../../../core/api_client.dart';
import '../../../core/theme.dart';

class CaptainHomeScreen extends StatefulWidget {
  const CaptainHomeScreen({super.key});

  @override
  State<CaptainHomeScreen> createState() => _CaptainHomeScreenState();
}

class _CaptainHomeScreenState extends State<CaptainHomeScreen> {
  int _tab = 0;
  Map<String, dynamic>? _captain;
  bool _connected = true; // tracked to re-ping on reconnect
  StreamSubscription? _connectivitySub;
  bool _offlineDialogShown = false;

  @override
  void initState() {
    super.initState();
    _load();
    _startConnectivityWatch();
  }

  Future<void> _load() async {
    try {
      final data = await ApiClient.instance.get('/users/me');
      if (mounted) setState(() => _captain = data);
      // Auto-set captain online immediately on login
      _setOnline();
    } catch (_) {}
  }

  Future<void> _setOnline() async {
    try {
      await ApiClient.instance.post('/captain/toggle-online', data: {'is_online': true});
    } catch (_) {}
  }

  void _startConnectivityWatch() {
    _connectivitySub = Connectivity().onConnectivityChanged.listen((results) {
      final hasConnection = results.any((r) => r != ConnectivityResult.none);
      if (mounted) {
        setState(() => _connected = hasConnection);
        if (!hasConnection) {
          _showOfflineBlocker();
        } else if (_offlineDialogShown) {
          _offlineDialogShown = false;
          Navigator.of(context, rootNavigator: true).pop();
          _setOnline();
        }
      }
    });
  }

  void _showOfflineBlocker() {
    if (_offlineDialogShown) return;
    _offlineDialogShown = true;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => PopScope(
        canPop: false,
        child: AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Row(children: [
            Icon(Icons.wifi_off, color: AppTheme.error, size: 28),
            SizedBox(width: 12),
            Text('No Connection'),
          ]),
          content: const Text(
            'You must stay connected to receive ride requests.\n\nPlease turn your data or WiFi back on to continue working.',
            style: TextStyle(height: 1.5),
          ),
          actions: [
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
              onPressed: () {
                // Open WiFi/data settings
                SystemNavigator.pop();
              },
              child: const Text('Open Settings'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _connectivitySub?.cancel();
    super.dispose();
  }

  Future<void> _logout() async {
    await ApiClient.instance.logout();
    if (mounted) context.go('/');
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        final exit = await showDialog<bool>(
          context: context,
          builder: (_) => AlertDialog(
            title: const Text('Exit U-bike?'),
            content: const Text('You will be set offline. Are you sure you want to exit?'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: AppTheme.error),
                onPressed: () => Navigator.pop(context, true),
                child: const Text('Exit'),
              ),
            ],
          ),
        );
        if (exit == true && mounted) SystemNavigator.pop();
      },
      child: Scaffold(
        body: IndexedStack(
          index: _tab,
          children: [
            _DashboardTab(captain: _captain),
            _EarningsTab(captain: _captain),
            _ProfileTab(captain: _captain, onLogout: _logout),
          ],
        ),
        bottomNavigationBar: BottomNavigationBar(
          currentIndex: _tab,
          onTap: (i) => setState(() => _tab = i),
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.dashboard_outlined), activeIcon: Icon(Icons.dashboard), label: 'Dashboard'),
            BottomNavigationBarItem(icon: Icon(Icons.account_balance_wallet_outlined), activeIcon: Icon(Icons.account_balance_wallet), label: 'Earnings'),
            BottomNavigationBarItem(icon: Icon(Icons.person_outline), activeIcon: Icon(Icons.person), label: 'Profile'),
          ],
        ),
      ),
    );
  }
}

// ── Dashboard Tab ─────────────────────────────────────────────────────────────

class _DashboardTab extends StatelessWidget {
  final Map<String, dynamic>? captain;
  const _DashboardTab({required this.captain});

  @override
  Widget build(BuildContext context) {
    final name = captain?['full_name'] ?? 'Captain';
    final status = captain?['status'] ?? 'pending';
    final isApproved = status == 'approved' || status == 'active';
    final vehicleType = captain?['vehicle_type'] ?? '';
    final vehicleLabel = _vehicleLabel(vehicleType);

    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Hello Captain,', style: const TextStyle(color: AppTheme.textSecondary, fontSize: 14)),
                Text(name.split(' ').first, style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: AppTheme.textPrimary)),
              ])),
              // Always online indicator — no toggle
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: isApproved ? AppTheme.success : Colors.orange,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(children: [
                  Container(width: 8, height: 8, decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle)),
                  const SizedBox(width: 6),
                  Text(isApproved ? 'Online' : 'Pending', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
                ]),
              ),
            ]),

            const SizedBox(height: 20),

            if (!isApproved)
              _PendingCard()
            else ...[
              // Active status card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [AppTheme.success, Color(0xFF2D9248)]),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Row(children: [
                    Icon(Icons.radio_button_checked, color: Colors.white, size: 18),
                    SizedBox(width: 8),
                    Text('You are Online', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 16)),
                  ]),
                  const SizedBox(height: 6),
                  const Text('Ready to receive ride & errand requests', style: TextStyle(color: Colors.white70, fontSize: 13)),
                  const SizedBox(height: 12),
                  if (vehicleLabel.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(20)),
                      child: Text(vehicleLabel, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
                    ),
                ]),
              ),

              const SizedBox(height: 20),

              // Stats
              Row(children: [
                Expanded(child: _StatCard(label: "Today's Rides", value: '0', icon: Icons.directions_bike)),
                const SizedBox(width: 12),
                Expanded(child: _StatCard(label: "Today's Earnings", value: 'KES 0', icon: Icons.attach_money)),
              ]),

              const SizedBox(height: 20),

              // Incoming requests placeholder
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 6)]),
                child: const Column(children: [
                  Icon(Icons.watch_later_outlined, size: 40, color: AppTheme.textSecondary),
                  SizedBox(height: 12),
                  Text('Waiting for requests...', style: TextStyle(fontWeight: FontWeight.w600, color: AppTheme.textPrimary, fontSize: 15)),
                  SizedBox(height: 4),
                  Text('Customers matching your vehicle type will appear here', style: TextStyle(color: AppTheme.textSecondary, fontSize: 13), textAlign: TextAlign.center),
                ]),
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _vehicleLabel(String vehicleType) {
    switch (vehicleType) {
      case 'bike_standard': return '🏍️ Standard Bike';
      case 'bike_electric': return '⚡ Electric Bike';
      case 'car_basic': return '🚗 Basic Car';
      case 'car_comfort': return '🚙 Comfort Car';
      case 'car_extra_large': return '🚐 Extra Large';
      case 'car_business': return '🚘 Business Car';
      default: return '';
    }
  }
}

class _PendingCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.orange.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.orange.withValues(alpha: 0.4)),
      ),
      child: Column(children: [
        const Icon(Icons.hourglass_top, color: Colors.orange, size: 48),
        const SizedBox(height: 16),
        const Text('Application Under Review', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppTheme.textPrimary), textAlign: TextAlign.center),
        const SizedBox(height: 10),
        const Text(
          'Your documents are being reviewed by our admin team.\n\nYou will receive a notification once approved.\nThis usually takes 1-2 business days.',
          style: TextStyle(color: AppTheme.textSecondary, fontSize: 14, height: 1.6),
          textAlign: TextAlign.center,
        ),
      ]),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;

  const _StatCard({required this.label, required this.value, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 6)]),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Icon(icon, color: AppTheme.primary, size: 24),
        const SizedBox(height: 12),
        Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppTheme.textPrimary)),
        Text(label, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
      ]),
    );
  }
}

// ── Earnings Tab ──────────────────────────────────────────────────────────────

class _EarningsTab extends StatelessWidget {
  final Map<String, dynamic>? captain;
  const _EarningsTab({required this.captain});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Earnings', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: AppTheme.textPrimary)),
            const SizedBox(height: 20),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [AppTheme.primary, AppTheme.primaryDark]),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Wallet Balance', style: TextStyle(color: Colors.white70, fontSize: 14)),
                const SizedBox(height: 8),
                Text('KES ${(captain?['wallet_balance'] ?? 0).toStringAsFixed(0)}', style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.w900)),
                const SizedBox(height: 16),
                const Text('Today: KES 0 · This week: KES 0', style: TextStyle(color: Colors.white70, fontSize: 13)),
              ]),
            ),
            const SizedBox(height: 24),
            const Center(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 40),
                child: Text('No earnings yet today.\nGo online and accept rides!', style: TextStyle(color: AppTheme.textSecondary, height: 1.6), textAlign: TextAlign.center),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Profile Tab ───────────────────────────────────────────────────────────────

class _ProfileTab extends StatelessWidget {
  final Map<String, dynamic>? captain;
  final VoidCallback onLogout;

  const _ProfileTab({required this.captain, required this.onLogout});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            const SizedBox(height: 16),
            CircleAvatar(
              radius: 48,
              backgroundColor: AppTheme.success.withValues(alpha: 0.15),
              child: Text(
                (captain?['full_name'] ?? 'C').substring(0, 1).toUpperCase(),
                style: const TextStyle(fontSize: 36, fontWeight: FontWeight.w700, color: AppTheme.success),
              ),
            ),
            const SizedBox(height: 12),
            Text(captain?['full_name'] ?? 'Captain', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
            Text(captain?['phone'] ?? '', style: const TextStyle(color: AppTheme.textSecondary)),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(color: AppTheme.success.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(20)),
              child: const Text('Captain · Always Online', style: TextStyle(color: AppTheme.success, fontWeight: FontWeight.w600)),
            ),
            const SizedBox(height: 32),
            ListTile(
              leading: const Icon(Icons.person_outline),
              title: const Text('Edit Profile'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {},
              contentPadding: const EdgeInsets.symmetric(horizontal: 4),
            ),
            ListTile(
              leading: const Icon(Icons.history),
              title: const Text('Ride History'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {},
              contentPadding: const EdgeInsets.symmetric(horizontal: 4),
            ),
            ListTile(
              leading: const Icon(Icons.star_outline),
              title: const Text('My Ratings'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {},
              contentPadding: const EdgeInsets.symmetric(horizontal: 4),
            ),
            const Divider(height: 32),
            ListTile(
              leading: const Icon(Icons.logout, color: AppTheme.error),
              title: const Text('Log Out', style: TextStyle(color: AppTheme.error)),
              onTap: onLogout,
              contentPadding: const EdgeInsets.symmetric(horizontal: 4),
            ),
            const SizedBox(height: 16),
            const Text('U-bike v1.0.0', style: TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
          ],
        ),
      ),
    );
  }
}
