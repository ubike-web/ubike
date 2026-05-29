import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme.dart';
import '../auth/providers/auth_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: kGold.withOpacity(0.15),
                shape: BoxShape.circle,
                border: Border.all(color: kGold, width: 2),
              ),
              child: const Icon(Icons.person, color: kGold, size: 40),
            ),
            const SizedBox(height: 12),
            Text(
              auth.userId ?? 'Customer',
              style: const TextStyle(color: kOnSurface, fontSize: 18, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 4),
            const Text('Customer Account', style: TextStyle(color: Color(0xFF8B8578))),

            const SizedBox(height: 32),

            _ProfileTile(icon: Icons.history, label: 'Ride History', onTap: () {}),
            _ProfileTile(icon: Icons.receipt_long, label: 'Errand History', onTap: () {}),
            _ProfileTile(icon: Icons.account_balance_wallet_outlined, label: 'Wallet', onTap: () {}),
            _ProfileTile(icon: Icons.redeem, label: 'Refer & Earn', onTap: () {}),
            _ProfileTile(icon: Icons.help_outline, label: 'Help & Support', onTap: () {}),
            _ProfileTile(icon: Icons.settings_outlined, label: 'Settings', onTap: () {}),

            const SizedBox(height: 24),

            OutlinedButton(
              onPressed: () async {
                await ref.read(authProvider.notifier).logout();
                if (context.mounted) context.go('/welcome');
              },
              style: OutlinedButton.styleFrom(foregroundColor: kSienna, side: const BorderSide(color: kSienna)),
              child: const Text('Sign Out'),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProfileTile extends StatelessWidget {
  const _ProfileTile({required this.icon, required this.label, required this.onTap});
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: kSurface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF4A4540)),
      ),
      child: ListTile(
        leading: Icon(icon, color: kGold, size: 22),
        title: Text(label, style: const TextStyle(color: kOnSurface, fontSize: 14)),
        trailing: const Icon(Icons.chevron_right, color: Color(0xFF6B6660)),
        onTap: onTap,
      ),
    );
  }
}
