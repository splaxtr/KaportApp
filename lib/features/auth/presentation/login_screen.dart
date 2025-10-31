import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:kaportapp/core/state/user_session.dart';

import 'register_screen.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  static const String routeName = '/login';

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isSubmitting = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    final auth = ref.read(authServiceProvider);
    final messenger = ScaffoldMessenger.of(context);

    try {
      await auth.signIn(
        _emailController.text.trim(),
        _passwordController.text,
      );
      ref.invalidate(userSessionProvider);
    } catch (error) {
      messenger
        ..hideCurrentSnackBar()
        ..showSnackBar(SnackBar(content: Text('Giriş başarısız: $error')));
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Giriş Yap')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(labelText: 'E-posta'),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'E-posta giriniz';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _passwordController,
                  obscureText: true,
                  decoration: const InputDecoration(labelText: 'Şifre'),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Şifre giriniz';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isSubmitting ? null : _handleSubmit,
                    child: _isSubmitting
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Giriş Yap'),
                  ),
                ),
                const SizedBox(height: 16),
                TextButton(
                  onPressed: _isSubmitting
                      ? null
                      : () {
                          Navigator.pushNamed(
                            context,
                            RegisterScreen.routeName,
                          );
                        },
                  child: const Text('Hesabın yok mu? Kayıt ol'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
