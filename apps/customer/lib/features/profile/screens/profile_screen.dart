import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme.dart';
import '../../../shared/widgets/app_card.dart';
import '../../auth/providers/auth_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 220,
            pinned: true,
            backgroundColor: kCharcoalDark,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: [kCharcoalDark, kCharcoal], begin: Alignment.topCenter, end: Alignment.bottomCenter),
                ),
                child: SafeArea(
                  child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                    CircleAvatar(
                      radius: 46,
                      backgroundColor: kGold.withOpacity(0.2),
                      backgroundImage: user?.avatarUrl != null ? CachedNetworkImageProvider(user!.avatarUrl!) : null,
                      child: user?.avatarUrl == null ? const Icon(Icons.person, color: kGold, size: 48) : null,
                    ),
                    const SizedBox(height: 12),
                    Text(user?.fullName ?? 'Customer', style: const TextStyle(color: kCream, fontSize: 20, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Text(user?.phone ?? user?.email ?? '', style: const TextStyle(color: kSubtext, fontSize: 13)),
                    const SizedBox(height: 8),
                    Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                      _StatBadge(label: 'Rides', value: '24'),
                      _StatBadge(label: 'Rating', value: '4.9 ⭐'),
                      _StatBadge(label: 'Points', value: user?.loyaltyPoints.toString() ?? '0'),
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
                // Referral card
                AppCard(
                  color: kGold.withOpacity(0.1),
                  child: Row(children: [
                    Container(width: 44, height: 44, decoration: BoxDecoration(color: kGold.withOpacity(0.2), shape: BoxShape.circle), child: const Icon(Icons.share, color: kGold, size: 22)),
                    const SizedBox(width: 14),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      const Text('Refer & Earn', style: TextStyle(color: kGold, fontWeight: FontWeight.w700)),
                      Text('Code: ${user?.referralCode ?? '—'}', style: const TextStyle(color: kSubtext, fontSize: 12)),
                    ])),
                    TextButton(onPressed: () {}, child: const Text('Share')),
                  ]),
                  margin: const EdgeInsets.only(bottom: 16),
                ),

                const _SectionHeader('Account'),
                _ProfileTile(icon: Icons.person_outline, label: 'Edit Profile', onTap: () {}),
                _ProfileTile(icon: Icons.location_on_outlined, label: 'Saved Addresses', onTap: () {}),
                _ProfileTile(icon: Icons.payment_outlined, label: 'Payment Methods', onTap: () {}),
                _ProfileTile(icon: Icons.emergency_outlined, label: 'Emergency Contacts', onTap: () {}),

                const _SectionHeader('Activity'),
                _ProfileTile(icon: Icons.history, label: 'Ride History', onTap: () => context.push('/history')),
                _ProfileTile(icon: Icons.receipt_long_outlined, label: 'Errand History', onTap: () {}),
                _ProfileTile(icon: Icons.card_membership_outlined, label: 'Commuter Plans', onTap: () => context.push('/commuter')),

                const _SectionHeader('Preferences'),
                _ProfileTile(icon: Icons.notifications_outlined, label: 'Notifications', onTap: () => context.push('/notifications')),
                _ProfileTile(icon: Icons.dark_mode_outlined, label: 'Dark / Light Mode', onTap: () {}, trailing: const Icon(Icons.chevron_right, color: kSubtext)),
                _ProfileTile(icon: Icons.language, label: 'Language', onTap: () {}, trailing: const Text('English', style: TextStyle(color: kSubtext, fontSize: 13))),

                const _SectionHeader('Support'),
                _ProfileTile(icon: Icons.help_outline, label: 'Help Center', onTap: () {}),
                _ProfileTile(icon: Icons.policy_outlined, label: 'Terms & Privacy', onTap: () {}),
                _ProfileTile(icon: Icons.info_outline, label: 'App Version', onTap: () {}, trailing: const Text('1.0.0', style: TextStyle(color: kSubtext, fontSize: 13))),

                const SizedBox(height: 16),
                // Logout
                GestureDetector(
                  onTap: () async {
                    await ref.read(authProvider.notifier).logout();
                    if (context.mounted) context.go('/welcome');
                  },
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(color: kSienna.withOpacity(0.1), borderRadius: BorderRadius.circular(12), border: Border.all(color: kSienna.withOpacity(0.3))),
                    child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                      Icon(Icons.logout, color: kSienna, size: 20),
                      SizedBox(width: 8),
                      Text('Sign Out', style: TextStyle(color: kSienna, fontWeight: FontWeight.w600, fontSize: 15)),
                    ]),
                  ),
                ),
                const SizedBox(height: 32),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatBadge extends StatelessWidget {
  const _StatBadge({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 12),
    child: Column(children: [
      Text(value, style: const TextStyle(color: kGold, fontWeight: FontWeight.w700, fontSize: 15)),
      Text(label, style: const TextStyle(color: kSubtext, fontSize: 11)),
    ]),
  );
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader(this.title);
  final String title;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(top: 20, bottom: 8),
    child: Text(title, style: const TextStyle(color: kSubtext, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1)),
  );
}

class _ProfileTile extends StatelessWidget {
  const _ProfileTile({required this.icon, required this.label, required this.onTap, this.trailing});
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.only(bottom: 4),
    decoration: BoxDecoration(color: kCharcoalLight, borderRadius: BorderRadius.circular(10), border: Border.all(color: kBorder.withOpacity(0.3))),
    child: ListTile(
      leading: Icon(icon, color: kGold, size: 20),
      title: Text(label, style: const TextStyle(color: kCream, fontSize: 14)),
      trailing: trailing ?? const Icon(Icons.chevron_right, color: kSubtext, size: 20),
      onTap: onTap,
      dense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
    ),
  );
}
