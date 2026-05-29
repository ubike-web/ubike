import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

const kCharcoal = Color(0xFF2E2B26);
const kGold = Color(0xFFBF9340);
const kSienna = Color(0xFF8B2E1E);
const kSurface = Color(0xFF3D3A35);
const kOnSurface = Color(0xFFF5F0E8);

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: UbikeErrandsApp()));
}

class UbikeErrandsApp extends StatelessWidget {
  const UbikeErrandsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'u-bike Errands Rider',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: const ColorScheme.dark(
          primary: kSienna,
          onPrimary: Colors.white,
          secondary: kGold,
          surface: kSurface,
          background: kCharcoal,
        ),
        scaffoldBackgroundColor: kCharcoal,
      ),
      debugShowCheckedModeBanner: false,
      home: const ErrandsRiderHomeStub(),
    );
  }
}

class ErrandsRiderHomeStub extends StatelessWidget {
  const ErrandsRiderHomeStub({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('u-bike Errands', style: TextStyle(color: kSienna))),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.local_shipping, color: kSienna, size: 64),
            SizedBox(height: 16),
            Text('Errands Rider App', style: TextStyle(color: kOnSurface, fontSize: 20, fontWeight: FontWeight.w600)),
            SizedBox(height: 8),
            Text('Full screens: see lib/features/', style: TextStyle(color: Color(0xFF8B8578))),
          ],
        ),
      ),
    );
  }
}
