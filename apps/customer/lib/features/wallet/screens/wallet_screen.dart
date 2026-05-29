import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/theme.dart';
import '../../../core/api_client.dart';
import '../../../core/utils/format_utils.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/loading_overlay.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});
  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  double _balance = 0;
  List<Map<String, dynamic>> _transactions = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final wallet = await api.get('/payments/wallet');
      final txns = await api.get('/payments/transactions');
      setState(() {
        _balance = ((wallet as Map<String, dynamic>)['balance'] as num? ?? 0).toDouble();
        _transactions = ((txns as Map<String, dynamic>)['data'] as List? ?? []).cast<Map<String, dynamic>>();
        _loading = false;
      });
    } catch (_) { setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Wallet')),
      body: _loading
        ? const Center(child: CircularProgressIndicator(color: kGold))
        : RefreshIndicator(
            color: kGold,
            onRefresh: _load,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(20),
              child: Column(children: [
                // Balance card
                GoldCard(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                      const Text('Wallet Balance', style: TextStyle(color: kCharcoal, fontSize: 13, fontWeight: FontWeight.w500)),
                      Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4), decoration: BoxDecoration(color: kCharcoal.withOpacity(0.2), borderRadius: BorderRadius.circular(20)), child: const Text('Active', style: TextStyle(color: kCharcoal, fontSize: 11, fontWeight: FontWeight.w600))),
                    ]),
                    const SizedBox(height: 12),
                    Text(formatKes(_balance), style: const TextStyle(color: kCharcoal, fontSize: 36, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 20),
                    Row(children: [
                      Expanded(child: _WalletAction(icon: Icons.add, label: 'Top Up', onTap: () => _showTopup())),
                      const SizedBox(width: 12),
                      Expanded(child: _WalletAction(icon: Icons.send, label: 'Send', onTap: () {})),
                      const SizedBox(width: 12),
                      Expanded(child: _WalletAction(icon: Icons.history, label: 'History', onTap: () {})),
                    ]),
                  ]),
                ).animate().fadeIn(duration: 400.ms).scale(begin: const Offset(0.95, 0.95)),

                const SizedBox(height: 24),

                // Loyalty points
                AppCard(
                  child: Row(children: [
                    Container(width: 44, height: 44, decoration: BoxDecoration(color: kGold.withOpacity(0.15), shape: BoxShape.circle), child: const Icon(Icons.stars_outlined, color: kGold, size: 24)),
                    const SizedBox(width: 14),
                    const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('Loyalty Points', style: TextStyle(color: kSubtext, fontSize: 12)),
                      Text('1,240 points', style: TextStyle(color: kGold, fontWeight: FontWeight.w700, fontSize: 18)),
                    ])),
                    TextButton(onPressed: () {}, child: const Text('Redeem')),
                  ]),
                ).animate(delay: 100.ms).fadeIn(duration: 400.ms),

                const SizedBox(height: 24),

                // Transactions
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  const Text('Transactions', style: TextStyle(color: kCream, fontSize: 16, fontWeight: FontWeight.w600)),
                  TextButton(onPressed: () {}, child: const Text('See all')),
                ]),
                const SizedBox(height: 12),

                if (_transactions.isEmpty)
                  EmptyState(icon: Icons.receipt_long_outlined, title: 'No transactions yet', subtitle: 'Your payment history will appear here')
                else
                  ..._transactions.take(10).map((t) => _TransactionTile(tx: t)).toList(),
              ]),
            ),
          ),
    );
  }

  void _showTopup() {
    showModalBottomSheet(context: context, isScrollControlled: true, builder: (_) => const _TopupSheet());
  }
}

class _WalletAction extends StatelessWidget {
  const _WalletAction({required this.icon, required this.label, required this.onTap});
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(color: kCharcoal.withOpacity(0.3), borderRadius: BorderRadius.circular(10)),
      child: Column(children: [
        Icon(icon, color: kCharcoal, size: 22),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(color: kCharcoal, fontSize: 11, fontWeight: FontWeight.w600)),
      ]),
    ),
  );
}

class _TransactionTile extends StatelessWidget {
  const _TransactionTile({required this.tx});
  final Map<String, dynamic> tx;

  @override
  Widget build(BuildContext context) {
    final type = tx['type'] as String? ?? '';
    final amount = (tx['amount'] as num? ?? 0).toDouble();
    final isCredit = type.contains('topup') || type.contains('refund') || type.contains('bonus');
    final icons = {'ride_payment': Icons.electric_moped, 'errand_payment': Icons.local_shipping, 'wallet_topup': Icons.add_circle_outline, 'refund': Icons.replay};

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: kCharcoalLight, borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorder.withOpacity(0.4))),
      child: Row(children: [
        Container(width: 40, height: 40, decoration: BoxDecoration(color: (isCredit ? kSuccess : kSienna).withOpacity(0.15), shape: BoxShape.circle), child: Icon(icons[type] ?? Icons.payment, color: isCredit ? kSuccess : kSienna, size: 20)),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(capitalizeWords(type), style: const TextStyle(color: kCream, fontSize: 13, fontWeight: FontWeight.w500)),
          Text(formatDate(tx['created_at'] as String? ?? ''), style: const TextStyle(color: kSubtext, fontSize: 11)),
        ])),
        Text('${isCredit ? '+' : '-'}${formatKes(amount)}', style: TextStyle(color: isCredit ? kSuccess : kSienna, fontWeight: FontWeight.w700)),
      ]),
    );
  }
}

class _TopupSheet extends StatefulWidget {
  const _TopupSheet();
  @override
  State<_TopupSheet> createState() => _TopupSheetState();
}

class _TopupSheetState extends State<_TopupSheet> {
  final _ctrl = TextEditingController();
  final _amounts = [500, 1000, 2000, 5000];

  @override
  Widget build(BuildContext context) => Padding(
    padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
    child: Container(
      padding: const EdgeInsets.all(24),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        const Text('Top Up Wallet', style: TextStyle(color: kCream, fontSize: 18, fontWeight: FontWeight.w700)),
        const SizedBox(height: 20),
        Wrap(spacing: 10, runSpacing: 10, children: _amounts.map((a) => GestureDetector(
          onTap: () => _ctrl.text = a.toString(),
          child: Container(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10), decoration: BoxDecoration(color: kGold.withOpacity(0.1), borderRadius: BorderRadius.circular(8), border: Border.all(color: kGold.withOpacity(0.4))), child: Text('KES $a', style: const TextStyle(color: kGold, fontWeight: FontWeight.w600))),
        )).toList()),
        const SizedBox(height: 16),
        TextField(controller: _ctrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Custom amount (KES)', prefixIcon: Icon(Icons.payments_outlined, color: kGold))),
        const SizedBox(height: 20),
        AppButton(label: 'Pay with Paystack', onPressed: () {}, icon: Icons.payment),
        const SizedBox(height: 8),
      ]),
    ),
  );
}
