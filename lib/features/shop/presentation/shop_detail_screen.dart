import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:kaportapp/core/models/shop_model.dart';
import 'package:kaportapp/core/models/user_model.dart';
import 'package:kaportapp/core/models/vehicle_model.dart';
import 'package:kaportapp/core/state/user_session.dart';
import 'package:kaportapp/features/vehicle/presentation/vehicle_detail_screen.dart';

final _shopDetailProvider =
    StreamProvider.autoDispose.family<ShopModel?, String>((ref, shopId) {
  return ref.watch(shopServiceProvider).watchShop(shopId);
});

final _shopOwnerProvider =
    StreamProvider.autoDispose.family<UserModel?, String>((ref, ownerId) {
  return ref.watch(userServiceProvider).watchUserById(ownerId);
});

final _shopEmployeesProvider =
    StreamProvider.autoDispose.family<List<UserModel>, String>((ref, shopId) {
  return ref.watch(shopServiceProvider).watchShopEmployees(shopId);
});

final _shopVehiclesProvider =
    StreamProvider.autoDispose.family<List<VehicleModel>, String>((ref, shopId) {
  return ref.watch(shopServiceProvider).watchShopVehicles(shopId);
});

final _assignableEmployeesProvider =
    StreamProvider.autoDispose<List<UserModel>>((ref) {
  return ref.watch(shopServiceProvider).watchAssignableEmployees();
});

class ShopDetailScreen extends ConsumerWidget {
  const ShopDetailScreen({super.key, required this.shopId});

  static const routeName = '/shopDetail';

  final String shopId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final admin = ref.watch(userSessionProvider);

    if (admin == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (admin.role != 'admin') {
      return const Scaffold(
        body: Center(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Text('Bu ekrana yalnızca yöneticiler erişebilir.'),
          ),
        ),
      );
    }

    final shopAsync = ref.watch(_shopDetailProvider(shopId));

    return shopAsync.when(
      loading: () => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      ),
      error: (error, _) => Scaffold(
        appBar: AppBar(),
        body: Center(child: Text('Dükkan yüklenemedi: $error')),
      ),
      data: (shop) {
        if (shop == null) {
          return const Scaffold(
            body: Center(child: Text('Dükkan bulunamadı.')),
          );
        }

        final ownerAsync = ref.watch(_shopOwnerProvider(shop.ownerId));
        final employeesAsync = ref.watch(_shopEmployeesProvider(shopId));
        final vehiclesAsync = ref.watch(_shopVehiclesProvider(shopId));

        return Scaffold(
          appBar: AppBar(
            title: Text(shop.name),
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _ShopInfoCard(shop: shop, ownerAsync: ownerAsync),
                const SizedBox(height: 16),
                _EmployeesSection(
                  admin: admin,
                  shop: shop,
                  employeesAsync: employeesAsync,
                ),
                const SizedBox(height: 16),
                _VehiclesSection(
                  vehiclesAsync: vehiclesAsync,
                  shopId: shop.id,
                ),
                const SizedBox(height: 24),
                FilledButton.icon(
                  onPressed: () => _showAssignEmployeeDialog(
                    context,
                    ref,
                    admin,
                    shop,
                  ),
                  icon: const Icon(Icons.person_add_alt),
                  label: const Text('Çalışan Ata'),
                ),
                const SizedBox(height: 12),
                FilledButton.icon(
                  style: FilledButton.styleFrom(
                    backgroundColor: Colors.red.shade600,
                    foregroundColor: Colors.white,
                  ),
                  onPressed: () => _confirmDeleteShop(context, ref, admin, shop),
                  icon: const Icon(Icons.delete_forever),
                  label: const Text('Dükkanı Sil'),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _showAssignEmployeeDialog(
    BuildContext context,
    WidgetRef ref,
    UserModel admin,
    ShopModel shop,
  ) async {
    await showDialog<void>(
      context: context,
      builder: (dialogContext) {
        return Consumer(
          builder: (context, ref, _) {
            final assignableAsync = ref.watch(_assignableEmployeesProvider);

            return assignableAsync.when(
              loading: () => const AlertDialog(
                content: SizedBox(
                  height: 120,
                  child: Center(child: CircularProgressIndicator()),
                ),
              ),
              error: (error, _) => AlertDialog(
                title: const Text('Çalışan Ata'),
                content: Text('Kullanıcılar yüklenemedi: $error'),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.of(context).maybePop(),
                    child: const Text('Kapat'),
                  ),
                ],
              ),
              data: (users) {
                return AlertDialog(
                  title: const Text('Çalışan Ata'),
                  content: SizedBox(
                    width: 420,
                    child: users.isEmpty
                        ? const Padding(
                            padding: EdgeInsets.all(12),
                            child: Text(
                              'Atanabilir çalışan bulunamadı. Kullanıcıların dükkan ilişkilendirmesini kaldırarak tekrar deneyin.',
                            ),
                          )
                        : ListView.separated(
                            shrinkWrap: true,
                            itemCount: users.length,
                            separatorBuilder: (context, index) =>
                                const Divider(height: 1),
                            itemBuilder: (context, index) {
                              final user = users[index];
                              return ListTile(
                                title: Text(
                                  user.name.isEmpty ? user.email : user.name,
                                ),
                                subtitle: Text(user.email),
                                trailing: const Icon(Icons.chevron_right),
                                onTap: () async {
                                  try {
                                    await ref
                                        .read(shopServiceProvider)
                                        .addUserToShop(
                                          actor: admin,
                                          shopId: shop.id,
                                          userId: user.id,
                                        );
                                    if (!context.mounted) {
                                      return;
                                    }
                                    final messenger =
                                        ScaffoldMessenger.of(context);
                                    messenger
                                      ..hideCurrentSnackBar()
                                      ..showSnackBar(
                                        SnackBar(
                                          content: Text(
                                            '${user.name.isEmpty ? user.email : user.name} atandı.',
                                          ),
                                          backgroundColor: Colors.green,
                                        ),
                                      );
                                    Navigator.of(context).pop();
                                  } catch (error) {
                                    if (!context.mounted) {
                                      return;
                                    }
                                    final messenger =
                                        ScaffoldMessenger.of(context);
                                    messenger
                                      ..hideCurrentSnackBar()
                                      ..showSnackBar(
                                        SnackBar(
                                          content: Text('$error'),
                                          backgroundColor: Colors.red,
                                        ),
                                      );
                                  }
                                },
                              );
                            },
                          ),
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text('Kapat'),
                    ),
                  ],
                );
              },
            );
          },
        );
      },
    );
  }

  Future<void> _confirmDeleteShop(
    BuildContext context,
    WidgetRef ref,
    UserModel admin,
    ShopModel shop,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Dükkanı Sil'),
        content: Text('${shop.name} adlı dükkanı silmek üzeresiniz.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('İptal'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Sil'),
          ),
        ],
      ),
    );

    if (confirmed != true) {
      return;
    }

    try {
      await ref
          .read(shopServiceProvider)
          .deleteShop(actor: admin, shopId: shop.id);
      if (!context.mounted) {
        return;
      }
      final messenger = ScaffoldMessenger.of(context);
      messenger
        ..hideCurrentSnackBar()
        ..showSnackBar(
          SnackBar(
            content: Text('${shop.name} silindi'),
            backgroundColor: Colors.green,
          ),
        );
      Navigator.of(context).pop();
    } catch (error) {
      if (!context.mounted) {
        return;
      }
      final messenger = ScaffoldMessenger.of(context);
      messenger
        ..hideCurrentSnackBar()
        ..showSnackBar(
          SnackBar(
            content: Text('$error'),
            backgroundColor: Colors.red,
          ),
        );
    }
  }
}

class _ShopInfoCard extends StatelessWidget {
  const _ShopInfoCard({
    required this.shop,
    required this.ownerAsync,
  });

  final ShopModel shop;
  final AsyncValue<UserModel?> ownerAsync;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Mağaza Bilgileri',
              style: theme.textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            _InfoRow(label: 'Mağaza Adı', value: shop.name),
            const SizedBox(height: 8),
            _InfoRow(
              label: 'Sahip',
              value: ownerAsync.when(
                data: (owner) {
                  if (owner == null) {
                    return 'Bilinmiyor';
                  }
                  return owner.name.isEmpty ? owner.email : owner.name;
                },
                loading: () => 'Yükleniyor...',
                error: (error, _) => 'Hata: $error',
              ),
            ),
            const SizedBox(height: 8),
            _InfoRow(
              label: 'Oluşturulma',
              value: shop.createdAt == null
                  ? '-'
                  : MaterialLocalizations.of(context).formatShortDate(
                      shop.createdAt!,
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmployeesSection extends ConsumerWidget {
  const _EmployeesSection({
    required this.admin,
    required this.shop,
    required this.employeesAsync,
  });

  final UserModel admin;
  final ShopModel shop;
  final AsyncValue<List<UserModel>> employeesAsync;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Çalışanlar', style: theme.textTheme.titleLarge),
            const SizedBox(height: 12),
            employeesAsync.when(
              loading: () => const Center(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: CircularProgressIndicator(),
                ),
              ),
              error: (error, _) => Padding(
                padding: const EdgeInsets.all(8),
                child: Text('Çalışanlar yüklenemedi: $error'),
              ),
              data: (employees) {
                if (employees.isEmpty) {
                  return const Text('Bu dükkana atanmış çalışan yok.');
                }

                return ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: employees.length,
                  separatorBuilder: (context, index) =>
                      const Divider(height: 1),
                  itemBuilder: (context, index) {
                    final employee = employees[index];
                    return ListTile(
                      title: Text(
                        employee.name.isEmpty
                            ? employee.email
                            : employee.name,
                      ),
                      subtitle: Text(employee.email),
                      trailing: TextButton.icon(
                        onPressed: () async {
                          try {
                            await ref.read(shopServiceProvider).removeUserFromShop(
                                  actor: admin,
                                  shopId: shop.id,
                                  userId: employee.id,
                                );
                            if (!context.mounted) {
                              return;
                            }
                            final messenger =
                                ScaffoldMessenger.of(context);
                            messenger
                              ..hideCurrentSnackBar()
                              ..showSnackBar(
                                SnackBar(
                                  content: Text(
                                    '${employee.name.isEmpty ? employee.email : employee.name} çıkarıldı',
                                  ),
                                  backgroundColor: Colors.green,
                                ),
                              );
                          } catch (error) {
                            if (!context.mounted) {
                              return;
                            }
                            final messenger =
                                ScaffoldMessenger.of(context);
                            messenger
                              ..hideCurrentSnackBar()
                              ..showSnackBar(
                                SnackBar(
                                  content: Text('$error'),
                                  backgroundColor: Colors.red,
                                ),
                              );
                          }
                        },
                        icon: const Icon(Icons.remove_circle_outline),
                        label: const Text('Kaldır'),
                      ),
                    );
                  },
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _VehiclesSection extends StatelessWidget {
  const _VehiclesSection({
    required this.vehiclesAsync,
    required this.shopId,
  });

  final AsyncValue<List<VehicleModel>> vehiclesAsync;
  final String shopId;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Araçlar', style: theme.textTheme.titleLarge),
            const SizedBox(height: 12),
            vehiclesAsync.when(
              loading: () => const Center(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: CircularProgressIndicator(),
                ),
              ),
              error: (error, _) => Padding(
                padding: const EdgeInsets.all(8),
                child: Text('Araçlar yüklenemedi: $error'),
              ),
              data: (vehicles) {
                if (vehicles.isEmpty) {
                  return const Text('Bu dükkana ait araç bulunmuyor.');
                }

                return ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: vehicles.length,
                  separatorBuilder: (context, index) =>
                      const Divider(height: 1),
                  itemBuilder: (context, index) {
                    final vehicle = vehicles[index];
                    return ListTile(
                      title: Text('${vehicle.brand} ${vehicle.model}'),
                      subtitle: Text('${vehicle.plate} · ${vehicle.year}'),
                      trailing: TextButton(
                        onPressed: () {
                          Navigator.of(context).push(
                            MaterialPageRoute<void>(
                              builder: (_) => VehicleDetailScreen(
                                vehicleId: vehicle.id,
                              ),
                            ),
                          );
                        },
                        child: const Text('Detaylara Git'),
                      ),
                    );
                  },
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 120,
          child: Text(
            label,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: Colors.grey.shade600,
            ),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: theme.textTheme.bodyLarge,
          ),
        ),
      ],
    );
  }
}
