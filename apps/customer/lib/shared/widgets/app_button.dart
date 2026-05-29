import 'package:flutter/material.dart';
import '../../core/theme.dart';

class AppButton extends StatelessWidget {
  const AppButton({super.key, required this.label, required this.onPressed, this.loading = false, this.color, this.textColor, this.icon, this.outlined = false});
  final String label;
  final VoidCallback? onPressed;
  final bool loading;
  final Color? color;
  final Color? textColor;
  final IconData? icon;
  final bool outlined;

  @override
  Widget build(BuildContext context) {
    final bg = color ?? kGold;
    final fg = textColor ?? kCharcoal;

    if (outlined) {
      return OutlinedButton.icon(
        onPressed: loading ? null : onPressed,
        icon: loading ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)) : (icon != null ? Icon(icon, size: 20) : const SizedBox.shrink()),
        label: Text(label),
        style: OutlinedButton.styleFrom(foregroundColor: bg, side: BorderSide(color: bg, width: 1.5)),
      );
    }

    return ElevatedButton(
      onPressed: loading ? null : onPressed,
      style: ElevatedButton.styleFrom(backgroundColor: bg, foregroundColor: fg),
      child: loading
          ? SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.5, color: fg))
          : Row(mainAxisSize: MainAxisSize.min, children: [
              if (icon != null) ...[Icon(icon, size: 20), const SizedBox(width: 8)],
              Text(label),
            ]),
    );
  }
}

class AppSmallButton extends StatelessWidget {
  const AppSmallButton({super.key, required this.label, required this.onPressed, this.color, this.textColor});
  final String label;
  final VoidCallback onPressed;
  final Color? color;
  final Color? textColor;

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: color ?? kGold,
        foregroundColor: textColor ?? kCharcoal,
        minimumSize: const Size(0, 40),
        padding: const EdgeInsets.symmetric(horizontal: 20),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
      ),
      child: Text(label),
    );
  }
}
