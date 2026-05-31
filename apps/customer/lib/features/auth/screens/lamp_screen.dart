import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/theme.dart';
import 'splash_screen.dart';

/// Interactive lamp: tap to light up → reveals U-bike logo → auto-navigates
class LampScreen extends StatefulWidget {
  const LampScreen({super.key, required this.onComplete});
  final VoidCallback onComplete;

  @override
  State<LampScreen> createState() => _LampScreenState();
}

class _LampScreenState extends State<LampScreen> with TickerProviderStateMixin {
  late AnimationController _lampCtrl;   // light on/off
  late AnimationController _cordCtrl;   // cord swing
  late AnimationController _logoCtrl;   // logo fade in
  bool _isOn = false;
  bool _hasBeenTapped = false;

  // Cord drag
  Offset _cordEnd = const Offset(0, 80);
  bool _isDragging = false;

  @override
  void initState() {
    super.initState();
    _lampCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 600));
    _cordCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 800));
    _logoCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 800));
  }

  @override
  void dispose() {
    _lampCtrl.dispose();
    _cordCtrl.dispose();
    _logoCtrl.dispose();
    super.dispose();
  }

  Future<void> _toggleLamp() async {
    if (_hasBeenTapped) return;
    _hasBeenTapped = true;

    // Animate cord swing
    await _cordCtrl.forward();
    _cordCtrl.reverse();

    // Light up
    setState(() => _isOn = true);
    await _lampCtrl.forward();

    // Show logo
    await _logoCtrl.forward();

    // Wait 3 seconds then navigate
    await Future.delayed(const Duration(seconds: 3));
    if (mounted) widget.onComplete();
  }

  @override
  Widget build(BuildContext context) {
    final lightOpacity = CurvedAnimation(parent: _lampCtrl, curve: Curves.easeOut);
    final logoOpacity = CurvedAnimation(parent: _logoCtrl, curve: Curves.easeIn);

    return Scaffold(
      backgroundColor: const Color(0xFF0D1B2A),
      body: Stack(
        children: [
          // Light beam when on
          AnimatedBuilder(
            animation: lightOpacity,
            builder: (_, __) => _isOn
              ? Positioned(
                  top: MediaQuery.of(context).size.height * 0.12,
                  left: 0, right: 0,
                  child: Opacity(
                    opacity: lightOpacity.value,
                    child: Container(
                      height: MediaQuery.of(context).size.height * 0.55,
                      decoration: BoxDecoration(
                        gradient: RadialGradient(
                          center: Alignment.topCenter,
                          radius: 0.9,
                          colors: [
                            const Color(0xFF42C8F5).withOpacity(0.25),
                            const Color(0xFF0E86CA).withOpacity(0.12),
                            Colors.transparent,
                          ],
                        ),
                      ),
                    ),
                  ),
                )
              : const SizedBox.shrink(),
          ),

          // Main content
          Column(
            children: [
              const SizedBox(height: 32),

              // Lamp
              Expanded(
                flex: 55,
                child: Center(
                  child: GestureDetector(
                    onTap: _toggleLamp,
                    child: AnimatedBuilder(
                      animation: _lampCtrl,
                      builder: (_, __) => CustomPaint(
                        size: const Size(240, 300),
                        painter: _LampPainter(
                          lightValue: _lampCtrl.value,
                          cordSwing: _cordCtrl.value,
                          isOn: _isOn,
                        ),
                      ),
                    ),
                  ),
                ),
              ),

              // Logo reveal below lamp
              Expanded(
                flex: 45,
                child: AnimatedBuilder(
                  animation: logoOpacity,
                  builder: (_, __) => Opacity(
                    opacity: logoOpacity.value,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // U-bike logo
                        UbikeLogo(size: 90, color: Colors.white),
                        const SizedBox(height: 14),
                        Text(
                          'U-BIKE',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 32,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 5,
                            shadows: [
                              Shadow(
                                color: const Color(0xFF42C8F5).withOpacity(0.8 * logoOpacity.value),
                                blurRadius: 20,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Rides • Errands • Deliveries',
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.7),
                            fontSize: 12,
                            letterSpacing: 2,
                          ),
                        ),
                        const SizedBox(height: 32),
                        if (!_hasBeenTapped) ...[
                          const SizedBox(height: 16),
                          Text('tap the lamp to begin', style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 12, letterSpacing: 1)),
                          const SizedBox(height: 8),
                          const _PullIndicator(),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),

          // Tap hint (before lamp is tapped)
          if (!_hasBeenTapped)
            Positioned(
              top: MediaQuery.of(context).size.height * 0.5,
              left: 0, right: 0,
              child: Center(
                child: Column(
                  children: [
                    Text(
                      'tap the lamp',
                      style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 12, letterSpacing: 2),
                    ),
                  ],
                ),
              ).animate(onPlay: (c) => c.repeat(reverse: true)).fadeIn(duration: 800.ms).then().fadeOut(duration: 800.ms),
            ),
        ],
      ),
    );
  }
}

// ─── Lamp Painter ────────────────────────────────────────────────────────────
class _LampPainter extends CustomPainter {
  const _LampPainter({required this.lightValue, required this.cordSwing, required this.isOn});
  final double lightValue;
  final double cordSwing;
  final bool isOn;

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // Ocean blue shade color, brightens when on
    final shadeColor = Color.lerp(const Color(0xFF0A2D6E), const Color(0xFF1A9EDF), lightValue)!;
    final highlightColor = Color.lerp(const Color(0xFF1A6B9A), const Color(0xFF42C8F5), lightValue)!;
    final metalColor = Color.lerp(const Color(0xFF1A3A5C), const Color(0xFF2A7AAC), lightValue)!;

    final shadePaint = Paint()..color = shadeColor..style = PaintingStyle.fill;
    final metalPaint = Paint()..color = metalColor..style = PaintingStyle.fill;
    final highlightPaint = Paint()..color = highlightColor..style = PaintingStyle.fill;

    // ── Lamp shade (trapezoid) ──────────────────────────────────────────
    final shadePath = Path()
      ..moveTo(w * 0.2, h * 0.48)
      ..lineTo(w * 0.35, h * 0.12)
      ..lineTo(w * 0.65, h * 0.12)
      ..lineTo(w * 0.8, h * 0.48)
      ..close();
    canvas.drawPath(shadePath, shadePaint);

    // Shade highlight strip
    final highlightPath = Path()
      ..moveTo(w * 0.22, h * 0.46)
      ..lineTo(w * 0.36, h * 0.14)
      ..lineTo(w * 0.42, h * 0.14)
      ..lineTo(w * 0.28, h * 0.46)
      ..close();
    canvas.drawPath(highlightPath, Paint()..color = highlightColor.withOpacity(0.3)..style = PaintingStyle.fill);

    // ── Shade bottom opening (ellipse) ──────────────────────────────────
    final openingColor = isOn
      ? Color.lerp(const Color(0xFF0E86CA), const Color(0xFFFFE082), lightValue)!
      : const Color(0xFF0A2D6E);
    canvas.drawOval(
      Rect.fromCenter(center: Offset(w * 0.5, h * 0.48), width: w * 0.6, height: h * 0.06),
      Paint()..color = openingColor,
    );

    // ── Post (vertical stem) ─────────────────────────────────────────────
    final postRect = Rect.fromLTWH(w * 0.46, h * 0.48, w * 0.08, h * 0.34);
    canvas.drawRRect(RRect.fromRectAndRadius(postRect, const Radius.circular(4)), metalPaint);

    // ── Base ─────────────────────────────────────────────────────────────
    final basePath = Path()
      ..moveTo(w * 0.3, h * 0.88)
      ..quadraticBezierTo(w * 0.5, h * 0.82, w * 0.7, h * 0.88)
      ..lineTo(w * 0.72, h * 0.92)
      ..quadraticBezierTo(w * 0.5, h * 0.98, w * 0.28, h * 0.92)
      ..close();
    canvas.drawPath(basePath, metalPaint);

    // ── Cord (animated swing on tap) ──────────────────────────────────────
    final cordSwingOffset = math.sin(cordSwing * math.pi) * 20;
    final cordPaint = Paint()
      ..color = Color.lerp(const Color(0xFF2A5C8A), const Color(0xFF42C8F5), lightValue * 0.5)!
      ..strokeWidth = 4
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    final cordPath = Path();
    final cordStart = Offset(w * 0.5, h * 0.48);
    final cordMid = Offset(w * 0.5 + cordSwingOffset, h * 0.64);
    final cordEnd = Offset(w * 0.5 + cordSwingOffset * 0.5, h * 0.75);
    cordPath.moveTo(cordStart.dx, cordStart.dy);
    cordPath.quadraticBezierTo(cordMid.dx, cordMid.dy, cordEnd.dx, cordEnd.dy);
    canvas.drawPath(cordPath, cordPaint);

    // Cord pull handle
    canvas.drawCircle(cordEnd, 6, Paint()..color = metalColor);
    canvas.drawCircle(cordEnd, 4, Paint()..color = highlightColor);

    // ── Light bulb glow ───────────────────────────────────────────────────
    if (isOn && lightValue > 0) {
      final glowPaint = Paint()
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 20)
        ..color = const Color(0xFF42C8F5).withOpacity(0.6 * lightValue);
      canvas.drawCircle(Offset(w * 0.5, h * 0.46), 18 * lightValue, glowPaint);

      // Inner bright spot
      canvas.drawCircle(
        Offset(w * 0.5, h * 0.46),
        8 * lightValue,
        Paint()..color = Colors.white.withOpacity(0.9 * lightValue),
      );
    }

    // Face on lamp (eyes + mouth) — inspired by the reference
    _drawFace(canvas, w, h);
  }

  void _drawFace(Canvas canvas, double w, double h) {
    final facePaint = Paint()
      ..color = const Color(0xFF0A1A2E)
      ..style = PaintingStyle.fill;

    // Eyes (arc shape when on, closed when off)
    final eyeStroke = Paint()
      ..color = isOn ? const Color(0xFF0A1A2E) : const Color(0xFF1A3A5C)
      ..strokeWidth = 2.5
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    if (isOn) {
      // Happy open eyes
      canvas.drawCircle(Offset(w * 0.37, h * 0.31), 4, facePaint);
      canvas.drawCircle(Offset(w * 0.63, h * 0.31), 4, facePaint);
      // Smile
      final smilePath = Path();
      smilePath.moveTo(w * 0.38, h * 0.39);
      smilePath.quadraticBezierTo(w * 0.5, h * 0.44, w * 0.62, h * 0.39);
      canvas.drawPath(smilePath, eyeStroke);
      // Tongue
      canvas.drawOval(Rect.fromCenter(center: Offset(w * 0.52, h * 0.42), width: 14, height: 10), Paint()..color = const Color(0xFFFF7096)..style = PaintingStyle.fill);
    } else {
      // Sleepy arced eyes
      final leftEyePath = Path();
      leftEyePath.moveTo(w * 0.31, h * 0.33);
      leftEyePath.quadraticBezierTo(w * 0.37, h * 0.28, w * 0.43, h * 0.33);
      canvas.drawPath(leftEyePath, eyeStroke);

      final rightEyePath = Path();
      rightEyePath.moveTo(w * 0.57, h * 0.33);
      rightEyePath.quadraticBezierTo(w * 0.63, h * 0.28, w * 0.69, h * 0.33);
      canvas.drawPath(rightEyePath, eyeStroke);
    }
  }

  @override
  bool shouldRepaint(_LampPainter old) =>
    old.lightValue != lightValue || old.cordSwing != cordSwing || old.isOn != isOn;
}

class _PullIndicator extends StatefulWidget {
  const _PullIndicator();
  @override
  State<_PullIndicator> createState() => _PullIndicatorState();
}

class _PullIndicatorState extends State<_PullIndicator> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1000))..repeat(reverse: true);
    _anim = Tween(begin: 0.0, end: 12.0).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: _anim,
    builder: (_, __) => Transform.translate(
      offset: Offset(0, _anim.value),
      child: Icon(Icons.keyboard_arrow_down, color: Colors.white.withOpacity(0.4), size: 28),
    ),
  );
}
