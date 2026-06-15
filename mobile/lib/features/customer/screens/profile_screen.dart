import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api_client.dart';
import '../../../core/theme.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? _user;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await ApiClient.instance.get('/users/me');
      if (mounted) setState(() { _user = data; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _logout() async {
    await ApiClient.instance.logout();
    if (mounted) context.go('/');
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  const SizedBox(height: 16),
                  CircleAvatar(
                    radius: 48,
                    backgroundColor: AppTheme.primary.withValues(alpha: 0.15),
                    backgroundImage: _user?['avatar_url'] != null ? NetworkImage(_user!['avatar_url']) : null,
                    child: _user?['avatar_url'] == null ? Text(
                      (_user?['full_name'] ?? 'U').substring(0, 1).toUpperCase(),
                      style: const TextStyle(fontSize: 36, fontWeight: FontWeight.w700, color: AppTheme.primary),
                    ) : null,
                  ),
                  const SizedBox(height: 12),
                  Text(_user?['full_name'] ?? 'User', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
                  Text(_user?['phone'] ?? '', style: const TextStyle(color: AppTheme.textSecondary)),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(color: AppTheme.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(20)),
                    child: const Text('Customer', style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w600)),
                  ),
                  const SizedBox(height: 24),
                  _ProfileTile(icon: Icons.person_outline, title: 'Edit Profile', onTap: () {}),
                  _ProfileTile(icon: Icons.history, title: 'Ride History', onTap: () {}),
                  _ProfileTile(icon: Icons.local_shipping_outlined, title: 'Errand History', onTap: () {}),
                  _ProfileTile(icon: Icons.notifications_outlined, title: 'Notifications', onTap: () {}),
                  _ProfileTile(icon: Icons.help_outline, title: 'Support', onTap: () {}),
                  const Divider(height: 32),
                  _ProfileTile(icon: Icons.logout, title: 'Log Out', onTap: _logout, color: AppTheme.error),
                  const SizedBox(height: 16),
                  const Text('U-bike v1.0.0', style: TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
                ],
              ),
            ),
    );
  }
}

class _ProfileTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback onTap;
  final Color? color;

  const _ProfileTile({required this.icon, required this.title, this.subtitle, required this.onTap, this.color});

  @override
  Widget build(BuildContext context) {
    final c = color ?? AppTheme.textPrimary;
    return ListTile(
      leading: Icon(icon, color: c),
      title: Text(title, style: TextStyle(color: c, fontWeight: FontWeight.w500)),
      subtitle: subtitle != null ? Text(subtitle!, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13)) : null,
      trailing: const Icon(Icons.chevron_right, color: AppTheme.textSecondary),
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 4),
    );
  }
}
