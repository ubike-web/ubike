import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme.dart';
import '../../../shared/widgets/app_button.dart';
import '../providers/auth_provider.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});
  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _form = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _loading = false;
  bool _obscure = true;
  String? _error;

  @override
  void dispose() { _name.dispose(); _email.dispose(); _password.dispose(); super.dispose(); }

  Future<void> _register() async {
    if (!_form.currentState!.validate()) return;
    setState(() { _loading = true; _error = null; });
    try {
      await ref.read(authProvider.notifier).registerEmail(_email.text.trim(), _password.text, _name.text.trim());
      if (mounted) context.go('/home');
    } catch (_) {
      setState(() => _error = ref.read(authProvider).error ?? 'Registration failed');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create Account')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _form,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 8),
                const Text('Join u-bike', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w700, color: kCream)),
                const SizedBox(height: 4),
                const Text('Create your account to get started', style: TextStyle(color: kSubtext)),
                const SizedBox(height: 32),

                TextFormField(
                  controller: _name,
                  decoration: const InputDecoration(labelText: 'Full Name', prefixIcon: Icon(Icons.person_outline, color: kGold)),
                  validator: (v) => v == null || v.isEmpty ? 'Enter your name' : null,
                ),
                const SizedBox(height: 16),

                TextFormField(
                  controller: _email,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(labelText: 'Email Address', prefixIcon: Icon(Icons.email_outlined, color: kGold)),
                  validator: (v) => v == null || !v.contains('@') ? 'Enter a valid email' : null,
                ),
                const SizedBox(height: 16),

                TextFormField(
                  controller: _password,
                  obscureText: _obscure,
                  decoration: InputDecoration(
                    labelText: 'Password',
                    prefixIcon: const Icon(Icons.lock_outline, color: kGold),
                    suffixIcon: IconButton(
                      icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined, color: kSubtext),
                      onPressed: () => setState(() => _obscure = !_obscure),
                    ),
                  ),
                  validator: (v) => v == null || v.length < 8 ? 'Minimum 8 characters' : null,
                ),

                if (_error != null) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: kError.withOpacity(0.1), borderRadius: BorderRadius.circular(10), border: Border.all(color: kError.withOpacity(0.4))),
                    child: Text(_error!, style: const TextStyle(color: kError, fontSize: 13)),
                  ),
                ],

                const SizedBox(height: 32),
                AppButton(label: 'Create Account', onPressed: _register, loading: _loading),
                const SizedBox(height: 16),
                Center(child: TextButton(
                  onPressed: () => context.go('/phone'),
                  child: const Text('Already have an account? Sign in'),
                )),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
