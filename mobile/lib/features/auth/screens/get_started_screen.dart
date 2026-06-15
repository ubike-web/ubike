import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

class GetStartedScreen extends StatelessWidget {
  const GetStartedScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) => SystemNavigator.pop(),
      child: Scaffold(
        body: Column(
          children: [
            Expanded(
              child: Stack(
                children: [
                  // Background image — same as website
                  Positioned.fill(
                    child: Image.asset(
                      'assets/images/get_started.jpg',
                      fit: BoxFit.cover,
                    ),
                  ),
                  // Logo top left — same as website
                  Positioned(
                    top: 48,
                    left: 16,
                    child: Image.asset(
                      'assets/images/ubike_icon.png',
                      height: 90,
                    ),
                  ),
                ],
              ),
            ),
            // White bottom sheet — same as website
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'Get started with U-bike',
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 32),
                  _BlackButton(
                    label: 'Continue',
                    onPressed: () => context.push('/login'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BlackButton extends StatelessWidget {
  final String label;
  final VoidCallback onPressed;
  final Color color;

  const _BlackButton({required this.label, required this.onPressed, this.color = Colors.black});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: color,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          elevation: 0,
        ),
        child: Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
      ),
    );
  }
}
