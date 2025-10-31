import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:kaportapp/core/state/user_session.dart';
import 'package:kaportapp/features/auth/presentation/login_screen.dart';
import 'package:kaportapp/features/profile/presentation/profile_screen.dart';
import 'package:kaportapp/features/vehicle/application/vehicle_providers.dart';
import 'package:kaportapp/features/vehicle/presentation/add_vehicle_screen.dart';
import 'package:kaportapp/features/vehicle/presentation/vehicle_detail_screen.dart';

/// Dashboard screen for employees
/// Shows two tabs: Vehicles and Stock (Parts)
class EmployeeDashboardScreen extends ConsumerWidget {
  const EmployeeDashboardScreen({super.key});

  static const String routeName = '/employeeDashboard';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(userSessionProvider);

    if (user == null) {
      return const LoginScreen();
    }

    if (user.role != 'employee') {
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
                  'Bu ekrana sadece çalışanlar erişebilir.',
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      );
    }

    PreferredSizeWidget buildAppBar() {
      return AppBar(
        title: Text('Hoş geldiniz, ${user.name}'),
        actions: [
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
      );
    }

    if (user.shopId == null || user.shopId!.isEmpty) {
      return Scaffold(
        appBar: buildAppBar(),
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
                  'Bir dükkana atanmadınız. Lütfen dükkan sahibi ile iletişime geçin.',
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: buildAppBar(),
      body: _VehiclesTab(shopId: user.shopId!),
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
