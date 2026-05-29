import 'package:flutter/material.dart';
import '../../../core/theme.dart';
import '../../../core/utils/format_utils.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  // Demo notifications
  static final _items = [
    {'title': 'Ride completed!', 'body': 'Your ride to Westlands has been completed. Rate your rider.', 'type': 'ride', 'time': '2026-05-29T10:30:00Z', 'read': false},
    {'title': 'OTP Verified', 'body': 'You have successfully logged in to u-bike.', 'type': 'auth', 'time': '2026-05-29T09:00:00Z', 'read': true},
    {'title': 'Special Offer!', 'body': 'Get 20% off your next 3 rides. Use code: SAVE20', 'type': 'promo', 'time': '2026-05-28T15:00:00Z', 'read': false},
    {'title': 'Rider on the way', 'body': 'Your rider will arrive in approximately 5 minutes.', 'type': 'ride', 'time': '2026-05-28T14:00:00Z', 'read': true},
  ];

  static const _icons = {
    'ride': Icons.electric_moped,
    'auth': Icons.security,
    'promo': Icons.local_offer,
    'errand': Icons.local_shipping,
  };

  static const _colors = {
    'ride': kGold,
    'auth': kBlue,
    'promo': kSuccess,
    'errand': kSienna,
  };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [TextButton(onPressed: () {}, child: const Text('Mark all read'))],
      ),
      body: _items.isEmpty
        ? const Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            Icon(Icons.notifications_none, color: kSubtext, size: 64),
            SizedBox(height: 16),
            Text('No notifications', style: TextStyle(color: kSubtext)),
          ]))
        : ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: _items.length,
            itemBuilder: (_, i) {
              final n = _items[i];
              final type = n['type'] as String;
              final isRead = n['read'] as bool;
              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: isRead ? kCharcoalLight : kGold.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: isRead ? kBorder.withOpacity(0.3) : kGold.withOpacity(0.3)),
                ),
                child: Row(children: [
                  Container(
                    width: 44, height: 44,
                    decoration: BoxDecoration(color: (_colors[type] ?? kGold).withOpacity(0.15), shape: BoxShape.circle),
                    child: Icon(_icons[type] ?? Icons.notifications, color: _colors[type] ?? kGold, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(children: [
                      Expanded(child: Text(n['title'] as String, style: TextStyle(color: kCream, fontWeight: isRead ? FontWeight.w500 : FontWeight.w700, fontSize: 14))),
                      if (!isRead) Container(width: 8, height: 8, decoration: const BoxDecoration(color: kGold, shape: BoxShape.circle)),
                    ]),
                    const SizedBox(height: 4),
                    Text(n['body'] as String, style: const TextStyle(color: kSubtext, fontSize: 12, height: 1.4)),
                    const SizedBox(height: 6),
                    Text(timeAgo(n['time'] as String), style: const TextStyle(color: kSubtext, fontSize: 11)),
                  ])),
                ]),
              );
            },
          ),
    );
  }
}
