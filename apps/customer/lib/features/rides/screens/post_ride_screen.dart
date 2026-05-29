import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme.dart';
import '../../../core/api_client.dart';
import '../../../core/utils/format_utils.dart';
import '../../../shared/widgets/app_button.dart';

class PostRideScreen extends StatefulWidget {
  const PostRideScreen({super.key, required this.rideId, required this.fare});
  final String rideId;
  final double fare;

  @override
  State<PostRideScreen> createState() => _PostRideScreenState();
}

class _PostRideScreenState extends State<PostRideScreen> {
  int _rating = 0;
  final _reviewCtrl = TextEditingController();
  double _tip = 0;
  bool _submitting = false;

  final _tips = [0.0, 50.0, 100.0, 200.0];

  @override
  void dispose() { _reviewCtrl.dispose(); super.dispose(); }

  Future<void> _submit() async {
    setState(() => _submitting = true);
    try {
      if (_rating > 0) {
        await api.post('/rides/${widget.rideId}/rate', data: {'rating': _rating});
      }
    } catch (_) {}
    if (mounted) context.go('/home');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const SizedBox(height: 20),

              // Success animation
              Container(
                width: 100, height: 100,
                decoration: BoxDecoration(color: kSuccess.withOpacity(0.15), shape: BoxShape.circle, border: Border.all(color: kSuccess, width: 2)),
                child: const Icon(Icons.check_circle_outline, color: kSuccess, size: 56),
              ).animate().scale(begin: const Offset(0, 0), curve: Curves.elasticOut, duration: 700.ms),

              const SizedBox(height: 20),
              const Text('Ride Completed!', style: TextStyle(color: kCream, fontSize: 26, fontWeight: FontWeight.w800))
                .animate(delay: 300.ms).fadeIn(duration: 400.ms),

              const SizedBox(height: 8),
              Text('You arrived safely. Total: ${formatKes(widget.fare)}',
                style: const TextStyle(color: kSubtext, fontSize: 14))
                .animate(delay: 400.ms).fadeIn(duration: 400.ms),

              const SizedBox(height: 36),

              // Rating
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(color: kCharcoalLight, borderRadius: BorderRadius.circular(16), border: Border.all(color: kBorder.withOpacity(0.5))),
                child: Column(children: [
                  const Text('Rate your rider', style: TextStyle(color: kCream, fontSize: 16, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 16),
                  Row(mainAxisAlignment: MainAxisAlignment.center, children: List.generate(5, (i) =>
                    GestureDetector(
                      onTap: () => setState(() => _rating = i + 1),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 6),
                        child: Icon(i < _rating ? Icons.star_rounded : Icons.star_outline_rounded, color: kGold, size: 40)
                            .animate(target: i < _rating ? 1 : 0).scale(begin: const Offset(0.8, 0.8)),
                      ),
                    ),
                  )),
                  const SizedBox(height: 16),
                  if (_rating > 0) ...[
                    TextField(
                      controller: _reviewCtrl,
                      maxLines: 3,
                      decoration: const InputDecoration(hintText: 'Leave a review (optional)', labelText: 'Review'),
                    ),
                    const SizedBox(height: 12),
                  ],
                ]),
              ).animate(delay: 500.ms).fadeIn(duration: 400.ms).slideY(begin: 0.2),

              const SizedBox(height: 20),

              // Tip
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(color: kCharcoalLight, borderRadius: BorderRadius.circular(16), border: Border.all(color: kBorder.withOpacity(0.5))),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('Add a tip?', style: TextStyle(color: kCream, fontSize: 16, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  const Text('100% goes to your rider', style: TextStyle(color: kSubtext, fontSize: 12)),
                  const SizedBox(height: 14),
                  Row(children: _tips.map((t) => Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: GestureDetector(
                        onTap: () => setState(() => _tip = t),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            color: _tip == t ? kGold.withOpacity(0.2) : kCharcoal,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: _tip == t ? kGold : kBorder),
                          ),
                          child: Text(t == 0 ? 'None' : 'KES ${t.toInt()}',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: _tip == t ? kGold : kSubtext, fontSize: 12, fontWeight: FontWeight.w600)),
                        ),
                      ),
                    ),
                  )).toList()),
                ]),
              ).animate(delay: 600.ms).fadeIn(duration: 400.ms).slideY(begin: 0.2),

              const SizedBox(height: 32),

              AppButton(label: 'Done', onPressed: _submit, loading: _submitting, icon: Icons.check)
                .animate(delay: 700.ms).fadeIn(duration: 400.ms).slideY(begin: 0.2),

              const SizedBox(height: 12),

              Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                TextButton.icon(icon: const Icon(Icons.download_outlined, size: 18), label: const Text('Receipt'), onPressed: () {}),
                TextButton.icon(icon: const Icon(Icons.refresh, size: 18), label: const Text('Rebook'), onPressed: () => context.push('/rides/search')),
              ]),
            ],
          ),
        ),
      ),
    );
  }
}
