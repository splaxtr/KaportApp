import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/shop_model.dart';
import '../models/user_model.dart';
import '../state/user_session.dart';

class AdminDashboardScreen extends ConsumerWidget {
  const AdminDashboardScreen({super.key});

  static const String routeName = '/adminDashboard';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(userSessionProvider);
    final authService = ref.watch(authServiceProvider);

    return session.when(
      loading: () =>
          const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (error, _) => Scaffold(body: Center(child: Text('Hata: $error'))),
      data: (user) {
        if (user == null || user.role != 'admin') {
          return const Scaffold(
            body: Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text('Bu sayfaya yalnızca yöneticiler erişebilir.'),
              ),
            ),
          );
        }

        final shopsAsync = ref.watch(shopsStreamProvider);
        final usersAsync = ref.watch(usersStreamProvider);

        if (shopsAsync.isLoading || usersAsync.isLoading) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        final shopsError = shopsAsync.asError;
        final usersError = usersAsync.asError;
        if (shopsError != null || usersError != null) {
          final message =
              shopsError?.error ?? usersError?.error ?? 'Bilinmeyen hata';
          return Scaffold(
            body: Center(child: Text('Veriler alınamadı: $message')),
          );
        }

        final shops = shopsAsync.value ?? const <ShopModel>[];
        final users = usersAsync.value ?? const <UserModel>[];
        final userById = {for (final u in users) u.id: u};
        final shopNameById = {for (final shop in shops) shop.id: shop.name};

        return Scaffold(
          appBar: AppBar(
            title: const Text('Yönetici Paneli'),
            actions: [
              IconButton(
                tooltip: 'Çıkış Yap',
                onPressed: () async {
                  await authService.signOut();
                  
                },
                icon: const Icon(Icons.logout),
              ),
            ],
          ),
          floatingActionButton: FloatingActionButton.extended(
            onPressed: () async {
              final created = await showDialog<bool>(
                context: context,
                barrierDismissible: false,
                builder: (context) => CreateShopDialog(admin: user),
              );
              if (created == true && context.mounted) {
                ScaffoldMessenger.of(context)
                  ..hideCurrentSnackBar()
                  ..showSnackBar(
                    const SnackBar(
                      content: Text('Dükkan başarıyla oluşturuldu.'),
                    ),
                  );
              }
            },
            icon: const Icon(Icons.add_business),
            label: const Text('Yeni Dükkan Oluştur'),
          ),
          body: Padding(
            padding: const EdgeInsets.all(16),
            child: LayoutBuilder(
              builder: (context, constraints) {
                final isWide = constraints.maxWidth >= 900;
                final shopsSection = ShopsSection(
                  shops: shops,
                  ownerById: userById,
                );
                final usersSection = UsersSection(
                  users: users,
                  shopNameById: shopNameById,
                );

                if (isWide) {
                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(child: shopsSection),
                      const SizedBox(width: 16),
                      Expanded(child: usersSection),
                    ],
                  );
                }

                return ListView(
                  children: [
                    shopsSection,
                    const SizedBox(height: 16),
                    usersSection,
                  ],
                );
              },
            ),
          ),
        );
      },
    );
  }
}

class ShopsSection extends StatelessWidget {
  const ShopsSection({required this.shops, required this.ownerById, super.key});

  final List<ShopModel> shops;
  final Map<String, UserModel> ownerById;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Aktif Dükkanlar', style: theme.textTheme.titleLarge),
            const SizedBox(height: 12),
            if (shops.isEmpty)
              const Text('Henüz kayıtlı dükkan yok.')
            else
              Column(
                children: [
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: DataTable(
                      columns: const [
                        DataColumn(label: Text('Adı')),
                        DataColumn(label: Text('Sahip')),
                        DataColumn(label: Text('Oluşturulma')),
                        DataColumn(label: Text('İşlemler')),
                      ],
                      rows: shops
                          .map(
                            (shop) => DataRow(
                              cells: [
                                DataCell(Text(shop.name)),
                                DataCell(
                                  Text(
                                    ownerById[shop.ownerId]?.email ??
                                        'Bilinmiyor',
                                  ),
                                ),
                                DataCell(
                                  Text(_formatDate(context, shop.createdAt)),
                                ),
                                DataCell(
                                  TextButton.icon(
                                    onPressed: () {
                                      ScaffoldMessenger.of(context)
                                        ..hideCurrentSnackBar()
                                        ..showSnackBar(
                                          const SnackBar(
                                            content: Text(
                                              'Detay ekranı yakında.',
                                            ),
                                          ),
                                        );
                                    },
                                    icon: const Icon(Icons.open_in_new),
                                    label: const Text('Detay'),
                                  ),
                                ),
                              ],
                            ),
                          )
                          .toList(),
                    ),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }

  String _formatDate(BuildContext context, DateTime? date) {
    if (date == null) return '-';
    final localizations = MaterialLocalizations.of(context);
    return localizations.formatMediumDate(date);
  }
}

class UsersSection extends StatelessWidget {
  const UsersSection({
    required this.users,
    required this.shopNameById,
    super.key,
  });

  final List<UserModel> users;
  final Map<String, String> shopNameById;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Kayıtlı Kullanıcılar', style: theme.textTheme.titleLarge),
            const SizedBox(height: 12),
            if (users.isEmpty)
              const Text('Henüz kullanıcı yok.')
            else
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: DataTable(
                  columns: const [
                    DataColumn(label: Text('Adı')),
                    DataColumn(label: Text('E-posta')),
                    DataColumn(label: Text('Rol')),
                    DataColumn(label: Text('Dükkan')),
                  ],
                  rows: users
                      .map(
                        (user) => DataRow(
                          cells: [
                            DataCell(Text(user.name.isEmpty ? '-' : user.name)),
                            DataCell(Text(user.email)),
                            DataCell(Text(user.role)),
                            DataCell(
                              Text(
                                user.shopId != null && user.shopId!.isNotEmpty
                                    ? shopNameById[user.shopId] ?? user.shopId!
                                    : 'Atanmamış',
                              ),
                            ),
                          ],
                        ),
                      )
                      .toList(),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class CreateShopDialog extends ConsumerStatefulWidget {
  const CreateShopDialog({required this.admin, super.key});

  final UserModel admin;

  @override
  ConsumerState<CreateShopDialog> createState() => _CreateShopDialogState();
}

class _CreateShopDialogState extends ConsumerState<CreateShopDialog> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _nameController = TextEditingController();
  String? _selectedOwnerId;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final availableOwners = ref.watch(availableOwnersProvider);
    final shopService = ref.watch(shopServiceProvider);

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: availableOwners.when(
          loading: () => const SizedBox(
            height: 160,
            child: Center(child: CircularProgressIndicator()),
          ),
          error: (error, _) => SizedBox(
            height: 160,
            child: Center(child: Text('Kullanıcılar yüklenemedi: $error')),
          ),
          data: (owners) {
            if (owners.isEmpty) {
              return const SizedBox(
                height: 160,
                child: Center(child: Text('Uygun kullanıcı bulunamadı.')),
              );
            }

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Yeni Dükkan Oluştur',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 16),
                Form(
                  key: _formKey,
                  child: Column(
                    children: [
                      TextFormField(
                        controller: _nameController,
                        decoration: const InputDecoration(
                          labelText: 'Dükkan adı',
                        ),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Dükkan adı giriniz';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      DropdownButtonFormField<String>(
                        decoration: const InputDecoration(
                          labelText: 'Sahip seç',
                        ),
                        initialValue: _selectedOwnerId,
                        items: owners
                            .map(
                              (user) => DropdownMenuItem(
                                value: user.id,
                                child: Text(user.email),
                              ),
                            )
                            .toList(),
                        onChanged: (value) => setState(() {
                          _selectedOwnerId = value;
                        }),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Bir kullanıcı seçiniz';
                          }
                          return null;
                        },
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: _isSubmitting
                          ? null
                          : () => Navigator.pop(context, false),
                      child: const Text('İptal'),
                    ),
                    const SizedBox(width: 12),
                    FilledButton.icon(
                      onPressed: _isSubmitting
                          ? null
                          : () async {
                              if (!_formKey.currentState!.validate()) {
                                return;
                              }
                              setState(() {
                                _isSubmitting = true;
                              });
                              try {
                                await shopService.createShop(
                                  actor: widget.admin,
                                  name: _nameController.text.trim(),
                                  ownerId: _selectedOwnerId!,
                                );
                                if (context.mounted) {
                                  Navigator.pop(context, true);
                                }
                              } catch (error) {
                                if (!context.mounted) return;
                                ScaffoldMessenger.of(context)
                                  ..hideCurrentSnackBar()
                                  ..showSnackBar(
                                    SnackBar(
                                      content: Text(
                                        'Dükkan oluşturulamadı: $error',
                                      ),
                                    ),
                                  );
                              } finally {
                                if (mounted) {
                                  setState(() {
                                    _isSubmitting = false;
                                  });
                                }
                              }
                            },
                      icon: _isSubmitting
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.check),
                      label: const Text('Oluştur'),
                    ),
                  ],
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}
