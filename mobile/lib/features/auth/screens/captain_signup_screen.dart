import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import '../../../core/api_client.dart';
import 'auth_widgets.dart';

class CaptainSignupScreen extends StatefulWidget {
  const CaptainSignupScreen({super.key});

  @override
  State<CaptainSignupScreen> createState() => _CaptainSignupScreenState();
}

class _CaptainSignupScreenState extends State<CaptainSignupScreen> {
  final _firstCtrl = TextEditingController();
  final _lastCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _colorCtrl = TextEditingController();
  final _plateCtrl = TextEditingController();
  final _capacityCtrl = TextEditingController();
  bool _loading = false;
  String _error = '';
  bool _obscure = true;
  String _vehicleType = 'motorcycle';

  @override
  void dispose() {
    _firstCtrl.dispose(); _lastCtrl.dispose(); _emailCtrl.dispose();
    _phoneCtrl.dispose(); _passCtrl.dispose(); _colorCtrl.dispose();
    _plateCtrl.dispose(); _capacityCtrl.dispose();
    super.dispose();
  }

  Future<void> _signup() async {
    final first = _firstCtrl.text.trim();
    final last = _lastCtrl.text.trim();
    final email = _emailCtrl.text.trim();
    final phone = _phoneCtrl.text.trim();
    final pass = _passCtrl.text.trim();
    if (first.isEmpty || last.isEmpty || email.isEmpty || pass.isEmpty) return;

    setState(() { _loading = true; _error = ''; });
    try {
      await ApiClient.instance.post('/captain/register', data: {
        'fullname': {'firstname': first, 'lastname': last},
        'email': email,
        'password': pass,
        'phone': phone,
        'vehicle': {
          'color': _colorCtrl.text.trim(),
          'plate': _plateCtrl.text.trim(),
          'capacity': int.tryParse(_capacityCtrl.text.trim()) ?? 1,
          'vehicleType': _vehicleType,
        },
      });
      if (!mounted) return;
      context.go('/captain/login');
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
              const Text('Captain Sign Up\u{1F695}', style: TextStyle(fontSize: 30, fontWeight: FontWeight.bold)),
              const SizedBox(height: 24),
              Row(children: [
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  AuthLabel('First name'), AuthInput(controller: _firstCtrl, hint: 'First name'),
                ])),
                const SizedBox(width: 12),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  AuthLabel('Last name'), AuthInput(controller: _lastCtrl, hint: 'Last name'),
                ])),
              ]),
              AuthLabel('Email'),
              AuthInput(controller: _emailCtrl, hint: 'Email', type: TextInputType.emailAddress),
              AuthLabel('Phone Number'),
              AuthInput(controller: _phoneCtrl, hint: 'Phone Number', type: TextInputType.phone),
              AuthLabel('Password'),
              AuthPasswordInput(controller: _passCtrl, obscure: _obscure, onToggle: () => setState(() => _obscure = !_obscure)),
              const SizedBox(height: 8),
              const Text('Vehicle Details', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
              const SizedBox(height: 8),
              AuthLabel('Vehicle Color'),
              AuthInput(controller: _colorCtrl, hint: 'e.g. White'),
              AuthLabel('Plate Number'),
              AuthInput(controller: _plateCtrl, hint: 'e.g. KCA 123A'),
              AuthLabel('Capacity (seats)'),
              AuthInput(controller: _capacityCtrl, hint: 'e.g. 4', type: TextInputType.number),
              AuthLabel('Vehicle Type'),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF4F4F5),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _vehicleType,
                    isExpanded: true,
                    style: const TextStyle(fontSize: 14, color: Colors.black87),
                    items: const [
                      DropdownMenuItem(value: 'motorcycle', child: Text('Motorcycle')),
                      DropdownMenuItem(value: 'car', child: Text('Car')),
                      DropdownMenuItem(value: 'auto', child: Text('Auto')),
                    ],
                    onChanged: (v) => setState(() => _vehicleType = v!),
                  ),
                ),
              ),
              if (_error.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(_error, style: const TextStyle(color: Colors.red, fontSize: 13), textAlign: TextAlign.center),
              ],
              const SizedBox(height: 16),
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
                    onTap: () => context.go('/captain/login'),
                    child: const Text('Login', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              AuthButton(
                label: 'Sign Up as User',
                color: const Color(0xFF22C55E),
                onPressed: () => context.go('/signup'),
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
