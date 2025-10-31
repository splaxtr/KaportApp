import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:kaportapp/core/models/user_model.dart';
import 'package:kaportapp/core/services/shop_service.dart';
import 'package:kaportapp/core/services/user_service.dart';
import 'package:kaportapp/core/state/user_session.dart';

/// Screen for shop owners to assign employees to their shop
/// Only accessible by users with 'owner' role
class AssignEmployeeScreen extends ConsumerStatefulWidget {
  const AssignEmployeeScreen({super.key});

  static const String routeName = '/assignEmployee';

  @override
  ConsumerState<AssignEmployeeScreen> createState() =>
      _AssignEmployeeScreenState();
}

class _AssignEmployeeScreenState extends ConsumerState<AssignEmployeeScreen> {
  final TextEditingController _emailController = TextEditingController();
  bool _isEmailAssigning = false;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _assignEmployee(
    BuildContext context,
    WidgetRef ref,
    UserModel actor,
    String userId,
    String userName,
  ) async {
    // Show confirmation dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Çalışan Ata'),
        content: Text(
          '$userName adlı kullanıcıyı dükkanınıza atamak istediğinize emin misiniz?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('İptal'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Ata'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    if (!context.mounted) return;

    // Show loading indicator
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    try {
      final shopService = ref.read(shopServiceProvider);
      await shopService.assignEmployee(actor: actor, userId: userId);

      if (!context.mounted) return;

      // Close loading dialog
      Navigator.of(context).pop();

      // Show success message
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          SnackBar(
            content: Text('$userName başarıyla atandı'),
            backgroundColor: Colors.green,
          ),
        );
    } on ShopServiceException catch (e) {
      if (!context.mounted) return;

      // Close loading dialog
      Navigator.of(context).pop();

      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          SnackBar(content: Text(e.message), backgroundColor: Colors.red),
        );
    } catch (e) {
      if (!context.mounted) return;

      // Close loading dialog
      Navigator.of(context).pop();

      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          SnackBar(
            content: Text('Beklenmeyen hata: $e'),
            backgroundColor: Colors.red,
          ),
        );
    }
  }

  Future<void> _assignEmployeeByEmail(
    BuildContext context,
    UserModel owner,
  ) async {
    final messenger = ScaffoldMessenger.of(context);
    final email = _emailController.text.trim().toLowerCase();

    if (email.isEmpty) {
      messenger
        ..hideCurrentSnackBar()
        ..showSnackBar(
          const SnackBar(
            content: Text('E-posta adresi giriniz'),
            backgroundColor: Colors.orange,
          ),
        );
      return;
    }

    setState(() {
      _isEmailAssigning = true;
    });

    try {
      final userService = ref.read(userServiceProvider);
      final user = await userService.getItemByEmail(email);
      if (!mounted) return;

      if (user == null) {
        if (!mounted) return;
        messenger
          ..hideCurrentSnackBar()
          ..showSnackBar(
            SnackBar(
              content: Text(
                'Bu e-posta ile kayıtlı kullanıcı bulunamadı: $email',
              ),
              backgroundColor: Colors.red.shade600,
            ),
          );
        return;
      }

      if (user.role == 'admin' || user.role == 'owner') {
        if (!mounted) return;
        messenger
          ..hideCurrentSnackBar()
          ..showSnackBar(
            const SnackBar(
              content: Text(
                'Bu kullanıcı farklı bir role sahip. Çalışan atanamaz.',
              ),
              backgroundColor: Colors.orange,
            ),
          );
        return;
      }

      if (user.shopId != null && user.shopId!.isNotEmpty) {
        messenger
          ..hideCurrentSnackBar()
          ..showSnackBar(
            const SnackBar(
              content: Text('Bu kullanıcı zaten bir dükkana atanmış.'),
              backgroundColor: Colors.orange,
            ),
          );
        return;
      }

      if (!context.mounted) return;
      await _assignEmployee(
        context,
        ref,
        owner,
        user.id,
        user.name.isEmpty ? user.email : user.name,
      );

      if (mounted) {
        _emailController.clear();
      }
    } on UserServiceException catch (error) {
      if (!mounted) return;
      messenger
        ..hideCurrentSnackBar()
        ..showSnackBar(
          SnackBar(content: Text(error.message), backgroundColor: Colors.red),
        );
    } finally {
      if (mounted) {
        setState(() {
          _isEmailAssigning = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final owner = ref.watch(userSessionProvider);

    Widget content;
    if (owner == null) {
      content = const Center(child: CircularProgressIndicator());
    } else if (owner.role != 'owner') {
      content = const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.block, size: 64, color: Colors.red),
              SizedBox(height: 16),
              Text(
                'Yetki Yok',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 8),
              Text(
                'Bu ekrana sadece dükkan sahipleri erişebilir.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 16),
              ),
            ],
          ),
        ),
      );
    } else if (owner.shopId == null || owner.shopId!.isEmpty) {
      content = const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.store_mall_directory_outlined,
                size: 64,
                color: Colors.orange,
              ),
              SizedBox(height: 16),
              Text(
                'Dükkan Bulunamadı',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 8),
              Text(
                'Çalışan atamak için önce bir dükkana sahip olmalısınız.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 16),
              ),
            ],
          ),
        ),
      );
    } else {
      final unassignedUsersAsync = ref.watch(unassignedUsersProvider);
      content = unassignedUsersAsync.when(
        data: (users) {
          return Column(
            children: [
              Container(
                width: double.infinity,
                margin: const EdgeInsets.all(16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.blue.shade200),
                ),
                child: Row(
                  children: [
                    Icon(Icons.info_outline, color: Colors.blue.shade700),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Aşağıdaki kullanıcıları dükkanınıza atayabilir veya e-posta ile doğrudan ekleyebilirsiniz.',
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.blue.shade900,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _emailController,
                        enabled: !_isEmailAssigning,
                        keyboardType: TextInputType.emailAddress,
                        decoration: const InputDecoration(
                          labelText: 'E-posta ile çalışan ata',
                          hintText: 'calisan@example.com',
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    FilledButton(
                      onPressed: _isEmailAssigning
                          ? null
                          : () => _assignEmployeeByEmail(context, owner),
                      child: _isEmailAssigning
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('Ata'),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    users.isEmpty
                        ? 'Listelenecek kullanıcı bulunamadı.'
                        : '${users.length} kullanıcı bulundu',
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey.shade600,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
              Expanded(
                child: users.isEmpty
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.people_outline,
                                size: 64,
                                color: Colors.grey.shade400,
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'Listede atanabilecek kullanıcı yok.',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.grey.shade600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: users.length,
                        itemBuilder: (context, index) {
                          final unassignedUser = users[index];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            child: ListTile(
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 8,
                              ),
                              leading: CircleAvatar(
                                backgroundColor: Theme.of(
                                  context,
                                ).colorScheme.primaryContainer,
                                child: Icon(
                                  Icons.person,
                                  color: Theme.of(
                                    context,
                                  ).colorScheme.onPrimaryContainer,
                                ),
                              ),
                              title: Text(
                                unassignedUser.name.isEmpty
                                    ? unassignedUser.email
                                    : unassignedUser.name,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 16,
                                ),
                              ),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const SizedBox(height: 4),
                                  Text(
                                    unassignedUser.email,
                                    style: TextStyle(
                                      fontSize: 13,
                                      color: Colors.grey.shade600,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 2,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Colors.grey.shade200,
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text(
                                      'Atanmamış',
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: Colors.grey.shade700,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              trailing: FilledButton.icon(
                                onPressed: () => _assignEmployee(
                                  context,
                                  ref,
                                  owner,
                                  unassignedUser.id,
                                  unassignedUser.name.isEmpty
                                      ? unassignedUser.email
                                      : unassignedUser.name,
                                ),
                                icon: const Icon(Icons.add, size: 18),
                                label: const Text('Ata'),
                                style: FilledButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 16,
                                    vertical: 8,
                                  ),
                                ),
                              ),
                            ),
                          );
                        },
                      ),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 48, color: Colors.red),
                const SizedBox(height: 16),
                const Text(
                  'Hata Oluştu',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  'Kullanıcılar yüklenirken hata oluştu: $error',
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Çalışan Ata')),
      body: content,
    );
  }
}
