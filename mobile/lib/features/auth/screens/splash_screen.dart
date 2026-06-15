import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api_client.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _navigate();
  }

  Future<void> _navigate() async {
    await Future.delayed(const Duration(milliseconds: 1500));
    if (!mounted) return;
    final token = await ApiClient.instance.getToken();
    final type = await ApiClient.instance.getUserType();
    if (!mounted) return;
    if (token != null) {
      context.go(type == 'captain' ? '/captain/home' : '/home');
    } else {
      context.go('/');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: Image.asset('assets/images/ubike_icon.png', width: 100, height: 100),
      ),
    );
  }
}
