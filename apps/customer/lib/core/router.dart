import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../features/auth/screens/welcome_screen.dart';
import '../features/auth/screens/phone_screen.dart';
import '../features/auth/screens/otp_screen.dart';
import '../features/home/home_screen.dart';
import '../features/rides/screens/ride_request_screen.dart';
import '../features/rides/screens/ride_tracking_screen.dart';
import '../features/errands/screens/errand_request_screen.dart';
import '../features/profile/profile_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/welcome',
    redirect: (context, state) async {
      const storage = FlutterSecureStorage();
      final token = await storage.read(key: 'access_token');
      final isLoggedIn = token != null;
      final isAuthRoute = state.matchedLocation.startsWith('/welcome') ||
          state.matchedLocation.startsWith('/phone') ||
          state.matchedLocation.startsWith('/otp');

      if (!isLoggedIn && !isAuthRoute) return '/welcome';
      if (isLoggedIn && isAuthRoute) return '/home';
      return null;
    },
    routes: [
      GoRoute(path: '/welcome', builder: (_, __) => const WelcomeScreen()),
      GoRoute(path: '/phone', builder: (_, __) => const PhoneScreen()),
      GoRoute(
        path: '/otp',
        builder: (_, state) {
          final extra = state.extra as Map<String, String>?;
          return OtpScreen(phone: extra?['phone'] ?? '');
        },
      ),
      GoRoute(path: '/home', builder: (_, __) => const HomeScreen()),
      GoRoute(path: '/ride/request', builder: (_, __) => const RideRequestScreen()),
      GoRoute(
        path: '/ride/:id/tracking',
        builder: (_, state) => RideTrackingScreen(rideId: state.pathParameters['id']!),
      ),
      GoRoute(path: '/errand/request', builder: (_, __) => const ErrandRequestScreen()),
      GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
    ],
    errorBuilder: (_, state) => Scaffold(
      body: Center(child: Text('Page not found: ${state.uri}')),
    ),
  );
});
