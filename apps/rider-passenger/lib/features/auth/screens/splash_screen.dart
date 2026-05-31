import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
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

  // Rider apps: session expires after 48 hours
  static const _sessionHours = 48;
  static const _storage = FlutterSecureStorage();

  @override
  void initState() {
    super.initState();
    _checkSession();
  }

  Future<void> _checkSession() async {
    await Future.delayed(const Duration(milliseconds: 500));
    if (!mounted) return;

    final auth = ref.read(authProvider);
    if (!auth.isAuthenticated) { setState(() => _isLoggedIn = false); return; }

    // Check 48hr expiry
    final loginTimeStr = await _storage.read(key: 'login_time');
    if (loginTimeStr != null) {
      final loginTime = DateTime.tryParse(loginTimeStr);
      if (loginTime != null) {
        final elapsed = DateTime.now().difference(loginTime);
        if (elapsed.inHours >= _sessionHours) {
          // Session expired — force logout
          await ref.read(authProvider.notifier).logout();
          setState(() => _isLoggedIn = false);
          return;
        }
      }
    }
    setState(() => _isLoggedIn = true);
  }

  void _onLoaderDone() => setState(() => _phase = _Phase.lamp);

  void _onLampDone() {
    if (!mounted) return;
    final loggedIn = _isLoggedIn ?? false;
    context.go(loggedIn ? '/dashboard' : '/onboarding');
  }

  @override
  Widget build(BuildContext context) => switch (_phase) {
    _Phase.loader => LoaderScreen(onComplete: _onLoaderDone),
    _Phase.lamp   => LampScreen(onComplete: _onLampDone),
  };
}

enum _Phase { loader, lamp }
