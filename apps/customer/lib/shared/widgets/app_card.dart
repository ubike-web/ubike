import 'package:flutter/material.dart';
import '../../core/theme.dart';

class AppCard extends StatelessWidget {
  const AppCard({super.key, required this.child, this.padding, this.onTap, this.color, this.margin});
  final Widget child;
  final EdgeInsets? padding;
  final VoidCallback? onTap;
  final Color? color;
  final EdgeInsets? margin;

  @override
  Widget build(BuildContext context) {
    final surface = Theme.of(context).colorScheme.surface;
    return Container(
      margin: margin,
      decoration: BoxDecoration(
        color: color ?? surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: kBorder.withOpacity(0.4)),
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(padding: padding ?? const EdgeInsets.all(16), child: child),
        ),
      ),
    );
  }
}

class GoldCard extends StatelessWidget {
  const GoldCard({super.key, required this.child, this.padding});
  final Widget child;
  final EdgeInsets? padding;

  @override
  Widget build(BuildContext context) => Container(
    padding: padding ?? const EdgeInsets.all(16),
    decoration: BoxDecoration(
      gradient: LinearGradient(colors: [kGold, kGoldDark], begin: Alignment.topLeft, end: Alignment.bottomRight),
      borderRadius: BorderRadius.circular(16),
    ),
    child: child,
  );
}

class InfoRow extends StatelessWidget {
  const InfoRow({super.key, required this.label, required this.value, this.valueColor});
  final String label;
  final String value;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) => Row(
    mainAxisAlignment: MainAxisAlignment.spaceBetween,
    children: [
      Text(label, style: const TextStyle(color: kSubtext, fontSize: 13)),
      Text(value, style: TextStyle(color: valueColor ?? kCream, fontWeight: FontWeight.w600, fontSize: 13)),
    ],
  );
}
