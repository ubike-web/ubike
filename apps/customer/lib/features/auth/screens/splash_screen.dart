import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme.dart';
import '../providers/auth_provider.dart';
import 'loader_screen.dart';
import 'lamp_screen.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});
  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  _Phase _phase = _Phase.loader;
  bool? _isLoggedIn;

  @override
  void initState() {
    super.initState();
    _checkSession();
  }

  Future<void> _checkSession() async {
    // Wait a tick for auth provider to restore session
    await Future.delayed(const Duration(milliseconds: 500));
    if (mounted) {
      setState(() => _isLoggedIn = ref.read(authProvider).isAuthenticated);
    }
  }

  void _onLoaderDone() => setState(() => _phase = _Phase.lamp);

  void _onLampDone() {
    if (!mounted) return;
    final loggedIn = _isLoggedIn ?? ref.read(authProvider).isAuthenticated;
    context.go(loggedIn ? '/home' : '/welcome');
  }

  @override
  Widget build(BuildContext context) {
    return switch (_phase) {
      _Phase.loader => LoaderScreen(onComplete: _onLoaderDone),
      _Phase.lamp   => LampScreen(onComplete: _onLampDone),
    };
  }
}

enum _Phase { loader, lamp }

// ─── U-bike Logo Widget (used across splash + lamp) ─────────────────────────
class UbikeLogo extends StatelessWidget {
  const UbikeLogo({super.key, this.size = 100, this.color});
  final double size;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final c = color ?? kOcean;
    return SizedBox(
      width: size,
      height: size * 0.7,
      child: CustomPaint(painter: _BikeLogoPainter(color: c)),
    );
  }
}

class _BikeLogoPainter extends CustomPainter {
  const _BikeLogoPainter({required this.color});
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = size.width * 0.04
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    final fill = Paint()..color = color..style = PaintingStyle.fill;
    final w = size.width;
    final h = size.height;

    // Handlebars
    final bars = Path()
      ..moveTo(w * 0.22, h * 0.42)
      ..lineTo(w * 0.38, h * 0.35)
      ..moveTo(w * 0.78, h * 0.42)
      ..lineTo(w * 0.62, h * 0.35);
    canvas.drawPath(bars, paint);

    // Grips
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(w * 0.14, h * 0.36, w * 0.09, h * 0.08), const Radius.circular(4)), fill);
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(w * 0.77, h * 0.36, w * 0.09, h * 0.08), const Radius.circular(4)), fill);

    // Headlight housing
    final headPath = Path()
      ..moveTo(w * 0.36, h * 0.35)
      ..quadraticBezierTo(w * 0.37, h * 0.18, w * 0.5, h * 0.14)
      ..quadraticBezierTo(w * 0.63, h * 0.18, w * 0.64, h * 0.35)
      ..lineTo(w * 0.6, h * 0.44)
      ..quadraticBezierTo(w * 0.5, h * 0.48, w * 0.4, h * 0.44)
      ..close();
    canvas.drawPath(headPath, fill);

    // Headlight lens
    final lensFill = Paint()..color = color.withOpacity(0.3)..style = PaintingStyle.fill;
    canvas.drawCircle(Offset(w * 0.5, h * 0.36), w * 0.065, lensFill);
    canvas.drawCircle(Offset(w * 0.5, h * 0.36), w * 0.04, fill);

    // Forks
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(w * 0.44, h * 0.44, w * 0.025, h * 0.2), const Radius.circular(2)), fill);
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(w * 0.535, h * 0.44, w * 0.025, h * 0.2), const Radius.circular(2)), fill);

    // Tyre
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(w * 0.41, h * 0.64, w * 0.18, w * 0.42), const Radius.circular(7)),
      fill,
    );

    // Tread
    final tread = Paint()..color = color.withOpacity(0.3)..strokeWidth = size.width * 0.02..strokeCap = StrokeCap.round..style = PaintingStyle.stroke;
    for (int i = 0; i < 5; i++) {
      final y = h * (0.69 + i * 0.07);
      canvas.drawLine(Offset(w * 0.42, y), Offset(w * 0.5, y - h * 0.04), tread);
      canvas.drawLine(Offset(w * 0.58, y), Offset(w * 0.5, y - h * 0.04), tread);
    }

    // Green leaf
    final leafFill = Paint()..color = const Color(0xFF4CAF50)..style = PaintingStyle.fill;
    final leafPath = Path()
      ..moveTo(w * 0.73, h * 0.18)
      ..quadraticBezierTo(w * 0.88, h * 0.06, w * 0.91, h * 0.1)
      ..quadraticBezierTo(w * 0.79, h * 0.26, w * 0.73, h * 0.18);
    canvas.drawPath(leafPath, leafFill);

    // Speed lines (right side)
    final lines = Paint()..color = color..strokeWidth = size.width * 0.025..strokeCap = StrokeCap.round..style = PaintingStyle.stroke;
    canvas.drawLine(Offset(w * 0.88, h * 0.72), Offset(w * 1.0, h * 0.72), lines);
    canvas.drawLine(Offset(w * 0.88, h * 0.82), Offset(w * 0.98, h * 0.82), lines);
    canvas.drawLine(Offset(w * 0.88, h * 0.92), Offset(w * 0.95, h * 0.92), lines);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
