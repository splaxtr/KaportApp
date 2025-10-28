import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:kaportapp/core/models/user_model.dart';
import 'package:kaportapp/core/state/user_session.dart';

class ShopUsersScreen extends ConsumerStatefulWidget {
  const ShopUsersScreen({super.key});

  static const String routeName = '/shopUsers';

  @override
  ConsumerState<ShopUsersScreen> createState() => _ShopUsersScreenState();
}

class _ShopUsersScreenState extends ConsumerState<ShopUsersScreen> {
  final TextEditingController _emailController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _inviteUser(UserModel owner) async {
    final formKey = GlobalKey<FormState>();
    final shopService = ref.read(shopServiceProvider);
    final result = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Kullanıcı Davet Et'),
          content: Form(
            key: formKey,
            child: TextFormField(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(
                labelText: 'E-posta',
                prefixIcon: Icon(Icons.mail_outline),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'E-posta giriniz';
                }
                return null;
              },
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('İptal'),
            ),
            FilledButton.icon(
              onPressed: () {
                if (formKey.currentState!.validate()) {
                  Navigator.pop(context, true);
                }
              },
              icon: const Icon(Icons.person_add),
              label: const Text('Ekle'),
            ),
          ],
        );
      },
    );

    if (result != true || !mounted) return;

    final messenger = ScaffoldMessenger.of(context);
    try {
      await shopService.addUserToShopByEmail(
        actor: owner,
        shopId: owner.shopId!,
        email: _emailController.text,
      );

      messenger
        ..hideCurrentSnackBar()
        ..showSnackBar(
          const SnackBar(content: Text('Kullanıcı davet edildi.')),
        );
      _emailController.clear();
    } catch (error) {
      messenger
        ..hideCurrentSnackBar()
        ..showSnackBar(SnackBar(content: Text('Kullanıcı eklenemedi: $error')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(userSessionProvider);
    final owner = session.value;
    if (owner == null || owner.role != 'owner') {
      return const Scaffold(
        body: Center(
          child: Text('Bu sayfaya yalnızca dükkan sahipleri erişebilir.'),
        ),
      );
    }
    if (owner.shopId == null || owner.shopId!.isEmpty) {
      return const Scaffold(
        body: Center(child: Text('Dükkan ataması bulunamadı.')),
      );
    }

    final usersAsync = ref.watch(shopUsersProvider(owner.shopId!));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dükkan Kullanıcıları'),
        actions: [
          IconButton(
            onPressed: () => _inviteUser(owner),
            icon: const Icon(Icons.person_add),
          ),
        ],
      ),
      body: usersAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) =>
            Center(child: Text('Kullanıcılar yüklenemedi: $error')),
        data: (users) {
          if (users.isEmpty) {
            return const Center(child: Text('Bu dükkana ait çalışan yok.'));
          }
          return ListView.builder(
            itemCount: users.length,
            itemBuilder: (context, index) {
              final user = users[index];
              return ListTile(
                leading: const Icon(Icons.person_outline),
                title: Text(user.email),
                subtitle: Text('Rol: ${user.role}'),
              );
            },
          );
        },
      ),
    );
  }
}
