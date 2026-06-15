import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import '../../../core/api_client.dart';
import 'auth_widgets.dart';

class CaptainLoginScreen extends StatefulWidget {
  const CaptainLoginScreen({super.key});

  @override
  State<CaptainLoginScreen> createState() => _CaptainLoginScreenState();
}

class _CaptainLoginScreenState extends State<CaptainLoginScreen> {
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _loading = false;
  String _error = '';
  bool _obscure = true;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    final email = _emailCtrl.text.trim();
    final pass = _passCtrl.text.trim();
    if (email.isEmpty || pass.isEmpty) return;

    setState(() { _loading = true; _error = ''; });
    try {
      final res = await ApiClient.instance.post('/captain/login', data: {'email': email, 'password': pass});
      await ApiClient.instance.saveToken(res['token']);
      await ApiClient.instance.saveUserType('captain');
      if (!mounted) return;
      context.go('/captain/home');
    } on DioException catch (e) {
      setState(() => _error = e.response?.data?['message'] ?? 'Login failed');
    } catch (_) {
      setState(() => _error = 'Something went wrong');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 24, 16, 16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Captain Login\u{1F695}', style: TextStyle(fontSize: 30, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 24),
                  AuthLabel('Email'),
                  AuthInput(controller: _emailCtrl, hint: 'Email', type: TextInputType.emailAddress),
                  const SizedBox(height: 8),
                  AuthLabel('Password'),
                  AuthPasswordInput(controller: _passCtrl, obscure: _obscure, onToggle: () => setState(() => _obscure = !_obscure)),
                  if (_error.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(_error, style: const TextStyle(color: Colors.red, fontSize: 13), textAlign: TextAlign.center),
                  ],
                  const SizedBox(height: 4),
                  const Text('Forgot Password?', style: TextStyle(fontSize: 13)),
                  const SizedBox(height: 12),
                  AuthButton(
                    label: _loading ? 'Please wait...' : 'Login',
                    onPressed: _loading ? null : _login,
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text("Don't have an account? ", style: TextStyle(fontSize: 13)),
                      GestureDetector(
                        onTap: () => context.push('/captain/signup'),
                        child: const Text('Sign up', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                      ),
                    ],
                  ),
                ],
              ),
              Column(
                children: [
                  AuthButton(
                    label: 'Login as User',
                    color: const Color(0xFF22C55E),
                    onPressed: () => context.go('/login'),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply.',
                    style: TextStyle(fontSize: 11, color: Colors.black54),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
