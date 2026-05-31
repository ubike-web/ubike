import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../core/theme.dart';

/// Spinning conic-gradient border card — inspired by the CSS .box reference
/// Background: dark navy/ocean. Border: animated cyan + ocean blue conic gradient.
class AnimatedAuthCard extends StatefulWidget {
  const AnimatedAuthCard({super.key, required this.child, this.width, this.height});
  final Widget child;
  final double? width;
  final double? height;

  @override
  State<AnimatedAuthCard> createState() => _AnimatedAuthCardState();
}

class _AnimatedAuthCardState extends State<AnimatedAuthCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    )..repeat();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _ctrl,
      builder: (_, child) {
        return CustomPaint(
          painter: _ConicBorderPainter(angle: _ctrl.value * math.pi * 2),
          child: Container(
            width: widget.width,
            height: widget.height,
            margin: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: const Color(0xFF0A1A2E),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFF0A1A2E), width: 2),
            ),
            child: child,
          ),
        );
      },
      child: widget.child,
    );
  }
}

class _ConicBorderPainter extends CustomPainter {
  const _ConicBorderPainter({required this.angle});
  final double angle;

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Rect.fromLTWH(0, 0, size.width, size.height);
    final rrect = RRect.fromRectAndRadius(rect, const Radius.circular(22));

    // Layer 1: Ocean blue conic
    final paint1 = Paint()
      ..shader = SweepGradient(
        startAngle: angle,
        endAngle: angle + math.pi * 2,
        colors: const [
          Color(0xFF0E86CA),
          Colors.transparent,
          Colors.transparent,
          Color(0xFF0E86CA),
        ],
        stops: const [0.0, 0.05, 0.45, 0.5],
        tileMode: TileMode.repeated,
      ).createShader(rect)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 8)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3;

    canvas.drawRRect(rrect, paint1);

    // Layer 2: Cyan conic (offset by -1 second = 90deg)
    final paint2 = Paint()
      ..shader = SweepGradient(
        startAngle: angle + math.pi / 2,
        endAngle: angle + math.pi * 2 + math.pi / 2,
        colors: const [
          Color(0xFF42C8F5),
          Colors.transparent,
          Colors.transparent,
          Color(0xFF42C8F5),
        ],
        stops: const [0.0, 0.05, 0.45, 0.5],
        tileMode: TileMode.repeated,
      ).createShader(rect)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 6)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;

    canvas.drawRRect(rrect, paint2);
  }

  @override
  bool shouldRepaint(_ConicBorderPainter old) => old.angle != angle;
}
