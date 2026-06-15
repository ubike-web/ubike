import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import '../../../core/api_client.dart';
import 'auth_widgets.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _firstCtrl = TextEditingController();
  final _lastCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _loading = false;
  String _error = '';
  bool _obscure = true;

  @override
  void dispose() {
    _firstCtrl.dispose(); _lastCtrl.dispose(); _phoneCtrl.dispose();
    _emailCtrl.dispose(); _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _signup() async {
    final first = _firstCtrl.text.trim();
    final last = _lastCtrl.text.trim();
    final phone = _phoneCtrl.text.trim();
    final email = _emailCtrl.text.trim();
    final pass = _passCtrl.text.trim();
    if (first.isEmpty || last.isEmpty || email.isEmpty || pass.isEmpty) return;

    setState(() { _loading = true; _error = ''; });
    try {
      await ApiClient.instance.post('/user/register', data: {
        'fullname': {'firstname': first, 'lastname': last},
        'email': email,
        'password': pass,
        'phone': phone,
      });
      if (!mounted) return;
      context.go('/login');
    } on DioException catch (e) {
      final msg = (e.response?.data is List)
          ? (e.response?.data as List).first['msg']
          : e.response?.data?['message'];
      setState(() => _error = msg ?? 'Registration failed');
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
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 24, 16, 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('User Sign Up\u{1F9D1}\u{1F3FB}', style: TextStyle(fontSize: 30, fontWeight: FontWeight.bold)),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    AuthLabel('First name'), AuthInput(controller: _firstCtrl, hint: 'First name'),
                  ])),
                  const SizedBox(width: 12),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    AuthLabel('Last name'), AuthInput(controller: _lastCtrl, hint: 'Last name'),
                  ])),
                ],
              ),
              AuthLabel('Phone Number'),
              AuthInput(controller: _phoneCtrl, hint: 'Phone Number', type: TextInputType.phone),
              AuthLabel('Email'),
              AuthInput(controller: _emailCtrl, hint: 'Email', type: TextInputType.emailAddress),
              AuthLabel('Password'),
              AuthPasswordInput(controller: _passCtrl, obscure: _obscure, onToggle: () => setState(() => _obscure = !_obscure)),
              if (_error.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(_error, style: const TextStyle(color: Colors.red, fontSize: 13), textAlign: TextAlign.center),
              ],
              const SizedBox(height: 12),
              AuthButton(
                label: _loading ? 'Please wait...' : 'Sign Up',
                onPressed: _loading ? null : _signup,
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('Already have an account? ', style: TextStyle(fontSize: 13)),
                  GestureDetector(
                    onTap: () => context.go('/login'),
                    child: const Text('Login', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                  ),
                ],
              ),
              const SizedBox(height: 32),
              AuthButton(
                label: 'Sign Up as Captain',
                color: const Color(0xFFF97316),
                onPressed: () => context.go('/captain/signup'),
              ),
              const SizedBox(height: 20),
              const Text(
                'This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply.',
                style: TextStyle(fontSize: 11, color: Colors.black54),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
