import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:kaportapp/core/state/user_session.dart';
import 'package:kaportapp/features/auth/presentation/login_screen.dart';
import 'package:kaportapp/features/part/presentation/manage_part_statuses_screen.dart';
import 'package:kaportapp/features/profile/presentation/profile_screen.dart';
import 'package:kaportapp/features/vehicle/application/vehicle_providers.dart';
import 'package:kaportapp/features/vehicle/presentation/add_vehicle_screen.dart';
import 'package:kaportapp/features/vehicle/presentation/assign_employee_screen.dart';
import 'package:kaportapp/features/vehicle/presentation/vehicle_detail_screen.dart';

/// Dashboard screen for shop owners
/// Shows three tabs: Vehicles, Stock (Parts), and Employees
class OwnerDashboardScreen extends ConsumerWidget {
  const OwnerDashboardScreen({super.key});

  static const String routeName = '/ownerDashboard';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(userSessionProvider);

    if (user == null) {
      return const LoginScreen();
    }

    if (user.role != 'owner') {
      return const Scaffold(
        body: Center(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.block, size: 64, color: Colors.red),
                SizedBox(height: 16),
                Text(
                  'Yetki Yok',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  'Bu ekrana sadece dükkan sahipleri erişebilir.',
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      );
    }

    PreferredSizeWidget buildAppBar({bool withTabs = false}) {
      return AppBar(
        title: Text('Hoş geldiniz, ${user.name}'),
        actions: [
          IconButton(
            icon: const Icon(Icons.fact_check_outlined),
            tooltip: 'Parça Durumları',
            onPressed: withTabs
                ? () {
                    Navigator.pushNamed(
                      context,
                      ManagePartStatusesScreen.routeName,
                    );
                  }
                : null,
          ),
          IconButton(
            icon: const Icon(Icons.person),
            tooltip: 'Profil',
            onPressed: () {
              Navigator.pushNamed(context, ProfileScreen.routeName);
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Çıkış Yap',
            onPressed: () async {
              await ref.read(authServiceProvider).signOut();
              ref.invalidate(userSessionProvider);
            },
          ),
        ],
        bottom: withTabs
            ? const TabBar(
                tabs: [
                  Tab(icon: Icon(Icons.directions_car), text: 'Araçlar'),
                  Tab(icon: Icon(Icons.people), text: 'Çalışanlar'),
                ],
              )
            : null,
      );
    }

    if (user.shopId == null || user.shopId!.isEmpty) {
      return Scaffold(
        appBar: buildAppBar(withTabs: false),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: const [
                Icon(
                  Icons.store_mall_directory_outlined,
                  size: 64,
                  color: Colors.orange,
                ),
                SizedBox(height: 16),
                Text(
                  'Dükkan Bulunamadı',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  'Bir dükkana atanmadınız. Yeni bir dükkana atanmak için yöneticinizle iletişime geçin.',
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      );
    }

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: buildAppBar(withTabs: true),
        body: TabBarView(
          children: [
            _VehiclesTab(shopId: user.shopId!),
            _EmployeesTab(shopId: user.shopId!),
          ],
        ),
      ),
    );
  }
}

class _VehiclesTab extends ConsumerWidget {
  const _VehiclesTab({required this.shopId});

  final String shopId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final vehiclesAsync = ref.watch(vehiclesStreamProvider(shopId));

    return vehiclesAsync.when(
      data: (vehicles) {
        return Column(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${vehicles.length} Araç',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  FilledButton.icon(
                    onPressed: () {
                      Navigator.pushNamed(context, AddVehicleScreen.routeName);
                    },
                    icon: const Icon(Icons.add),
                    label: const Text('Araç Ekle'),
                  ),
                ],
              ),
            ),
            Expanded(
              child: vehicles.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.directions_car_outlined,
                            size: 64,
                            color: Colors.grey.shade400,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Henüz araç bulunmuyor',
                            style: TextStyle(
                              fontSize: 18,
                              color: Colors.grey.shade600,
                            ),
                          ),
                          const SizedBox(height: 8),
                          TextButton.icon(
                            onPressed: () {
                              Navigator.pushNamed(
                                context,
                                AddVehicleScreen.routeName,
                              );
                            },
                            icon: const Icon(Icons.add),
                            label: const Text('İlk aracı ekle'),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: vehicles.length,
                      itemBuilder: (context, index) {
                        final vehicle = vehicles[index];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 12),
                          child: ListTile(
                            contentPadding: const EdgeInsets.all(16),
                            leading: CircleAvatar(
                              backgroundColor: Theme.of(
                                context,
                              ).colorScheme.primaryContainer,
                              child: Icon(
                                Icons.directions_car,
                                color: Theme.of(
                                  context,
                                ).colorScheme.onPrimaryContainer,
                              ),
                            ),
                            title: Text(
                              '${vehicle.brand} ${vehicle.model}',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const SizedBox(height: 4),
                                Text('Plaka: ${vehicle.plate}'),
                                Text('Yıl: ${vehicle.year}'),
                                if (vehicle.customerName.isNotEmpty)
                                  Text('Müşteri: ${vehicle.customerName}'),
                              ],
                            ),
                            trailing: const Icon(Icons.chevron_right),
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => VehicleDetailScreen(
                                    vehicleId: vehicle.id,
                                  ),
                                ),
                              );
                            },
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
              Text('Araçlar yüklenemedi: $error'),
            ],
          ),
        ),
      ),
    );
  }
}

class _EmployeesTab extends ConsumerWidget {
  const _EmployeesTab({required this.shopId});

  final String shopId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final employeesAsync = ref.watch(shopUsersProvider(shopId));

    return employeesAsync.when(
      data: (employees) {
        return Column(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${employees.length} Çalışan',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  FilledButton.icon(
                    onPressed: () {
                      Navigator.pushNamed(
                        context,
                        AssignEmployeeScreen.routeName,
                      );
                    },
                    icon: const Icon(Icons.person_add),
                    label: const Text('Çalışan Ata'),
                  ),
                ],
              ),
            ),
            Expanded(
              child: employees.isEmpty
                  ? Center(
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
                            'Henüz çalışan bulunmuyor',
                            style: TextStyle(
                              fontSize: 18,
                              color: Colors.grey.shade600,
                            ),
                          ),
                          const SizedBox(height: 8),
                          TextButton.icon(
                            onPressed: () {
                              Navigator.pushNamed(
                                context,
                                AssignEmployeeScreen.routeName,
                              );
                            },
                            icon: const Icon(Icons.person_add),
                            label: const Text('İlk çalışanı ata'),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: employees.length,
                      itemBuilder: (context, index) {
                        final employee = employees[index];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 12),
                          child: ListTile(
                            contentPadding: const EdgeInsets.all(16),
                            leading: CircleAvatar(
                              backgroundColor: Theme.of(
                                context,
                              ).colorScheme.tertiaryContainer,
                              child: Icon(
                                Icons.person,
                                color: Theme.of(
                                  context,
                                ).colorScheme.onTertiaryContainer,
                              ),
                            ),
                            title: Text(
                              employee.name,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const SizedBox(height: 4),
                                Text(employee.email),
                                const SizedBox(height: 2),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 2,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.blue.shade100,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    'Çalışan',
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: Colors.blue.shade900,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            trailing: IconButton(
                              icon: const Icon(Icons.remove_circle_outline),
                              tooltip: 'Dükkanından çıkar',
                              onPressed: () async {
                                // Show confirmation dialog
                                final confirmed = await showDialog<bool>(
                                  context: context,
                                  builder: (context) => AlertDialog(
                                    title: const Text('Çalışanı Çıkar'),
                                    content: Text(
                                      '${employee.name} adlı çalışanı dükkanınızdan çıkarmak istediğinize emin misiniz?',
                                    ),
                                    actions: [
                                      TextButton(
                                        onPressed: () =>
                                            Navigator.of(context).pop(false),
                                        child: const Text('İptal'),
                                      ),
                                      FilledButton(
                                        onPressed: () =>
                                            Navigator.of(context).pop(true),
                                        style: FilledButton.styleFrom(
                                          backgroundColor: Colors.red,
                                        ),
                                        child: const Text('Çıkar'),
                                      ),
                                    ],
                                  ),
                                );

                                if (confirmed != true) return;

                                try {
                                  final user = ref.read(userSessionProvider);
                                  if (user == null) return;

                                  await ref
                                      .read(shopServiceProvider)
                                      .removeUserFromShop(
                                        actor: user,
                                        shopId: shopId,
                                        userId: employee.id,
                                      );

                                  if (context.mounted) {
                                    ScaffoldMessenger.of(context)
                                      ..hideCurrentSnackBar()
                                      ..showSnackBar(
                                        SnackBar(
                                          content: Text(
                                            '${employee.name} çıkarıldı',
                                          ),
                                          backgroundColor: Colors.green,
                                        ),
                                      );
                                  }
                                } catch (error) {
                                  if (context.mounted) {
                                    ScaffoldMessenger.of(context)
                                      ..hideCurrentSnackBar()
                                      ..showSnackBar(
                                        SnackBar(
                                          content: Text('Silinemedi: $error'),
                                          backgroundColor: Colors.red,
                                        ),
                                      );
                                  }
                                }
                              },
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
              Text('Çalışanlar yüklenemedi: $error'),
            ],
          ),
        ),
      ),
    );
  }
}
