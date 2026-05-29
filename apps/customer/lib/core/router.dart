import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/screens/splash_screen.dart';
import '../features/auth/screens/welcome_screen.dart';
import '../features/auth/screens/phone_screen.dart';
import '../features/auth/screens/otp_screen.dart';
import '../features/auth/screens/register_screen.dart';
import '../features/auth/providers/auth_provider.dart';
import '../features/home/screens/home_screen.dart';
import '../features/rides/screens/destination_search_screen.dart';
import '../features/rides/screens/route_preview_screen.dart';
import '../features/rides/screens/rider_matching_screen.dart';
import '../features/rides/screens/active_ride_screen.dart';
import '../features/rides/screens/post_ride_screen.dart';
import '../features/errands/screens/errand_request_screen.dart';
import '../features/wallet/screens/wallet_screen.dart';
import '../features/commuter/screens/commuter_plans_screen.dart';
import '../features/profile/screens/profile_screen.dart';
import '../features/notifications/screens/notifications_screen.dart';
import '../features/chat/screens/chat_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/splash',
    redirect: (_, state) {
      final isAuth = auth.isAuthenticated;
      final loc = state.matchedLocation;
      final publicRoutes = ['/splash', '/welcome', '/phone', '/otp', '/register'];
      final isPublic = publicRoutes.any((r) => loc.startsWith(r));

      if (!isAuth && !isPublic) return '/welcome';
      if (isAuth && isPublic && loc != '/splash') return '/home';
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/welcome', builder: (_, __) => const WelcomeScreen()),
      GoRoute(path: '/phone', builder: (_, __) => const PhoneScreen()),
      GoRoute(path: '/otp', builder: (_, state) {
        final extra = state.extra as Map<String, dynamic>? ?? {};
        return OtpScreen(phone: extra['phone'] as String? ?? '');
      }),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      GoRoute(path: '/home', builder: (_, __) => const HomeScreen()),

      // Rides
      GoRoute(path: '/rides/search', builder: (_, state) {
        final extra = state.extra as Map<String, dynamic>? ?? {};
        return DestinationSearchScreen(
          vehicleType: extra['vehicleType'] as String? ?? 'standard',
          scheduled: extra['scheduled'] as bool? ?? false,
        );
      }),
      GoRoute(path: '/rides/preview', builder: (_, state) {
        final e = state.extra as Map<String, dynamic>;
        return RoutePreviewScreen(
          pickupAddress: e['pickupAddress'] as String,
          pickupLat: (e['pickupLat'] as num).toDouble(),
          pickupLng: (e['pickupLng'] as num).toDouble(),
          dropoffAddress: e['dropoffAddress'] as String,
          dropoffLat: (e['dropoffLat'] as num).toDouble(),
          dropoffLng: (e['dropoffLng'] as num).toDouble(),
          vehicleType: e['vehicleType'] as String? ?? 'standard',
          scheduledAt: e['scheduledAt'] as String?,
        );
      }),
      GoRoute(path: '/rides/matching', builder: (_, state) {
        final e = state.extra as Map<String, dynamic>;
        return RiderMatchingScreen(
          pickupAddress: e['pickupAddress'] as String,
          pickupLat: (e['pickupLat'] as num).toDouble(),
          pickupLng: (e['pickupLng'] as num).toDouble(),
          dropoffAddress: e['dropoffAddress'] as String,
          dropoffLat: (e['dropoffLat'] as num).toDouble(),
          dropoffLng: (e['dropoffLng'] as num).toDouble(),
          vehicleType: e['vehicleType'] as String? ?? 'standard',
          fareEstimate: (e['fareEstimate'] as num).toDouble(),
          scheduledAt: e['scheduledAt'] as String?,
        );
      }),
      GoRoute(path: '/rides/tracking', builder: (_, state) {
        final e = state.extra as Map<String, dynamic>;
        return ActiveRideScreen(rideId: e['rideId'] as String);
      }),
      GoRoute(path: '/rides/completed', builder: (_, state) {
        final e = state.extra as Map<String, dynamic>;
        return PostRideScreen(rideId: e['rideId'] as String, fare: (e['fare'] as num).toDouble());
      }),

      // Errands
      GoRoute(path: '/errands/request', builder: (_, state) {
        final extra = state.extra as Map<String, dynamic>? ?? {};
        return ErrandRequestScreen(category: extra['category'] as String?);
      }),

      // Other
      GoRoute(path: '/wallet', builder: (_, __) => const WalletScreen()),
      GoRoute(path: '/commuter', builder: (_, __) => const CommuterPlansScreen()),
      GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
      GoRoute(path: '/notifications', builder: (_, __) => const NotificationsScreen()),
      GoRoute(path: '/chat', builder: (_, state) {
        final e = state.extra as Map<String, dynamic>;
        return ChatScreen(rideId: e['rideId'] as String);
      }),
    ],
  );
});
