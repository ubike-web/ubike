import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../../core/theme.dart';

/// Cat-style circular loader — 30 staggered segments spinning in a ring
class LoaderScreen extends StatefulWidget {
  const LoaderScreen({super.key, required this.onComplete});
  final VoidCallback onComplete;

  @override
  State<LoaderScreen> createState() => _LoaderScreenState();
}

class _LoaderScreenState extends State<LoaderScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(seconds: 2))
      ..repeat();

    // Auto-complete after 2.8 seconds
    Future.delayed(const Duration(milliseconds: 2800), () {
      if (mounted) widget.onComplete();
    });
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D1B2A),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SizedBox(
              width: 180,
              height: 180,
              child: AnimatedBuilder(
                animation: _ctrl,
                builder: (_, __) => CustomPaint(
                  painter: _CatLoaderPainter(progress: _ctrl.value),
                ),
              ),
            ),
            const SizedBox(height: 32),
            _PulsingText(),
          ],
        ),
      ),
    );
  }
}

class _CatLoaderPainter extends CustomPainter {
  const _CatLoaderPainter({required this.progress});
  final double progress;

  static const int _segments = 30;
  static const double _radius = 72;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final totalAngle = math.pi * 0.7; // fan spread
    final startAngle = -math.pi / 2 - totalAngle / 2;

    for (int i = 0; i < _segments; i++) {
      final t = i / (_segments - 1);
      final angle = startAngle + t * totalAngle;

      // Each segment has a staggered wave delay
      final delay = i * 0.02;
      final wave = math.sin((progress * math.pi * 2) - delay * math.pi * 2);
      final scale = 0.6 + 0.4 * ((wave + 1) / 2);

      // Head segment (index 0) — slightly larger
      final isHead = i == 0;
      final isTail = i == _segments - 1;

      final dx = center.dx + _radius * math.cos(angle);
      final dy = center.dy + _radius * math.sin(angle);
      final segOffset = Offset(dx, dy);

      final paint = Paint()
        ..style = PaintingStyle.fill
        ..color = _segmentColor(i, wave);

      final w = (isHead ? 18.0 : isTail ? 10.0 : 14.0) * scale;
      final h = (isHead ? 14.0 : isTail ? 8.0 : 10.0) * scale;

      canvas.save();
      canvas.translate(segOffset.dx, segOffset.dy);
      canvas.rotate(angle + math.pi / 2);

      final rect = Rect.fromCenter(center: Offset.zero, width: w, height: h);
      canvas.drawRRect(RRect.fromRectAndRadius(rect, Radius.circular(h / 2)), paint);

      // Cat face on head
      if (isHead) {
        _drawCatFace(canvas, wave, h);
      }

      canvas.restore();
    }
  }

  void _drawCatFace(Canvas canvas, double wave, double h) {
    final eyePaint = Paint()
      ..color = const Color(0xFF0A2D6E)
      ..style = PaintingStyle.fill;

    // Eyes
    canvas.drawCircle(const Offset(-4, -1), 2, eyePaint);
    canvas.drawCircle(const Offset(4, -1), 2, eyePaint);

    // Nose
    final nosePaint = Paint()..color = const Color(0xFFFF6B9D)..style = PaintingStyle.fill;
    canvas.drawCircle(const Offset(0, 2), 1.5, nosePaint);
  }

  Color _segmentColor(int i, double wave) {
    final brightness = 0.5 + 0.5 * ((wave + 1) / 2);
    final t = i / _segments;
    // Gradient from ocean deep to ocean light
    return Color.lerp(
      const Color(0xFF0E86CA).withOpacity(0.6 + 0.4 * brightness),
      const Color(0xFFFFFFFF).withOpacity(0.7 + 0.3 * brightness),
      t,
    )!;
  }

  @override
  bool shouldRepaint(_CatLoaderPainter old) => old.progress != progress;
}

class _PulsingText extends StatefulWidget {
  @override
  State<_PulsingText> createState() => _PulsingTextState();
}

class _PulsingTextState extends State<_PulsingText>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))..repeat(reverse: true);
    _anim = Tween(begin: 0.4, end: 1.0).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: _anim,
    builder: (_, __) => Opacity(
      opacity: _anim.value,
      child: const Text(
        'Loading',
        style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w300, letterSpacing: 4),
      ),
    ),
  );
}
