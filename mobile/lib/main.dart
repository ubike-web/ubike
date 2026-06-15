import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'core/router.dart';

String? _startupError;

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await Firebase.initializeApp();
  } catch (e) {
    _startupError = 'Firebase: $e';
  }
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp, DeviceOrientation.portraitDown]);
  runApp(const ProviderScope(child: UbikeApp()));
}

class UbikeApp extends ConsumerWidget {
  const UbikeApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (_startupError != null) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        home: Scaffold(
          body: Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Text(_startupError!, style: const TextStyle(color: Colors.red, fontSize: 13)),
            ),
          ),
        ),
      );
    }
    final router = ref.watch(routerProvider);
    return MaterialApp.router(
      title: 'U-bike',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        fontFamily: 'sans-serif',
        scaffoldBackgroundColor: Colors.white,
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.black),
        useMaterial3: true,
      ),
      routerConfig: router,
    );
  }
}
