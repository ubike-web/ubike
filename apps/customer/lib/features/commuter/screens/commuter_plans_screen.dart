import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/theme.dart';
import '../../../core/utils/format_utils.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_card.dart';

class CommuterPlansScreen extends StatefulWidget {
  const CommuterPlansScreen({super.key});
  @override
  State<CommuterPlansScreen> createState() => _CommuterPlansScreenState();
}

class _CommuterPlansScreenState extends State<CommuterPlansScreen> with SingleTickerProviderStateMixin {
  late TabController _tab;
  String _routeType = 'home_to_work';

  @override
  void initState() { super.initState(); _tab = TabController(length: 2, vsync: this); }
  @override
  void dispose() { _tab.dispose(); super.dispose(); }

  final _plans = [
    {'type': 'weekly', 'name': 'Weekly Plan', 'rides': 10, 'price': 1800, 'original': 2500, 'savings': 28},
    {'type': 'monthly', 'name': 'Monthly Plan', 'rides': 44, 'price': 6500, 'original': 11000, 'savings': 41},
  ];

  final _routes = [
    {'value': 'home_to_work', 'label': 'Home → Work', 'icon': Icons.home_work_outlined},
    {'value': 'work_to_home', 'label': 'Work → Home', 'icon': Icons.work_off_outlined},
    {'value': 'school', 'label': 'School Route', 'icon': Icons.school_outlined},
    {'value': 'business', 'label': 'Business Route', 'icon': Icons.business_outlined},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Commuter Plans'),
        bottom: TabBar(
          controller: _tab,
          indicatorColor: kGold,
          labelColor: kGold,
          unselectedLabelColor: kSubtext,
          tabs: const [Tab(text: 'Weekly'), Tab(text: 'Monthly')],
        ),
      ),
      body: Column(
        children: [
          // Route type selector
          Padding(
            padding: const EdgeInsets.all(16),
            child: SizedBox(
              height: 80,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _routes.length,
                separatorBuilder: (_, __) => const SizedBox(width: 10),
                itemBuilder: (_, i) {
                  final r = _routes[i];
                  final sel = _routeType == r['value'];
                  return GestureDetector(
                    onTap: () => setState(() => _routeType = r['value'] as String),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      width: 100,
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: sel ? kGold.withOpacity(0.15) : kCharcoalLight,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: sel ? kGold : kBorder),
                      ),
                      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                        Icon(r['icon'] as IconData, color: sel ? kGold : kSubtext, size: 22),
                        const SizedBox(height: 4),
                        Text(r['label'] as String, textAlign: TextAlign.center, style: TextStyle(color: sel ? kGold : kSubtext, fontSize: 10, fontWeight: FontWeight.w500)),
                      ]),
                    ),
                  );
                },
              ),
            ),
          ),

          Expanded(
            child: TabBarView(
              controller: _tab,
              children: [
                _PlanList(plans: _plans.where((p) => p['type'] == 'weekly').toList(), routeType: _routeType),
                _PlanList(plans: _plans.where((p) => p['type'] == 'monthly').toList(), routeType: _routeType),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PlanList extends StatelessWidget {
  const _PlanList({required this.plans, required this.routeType});
  final List<Map<String, dynamic>> plans;
  final String routeType;

  @override
  Widget build(BuildContext context) => ListView(
    padding: const EdgeInsets.all(16),
    children: [
      ...plans.map((p) => _PlanCard(plan: p, routeType: routeType).animate().fadeIn(duration: 400.ms).slideY(begin: 0.2)),
      const SizedBox(height: 20),
      // My subscriptions
      const Text('My Active Plans', style: TextStyle(color: kCream, fontSize: 16, fontWeight: FontWeight.w600)),
      const SizedBox(height: 12),
      const EmptyPlanCard(),
    ],
  );
}

class _PlanCard extends StatelessWidget {
  const _PlanCard({required this.plan, required this.routeType});
  final Map<String, dynamic> plan;
  final String routeType;

  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.only(bottom: 16),
    padding: const EdgeInsets.all(20),
    decoration: BoxDecoration(
      gradient: LinearGradient(colors: [kCharcoalLight, kCharcoalMid], begin: Alignment.topLeft, end: Alignment.bottomRight),
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: kGold.withOpacity(0.3)),
    ),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text(plan['name'] as String, style: const TextStyle(color: kCream, fontSize: 18, fontWeight: FontWeight.w700)),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(color: kSuccess.withOpacity(0.2), borderRadius: BorderRadius.circular(20), border: Border.all(color: kSuccess.withOpacity(0.4))),
          child: Text('Save ${plan['savings']}%', style: const TextStyle(color: kSuccess, fontSize: 12, fontWeight: FontWeight.w700)),
        ),
      ]),
      const SizedBox(height: 12),
      Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
        Text(formatKes((plan['price'] as int).toDouble()), style: const TextStyle(color: kGold, fontSize: 30, fontWeight: FontWeight.w800)),
        const SizedBox(width: 8),
        Padding(padding: const EdgeInsets.only(bottom: 4), child: Text(formatKes((plan['original'] as int).toDouble()), style: const TextStyle(color: kSubtext, fontSize: 14, decoration: TextDecoration.lineThrough))),
      ]),
      const SizedBox(height: 16),
      _Feature(icon: Icons.electric_moped, label: '${plan['rides']} rides included'),
      const SizedBox(height: 6),
      const _Feature(icon: Icons.discount_outlined, label: 'Fixed discounted pricing'),
      const SizedBox(height: 6),
      const _Feature(icon: Icons.autorenew, label: 'Auto-renewal available'),
      const SizedBox(height: 6),
      const _Feature(icon: Icons.pause_circle_outline, label: 'Pause or cancel anytime'),
      const SizedBox(height: 20),
      AppButton(
        label: 'Subscribe Now',
        onPressed: () => _checkout(context),
        icon: Icons.card_membership,
      ),
    ]),
  );

  void _checkout(BuildContext context) {
    showModalBottomSheet(context: context, isScrollControlled: true, builder: (_) => _CheckoutSheet(plan: plan));
  }
}

class _Feature extends StatelessWidget {
  const _Feature({required this.icon, required this.label});
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) => Row(children: [
    Icon(icon, color: kGold, size: 16),
    const SizedBox(width: 8),
    Text(label, style: const TextStyle(color: kSubtext, fontSize: 13)),
  ]);
}

class EmptyPlanCard extends StatelessWidget {
  const EmptyPlanCard();

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(20),
    decoration: BoxDecoration(color: kCharcoalLight, borderRadius: BorderRadius.circular(16), border: Border.all(color: kBorder.withOpacity(0.4))),
    child: const Column(children: [
      Icon(Icons.card_membership_outlined, color: kSubtext, size: 40),
      SizedBox(height: 12),
      Text('No active plans', style: TextStyle(color: kCream, fontWeight: FontWeight.w600)),
      SizedBox(height: 4),
      Text('Subscribe to a plan to start saving', style: TextStyle(color: kSubtext, fontSize: 12)),
    ]),
  );
}

class _CheckoutSheet extends StatelessWidget {
  const _CheckoutSheet({required this.plan});
  final Map<String, dynamic> plan;

  @override
  Widget build(BuildContext context) => Container(
    padding: EdgeInsets.fromLTRB(24, 24, 24, 24 + MediaQuery.of(context).viewInsets.bottom),
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      Text('Confirm ${plan['name']}', style: const TextStyle(color: kCream, fontSize: 18, fontWeight: FontWeight.w700)),
      const SizedBox(height: 20),
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        const Text('Plan', style: TextStyle(color: kSubtext)),
        Text(plan['name'] as String, style: const TextStyle(color: kCream, fontWeight: FontWeight.w600)),
      ]),
      const SizedBox(height: 8),
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        const Text('Rides', style: TextStyle(color: kSubtext)),
        Text('${plan['rides']} rides', style: const TextStyle(color: kCream, fontWeight: FontWeight.w600)),
      ]),
      const SizedBox(height: 8),
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        const Text('Total', style: TextStyle(color: kSubtext)),
        Text(formatKes((plan['price'] as int).toDouble()), style: const TextStyle(color: kGold, fontWeight: FontWeight.w800, fontSize: 18)),
      ]),
      const SizedBox(height: 20),
      AppButton(label: 'Pay with Paystack', onPressed: () { Navigator.pop(context); }, icon: Icons.payment),
    ]),
  );
}
