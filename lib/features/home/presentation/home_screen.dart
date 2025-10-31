import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:kaportapp/core/models/user_model.dart';
import 'package:kaportapp/core/state/user_session.dart';
import 'package:kaportapp/features/auth/presentation/login_screen.dart';
import 'package:kaportapp/features/dashboard/presentation/admin_dashboard_screen.dart';
import 'package:kaportapp/features/profile/presentation/profile_screen.dart';
import 'package:kaportapp/features/shop/presentation/shop_users_screen.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  static const String routeName = '/home';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authServiceProvider);
    final user = ref.watch(userSessionProvider);

    if (user == null) {
      return const LoginScreen();
    }

    final isAdmin = user.role == 'admin';
    final isOwner = user.role == 'owner';

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Hoş geldiniz, ${user.name.isEmpty ? user.email : user.name}',
        ),
        actions: [
          IconButton(
            onPressed: () async {
              await auth.signOut();
              ref.invalidate(userSessionProvider);
            },
            icon: const Icon(Icons.logout),
            tooltip: 'Çıkış Yap',
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _InfoTile(user: user),
          const SizedBox(height: 24),
          ListTile(
            leading: const Icon(Icons.person),
            title: const Text('Profil'),
            subtitle: const Text('İsim ve şifre değiştir'),
            onTap: () {
              Navigator.pushNamed(context, ProfileScreen.routeName);
            },
          ),
          if (isAdmin)
            ListTile(
              leading: const Icon(Icons.store_mall_directory),
              title: const Text('Yönetici Paneli'),
              subtitle: const Text('Dükkan oluşturma ve yönetim'),
              onTap: () {
                Navigator.pushNamed(
                  context,
                  AdminDashboardScreen.routeName,
                );
              },
            ),
          if (isOwner && user.shopId != null && user.shopId!.isNotEmpty)
            ListTile(
              leading: const Icon(Icons.group),
              title: const Text('Dükkan Kullanıcıları'),
              subtitle: const Text('Çalışan davet et ve yönet'),
              onTap: () {
                Navigator.pushNamed(context, ShopUsersScreen.routeName);
              },
            ),
        ],
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  const _InfoTile({required this.user});

  final UserModel user;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('E-posta: ${user.email}'),
            Text('Rol: ${user.role ?? 'Belirtilmemiş'}'),
            Text('Dükkan ID: ${user.shopId ?? '-'}'),
          ],
        ),
      ),
    );
  }
}
