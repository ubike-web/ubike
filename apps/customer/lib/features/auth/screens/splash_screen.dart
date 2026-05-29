import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme.dart';
import '../providers/auth_provider.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});
  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _navigate();
  }

  Future<void> _navigate() async {
    await Future.delayed(const Duration(milliseconds: 3000));
    if (!mounted) return;
    final auth = ref.read(authProvider);
    context.go(auth.isAuthenticated ? '/home' : '/welcome');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: kOceanGradient),
        child: SafeArea(
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Spacer(),

                // Logo mark — motorcycle front view
                UbikeLogo(size: 140)
                  .animate()
                  .scale(begin: const Offset(0.5, 0.5), curve: Curves.elasticOut, duration: 900.ms)
                  .fadeIn(duration: 600.ms),

                const SizedBox(height: 28),

                // Wordmark
                Text(
                  'U-BIKE',
                  style: TextStyle(
                    color: kWhite,
                    fontSize: 44,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 3,
                    shadows: [Shadow(color: kOceanDeep.withOpacity(0.4), blurRadius: 12, offset: const Offset(0, 4))],
                  ),
                ).animate(delay: 400.ms).fadeIn(duration: 500.ms).slideY(begin: 0.3),

                const SizedBox(height: 8),

                Text(
                  'Rides • Errands • Deliveries',
                  style: TextStyle(color: kWhite.withOpacity(0.85), fontSize: 14, letterSpacing: 1.5, fontWeight: FontWeight.w400),
                ).animate(delay: 600.ms).fadeIn(duration: 400.ms),

                const Spacer(),

                // Loading indicator
                Column(children: [
                  SizedBox(
                    width: 40,
                    height: 40,
                    child: CircularProgressIndicator(strokeWidth: 2.5, color: kWhite.withOpacity(0.8)),
                  ),
                  const SizedBox(height: 12),
                  Text('Loading...', style: TextStyle(color: kWhite.withOpacity(0.6), fontSize: 12)),
                  const SizedBox(height: 40),
                ]).animate(delay: 900.ms).fadeIn(duration: 400.ms),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ─── U-bike Logo Widget ──────────────────────────────────────────────────────
class UbikeLogo extends StatelessWidget {
  const UbikeLogo({super.key, this.size = 120, this.color});
  final double size;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final c = color ?? kWhite;
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(painter: _BikeLogoPainter(color: c)),
    );
  }
}

class _BikeLogoPainter extends CustomPainter {
  const _BikeLogoPainter({required this.color});
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = color..style = PaintingStyle.stroke..strokeWidth = size.width * 0.045..strokeCap = StrokeCap.round..strokeJoin = StrokeJoin.round;
    final fill = Paint()..color = color..style = PaintingStyle.fill;

    final w = size.width;
    final h = size.height;

    // Handlebars
    final path = Path();
    path.moveTo(w * 0.25, h * 0.32);
    path.lineTo(w * 0.42, h * 0.28);
    path.moveTo(w * 0.75, h * 0.32);
    path.lineTo(w * 0.58, h * 0.28);
    canvas.drawPath(path, paint);

    // Grips
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(w * 0.18, h * 0.28, w * 0.08, h * 0.06), const Radius.circular(4)), fill);
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(w * 0.74, h * 0.28, w * 0.08, h * 0.06), const Radius.circular(4)), fill);

    // Headlight housing
    final headPath = Path();
    headPath.moveTo(w * 0.38, h * 0.28);
    headPath.quadraticBezierTo(w * 0.38, h * 0.16, w * 0.5, h * 0.14);
    headPath.quadraticBezierTo(w * 0.62, h * 0.16, w * 0.62, h * 0.28);
    headPath.lineTo(w * 0.58, h * 0.35);
    headPath.quadraticBezierTo(w * 0.5, h * 0.38, w * 0.42, h * 0.35);
    headPath.close();
    canvas.drawPath(headPath, fill);

    // Headlight lens (dark cutout effect)
    final lensPaint = Paint()..color = kOcean..style = PaintingStyle.fill;
    canvas.drawCircle(Offset(w * 0.5, h * 0.3), w * 0.07, lensPaint);
    canvas.drawCircle(Offset(w * 0.5, h * 0.3), w * 0.04, fill);

    // Forks
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(w * 0.435, h * 0.36, w * 0.025, h * 0.18), const Radius.circular(2)), fill);
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(w * 0.54, h * 0.36, w * 0.025, h * 0.18), const Radius.circular(2)), fill);

    // Front tyre
    final tyrePath = Path();
    tyrePath.addRRect(RRect.fromRectAndRadius(Rect.fromLTWH(w * 0.42, h * 0.54, w * 0.16, w * 0.38), const Radius.circular(6)));
    canvas.drawPath(tyrePath, fill);

    // Tyre tread lines
    final treadPaint = Paint()..color = kOcean..strokeWidth = size.width * 0.02..strokeCap = StrokeCap.round;
    for (int i = 0; i < 5; i++) {
      final y = h * (0.58 + i * 0.06);
      canvas.drawLine(Offset(w * 0.43, y), Offset(w * 0.5, y - h * 0.03), treadPaint);
      canvas.drawLine(Offset(w * 0.57, y), Offset(w * 0.5, y - h * 0.03), treadPaint);
    }

    // Green leaf (top right)
    final leafPaint = Paint()..color = const Color(0xFF4CAF50)..style = PaintingStyle.fill;
    final leafPath = Path();
    leafPath.moveTo(w * 0.72, h * 0.18);
    leafPath.quadraticBezierTo(w * 0.88, h * 0.06, w * 0.9, h * 0.1);
    leafPath.quadraticBezierTo(w * 0.78, h * 0.24, w * 0.72, h * 0.18);
    canvas.drawPath(leafPath, leafPaint);

    // Leaf vein
    final veinPaint = Paint()..color = kWhite.withOpacity(0.7)..strokeWidth = 1.5..strokeCap = StrokeCap.round;
    canvas.drawLine(Offset(w * 0.72, h * 0.18), Offset(w * 0.87, h * 0.09), veinPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
