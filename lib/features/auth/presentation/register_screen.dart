import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:kaportapp/core/state/user_session.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  static const String routeName = '/register';

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  String? _selectedRole;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _nameController.dispose();
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
      await auth.signUp(
        email: _emailController.text.trim(),
        password: _passwordController.text,
        name: _nameController.text.trim(),
        role: _selectedRole,
      );
      if (mounted) Navigator.pop(context);
    } catch (error) {
      messenger
        ..hideCurrentSnackBar()
        ..showSnackBar(SnackBar(content: Text('Kayıt başarısız: $error')));
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
      appBar: AppBar(title: const Text('Kayıt Ol')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: ListView(
              shrinkWrap: true,
              children: [
                TextFormField(
                  controller: _nameController,
                  decoration: const InputDecoration(labelText: 'Ad Soyad'),
                  textCapitalization: TextCapitalization.words,
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Adınızı giriniz';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
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
                    if (value == null || value.length < 6) {
                      return 'Şifre en az 6 karakter olmalı';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String?>(
                  initialValue: _selectedRole,
                  decoration: const InputDecoration(
                    labelText: 'Rol (İsteğe Bağlı)',
                  ),
                  items: const [
                    DropdownMenuItem<String?>(
                      value: null,
                      child: Text('Belirtilmemiş'),
                    ),
                    DropdownMenuItem(
                      value: 'owner',
                      child: Text('Dükkan Sahibi'),
                    ),
                    DropdownMenuItem(value: 'employee', child: Text('Çalışan')),
                  ],
                  onChanged: _isSubmitting
                      ? null
                      : (value) {
                          setState(() {
                            _selectedRole = value;
                          });
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
                        : const Text('Kaydı Tamamla'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
