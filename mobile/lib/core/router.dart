import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/screens/splash_screen.dart';
import '../features/auth/screens/get_started_screen.dart';
import '../features/auth/screens/login_screen.dart';
import '../features/auth/screens/signup_screen.dart';
import '../features/auth/screens/captain_login_screen.dart';
import '../features/auth/screens/captain_signup_screen.dart';
import '../features/home/screens/user_home_screen.dart';
import '../features/home/screens/captain_home_screen.dart';
import 'api_client.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/splash',
    redirect: (context, state) async {
      final token = await ApiClient.instance.getToken();
      final type = await ApiClient.instance.getUserType();
      final loc = state.matchedLocation;

      final isAuth = token != null;
      final isPublic = loc == '/splash' || loc == '/' || loc == '/login' ||
          loc == '/signup' || loc == '/captain/login' || loc == '/captain/signup';

      if (loc == '/splash') return null;
      if (!isAuth && !isPublic) return '/';
      if (isAuth && isPublic) {
        return type == 'captain' ? '/captain/home' : '/home';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/', builder: (_, __) => const GetStartedScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/signup', builder: (_, __) => const SignupScreen()),
      GoRoute(path: '/captain/login', builder: (_, __) => const CaptainLoginScreen()),
      GoRoute(path: '/captain/signup', builder: (_, __) => const CaptainSignupScreen()),
      GoRoute(path: '/home', builder: (_, __) => const UserHomeScreen()),
      GoRoute(path: '/captain/home', builder: (_, __) => const CaptainHomeScreen()),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(child: Text('Page not found: ${state.error}')),
    ),
  );
});
