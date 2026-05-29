import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/providers/auth_provider.dart';
import '../features/auth/screens/splash_screen.dart';
import '../features/auth/screens/phone_screen.dart';
import '../features/auth/screens/otp_screen.dart';
import '../features/onboarding/screens/onboarding_screen.dart';
import '../features/dashboard/screens/dashboard_screen.dart';
import '../features/errands/screens/active_errand_screen.dart';

final errandsRouterProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authProvider);
  return GoRouter(
    initialLocation: '/splash',
    redirect: (_, state) {
      final loc = state.matchedLocation;
      final pub = ['/splash', '/onboarding', '/phone', '/otp'];
      if (!auth.isAuthenticated && !pub.any(loc.startsWith)) return '/onboarding';
      if (auth.isAuthenticated && pub.any(loc.startsWith) && loc != '/splash') return '/dashboard';
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/onboarding', builder: (_, __) => const OnboardingScreen()),
      GoRoute(path: '/phone', builder: (_, __) => const PhoneScreen()),
      GoRoute(path: '/otp', builder: (_, state) { final e = state.extra as Map<String, dynamic>? ?? {}; return OtpScreen(phone: e['phone'] as String? ?? ''); }),
      GoRoute(path: '/dashboard', builder: (_, __) => const ErrandsDashboardScreen()),
      GoRoute(path: '/errands/active', builder: (_, state) { final e = state.extra as Map<String, dynamic>; return ActiveErrandScreen(errandId: e['errandId'] as String); }),
    ],
  );
});
