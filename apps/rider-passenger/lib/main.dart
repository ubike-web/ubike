import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// Rider-passenger app shares the same theme and API client as customer
// Core files should be extracted to packages/shared in a real setup.
// For now, duplicate the essentials.

const kCharcoal = Color(0xFF2E2B26);
const kGold = Color(0xFFBF9340);
const kSienna = Color(0xFF8B2E1E);
const kSurface = Color(0xFF3D3A35);
const kOnSurface = Color(0xFFF5F0E8);

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: UbikeRiderApp()));
}

class UbikeRiderApp extends StatelessWidget {
  const UbikeRiderApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'u-bike Rider',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: const ColorScheme.dark(
          primary: kGold,
          onPrimary: kCharcoal,
          secondary: kSienna,
          surface: kSurface,
          background: kCharcoal,
        ),
        scaffoldBackgroundColor: kCharcoal,
      ),
      debugShowCheckedModeBanner: false,
      home: const RiderHomeStub(),
    );
  }
}

class RiderHomeStub extends StatelessWidget {
  const RiderHomeStub({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('u-bike Rider', style: TextStyle(color: kGold))),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.electric_moped, color: kGold, size: 64),
            SizedBox(height: 16),
            Text('Passenger Rider App', style: TextStyle(color: kOnSurface, fontSize: 20, fontWeight: FontWeight.w600)),
            SizedBox(height: 8),
            Text('Full screens: see lib/features/', style: TextStyle(color: Color(0xFF8B8578))),
          ],
        ),
      ),
    );
  }
}
