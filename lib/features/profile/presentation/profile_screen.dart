import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:kaportapp/core/services/auth_service.dart';
import 'package:kaportapp/core/state/user_session.dart';

/// Screen for managing user profile (name and password)
/// All users can access this screen
class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  static const String routeName = '/profile';

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final _nameFormKey = GlobalKey<FormState>();
  final _passwordFormKey = GlobalKey<FormState>();

  final _nameController = TextEditingController();
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _isUpdatingName = false;
  bool _isUpdatingPassword = false;
  bool _obscureCurrentPassword = true;
  bool _obscureNewPassword = true;
  bool _obscureConfirmPassword = true;

  @override
  void dispose() {
    _nameController.dispose();
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _updateName(String userId) async {
    if (!_nameFormKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isUpdatingName = true;
    });

    try {
      final authService = ref.read(authServiceProvider);
      await authService.updateUserName(userId, _nameController.text.trim());

      if (!mounted) return;

      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          const SnackBar(
            content: Text('İsim başarıyla güncellendi'),
            backgroundColor: Colors.green,
          ),
        );

      // Clear the text field after successful update
      _nameController.clear();
    } on AuthServiceException catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          SnackBar(content: Text(e.message), backgroundColor: Colors.red),
        );
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          SnackBar(
            content: Text('Beklenmeyen hata: $e'),
            backgroundColor: Colors.red,
          ),
        );
    } finally {
      if (mounted) {
        setState(() {
          _isUpdatingName = false;
        });
      }
    }
  }

  Future<void> _updatePassword() async {
    if (!_passwordFormKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isUpdatingPassword = true;
    });

    try {
      final authService = ref.read(authServiceProvider);
      await authService.updatePassword(
        currentPassword: _currentPasswordController.text,
        newPassword: _newPasswordController.text,
      );

      if (!mounted) return;

      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          const SnackBar(
            content: Text('Şifre başarıyla güncellendi'),
            backgroundColor: Colors.green,
          ),
        );

      // Clear all password fields after successful update
      _currentPasswordController.clear();
      _newPasswordController.clear();
      _confirmPasswordController.clear();
    } on AuthServiceException catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          SnackBar(content: Text(e.message), backgroundColor: Colors.red),
        );
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          SnackBar(
            content: Text('Beklenmeyen hata: $e'),
            backgroundColor: Colors.red,
          ),
        );
    } finally {
      if (mounted) {
        setState(() {
          _isUpdatingPassword = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(userSessionProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Profil')),
      body: Builder(
        builder: (context) {
          if (user == null) {
            return const Center(child: Text('Kullanıcı oturumu bulunamadı'));
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // User Info Card
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Kullanıcı Bilgileri',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const Divider(height: 24),
                        _buildInfoRow(Icons.person, 'İsim', user.name),
                        const SizedBox(height: 12),
                        _buildInfoRow(Icons.email, 'E-posta', user.email),
                        const SizedBox(height: 12),
                        _buildInfoRow(
                          Icons.badge,
                          'Rol',
                          _getRoleLabel(user.role),
                        ),
                        if (user.shopId != null && user.shopId!.isNotEmpty) ...[
                          const SizedBox(height: 12),
                          _buildInfoRow(Icons.store, 'Dükkan ID', user.shopId!),
                        ],
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                // Update Name Section
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Form(
                      key: _nameFormKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'İsim Güncelle',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _nameController,
                            decoration: InputDecoration(
                              labelText: 'Yeni İsim',
                              hintText: user.name,
                              prefixIcon: const Icon(Icons.person_outline),
                              border: const OutlineInputBorder(),
                            ),
                            textCapitalization: TextCapitalization.words,
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                return 'İsim boş olamaz';
                              }
                              if (value.trim().length < 2) {
                                return 'İsim en az 2 karakter olmalıdır';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          FilledButton.icon(
                            onPressed: _isUpdatingName
                                ? null
                                : () => _updateName(user.id),
                            icon: _isUpdatingName
                                ? const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.white,
                                    ),
                                  )
                                : const Icon(Icons.check),
                            label: Text(
                              _isUpdatingName
                                  ? 'Güncelleniyor...'
                                  : 'İsmi Güncelle',
                            ),
                            style: FilledButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                // Update Password Section
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Form(
                      key: _passwordFormKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Şifre Değiştir',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _currentPasswordController,
                            decoration: InputDecoration(
                              labelText: 'Mevcut Şifre',
                              prefixIcon: const Icon(Icons.lock_outline),
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _obscureCurrentPassword
                                      ? Icons.visibility
                                      : Icons.visibility_off,
                                ),
                                onPressed: () {
                                  setState(() {
                                    _obscureCurrentPassword =
                                        !_obscureCurrentPassword;
                                  });
                                },
                              ),
                              border: const OutlineInputBorder(),
                            ),
                            obscureText: _obscureCurrentPassword,
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Mevcut şifrenizi giriniz';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _newPasswordController,
                            decoration: InputDecoration(
                              labelText: 'Yeni Şifre',
                              prefixIcon: const Icon(Icons.lock),
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _obscureNewPassword
                                      ? Icons.visibility
                                      : Icons.visibility_off,
                                ),
                                onPressed: () {
                                  setState(() {
                                    _obscureNewPassword = !_obscureNewPassword;
                                  });
                                },
                              ),
                              border: const OutlineInputBorder(),
                            ),
                            obscureText: _obscureNewPassword,
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Yeni şifrenizi giriniz';
                              }
                              if (value.length < 6) {
                                return 'Şifre en az 6 karakter olmalıdır';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _confirmPasswordController,
                            decoration: InputDecoration(
                              labelText: 'Yeni Şifre (Tekrar)',
                              prefixIcon: const Icon(Icons.lock),
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _obscureConfirmPassword
                                      ? Icons.visibility
                                      : Icons.visibility_off,
                                ),
                                onPressed: () {
                                  setState(() {
                                    _obscureConfirmPassword =
                                        !_obscureConfirmPassword;
                                  });
                                },
                              ),
                              border: const OutlineInputBorder(),
                            ),
                            obscureText: _obscureConfirmPassword,
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Yeni şifrenizi tekrar giriniz';
                              }
                              if (value != _newPasswordController.text) {
                                return 'Şifreler eşleşmiyor';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          FilledButton.icon(
                            onPressed: _isUpdatingPassword
                                ? null
                                : _updatePassword,
                            icon: _isUpdatingPassword
                                ? const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.white,
                                    ),
                                  )
                                : const Icon(Icons.check),
                            label: Text(
                              _isUpdatingPassword
                                  ? 'Güncelleniyor...'
                                  : 'Şifreyi Güncelle',
                            ),
                            style: FilledButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                          ),
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.blue.shade50,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.info_outline,
                                  size: 20,
                                  color: Colors.blue.shade900,
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    'Güvenlik nedeniyle mevcut şifrenizi girmeniz gerekiyor',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.blue.shade900,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: Colors.grey.shade600),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  String _getRoleLabel(String? role) {
    if (role == null || role.isEmpty) {
      return 'Belirtilmemiş';
    }
    switch (role) {
      case 'admin':
        return 'Yönetici';
      case 'owner':
        return 'Sahip';
      case 'employee':
        return 'Çalışan';
      default:
        return role;
    }
  }
}
