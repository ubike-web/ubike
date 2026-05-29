import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../../core/theme.dart';

class LoadingOverlay extends StatelessWidget {
  const LoadingOverlay({super.key, required this.loading, required this.child});
  final bool loading;
  final Widget child;

  @override
  Widget build(BuildContext context) => Stack(children: [
    child,
    if (loading) Container(
      color: Colors.black54,
      child: const Center(child: CircularProgressIndicator(color: kGold)),
    ),
  ]);
}

class ShimmerBox extends StatelessWidget {
  const ShimmerBox({super.key, this.height = 60, this.width, this.radius = 12});
  final double height;
  final double? width;
  final double radius;

  @override
  Widget build(BuildContext context) => Shimmer.fromColors(
    baseColor: kCharcoalLight,
    highlightColor: kCharcoalMid,
    child: Container(
      height: height,
      width: width ?? double.infinity,
      decoration: BoxDecoration(color: kCharcoalLight, borderRadius: BorderRadius.circular(radius)),
    ),
  );
}

class ShimmerList extends StatelessWidget {
  const ShimmerList({super.key, this.count = 4});
  final int count;

  @override
  Widget build(BuildContext context) => Column(children: List.generate(count, (_) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: ShimmerBox(height: 80),
  )));
}

class EmptyState extends StatelessWidget {
  const EmptyState({super.key, required this.icon, required this.title, this.subtitle, this.action});
  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? action;

  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(icon, size: 64, color: kSubtext),
        const SizedBox(height: 16),
        Text(title, style: const TextStyle(color: kCream, fontSize: 18, fontWeight: FontWeight.w600), textAlign: TextAlign.center),
        if (subtitle != null) ...[
          const SizedBox(height: 8),
          Text(subtitle!, style: const TextStyle(color: kSubtext, fontSize: 14), textAlign: TextAlign.center),
        ],
        if (action != null) ...[const SizedBox(height: 24), action!],
      ]),
    ),
  );
}
