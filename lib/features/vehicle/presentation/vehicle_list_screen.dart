import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:kaportapp/core/models/vehicle_model.dart';
import 'package:kaportapp/core/services/vehicle_service.dart';
import 'package:kaportapp/core/state/user_session.dart';
import 'package:kaportapp/features/vehicle/application/vehicle_providers.dart';

import 'add_vehicle_screen.dart';

/// Screen displaying list of vehicles for the user's shop
class VehicleListScreen extends ConsumerWidget {
  const VehicleListScreen({super.key});

  static const String routeName = '/vehicleList';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userState = ref.watch(userSessionProvider);

    return userState.when(
      data: (user) {
        if (user == null || user.shopId == null || user.shopId!.isEmpty) {
          return Scaffold(
            appBar: AppBar(title: const Text('Araç Listesi')),
            body: const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  'Bu ekrana erişmek için bir dükkana atanmış olmalısınız.',
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          );
        }

        final vehiclesAsync = ref.watch(vehiclesStreamProvider(user.shopId!));

        return Scaffold(
          appBar: AppBar(
            title: const Text('Araç Listesi'),
            actions: [
              IconButton(
                icon: const Icon(Icons.add),
                tooltip: 'Yeni Araç Ekle',
                onPressed: () {
                  Navigator.pushNamed(context, AddVehicleScreen.routeName);
                },
              ),
            ],
          ),
          body: vehiclesAsync.when(
            data: (vehicles) {
              if (vehicles.isEmpty) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.directions_car,
                        size: 64,
                        color: Colors.grey,
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'Henüz araç eklenmemiş',
                        style: TextStyle(fontSize: 18, color: Colors.grey),
                      ),
                      const SizedBox(height: 24),
                      FilledButton.icon(
                        onPressed: () {
                          Navigator.pushNamed(
                            context,
                            AddVehicleScreen.routeName,
                          );
                        },
                        icon: const Icon(Icons.add),
                        label: const Text('İlk Aracı Ekle'),
                      ),
                    ],
                  ),
                );
              }

              return ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: vehicles.length,
                itemBuilder: (context, index) {
                  final vehicle = vehicles[index];
                  return _VehicleCard(vehicle: vehicle, user: user);
                },
              );
            },
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, stack) => Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.error_outline,
                      size: 64,
                      color: Colors.red,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Araçlar yüklenirken hata oluştu:\n$error',
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.red),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
      loading: () =>
          const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (error, stack) => Scaffold(
        appBar: AppBar(title: const Text('Araç Listesi')),
        body: Center(child: Text('Kullanıcı bilgisi alınamadı: $error')),
      ),
    );
  }
}

class _VehicleCard extends ConsumerWidget {
  const _VehicleCard({required this.vehicle, required this.user});

  final VehicleModel vehicle;
  final dynamic user;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ExpansionTile(
        leading: CircleAvatar(
          backgroundColor: theme.colorScheme.primaryContainer,
          child: Text(
            vehicle.brand.isNotEmpty ? vehicle.brand[0].toUpperCase() : 'A',
            style: TextStyle(
              color: theme.colorScheme.onPrimaryContainer,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        title: Text(
          '${vehicle.brand} ${vehicle.model}',
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Text('Plaka: ${vehicle.plate} • ${vehicle.year}'),
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _DetailRow(label: 'Müşteri', value: vehicle.customerName),
                const SizedBox(height: 8),
                _DetailRow(
                  label: 'Oluşturulma',
                  value: vehicle.createdAt != null
                      ? MaterialLocalizations.of(
                          context,
                        ).formatMediumDate(vehicle.createdAt!.toDate())
                      : '-',
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton.icon(
                      onPressed: () async {
                        final confirmed = await showDialog<bool>(
                          context: context,
                          builder: (context) => AlertDialog(
                            title: const Text('Aracı Sil'),
                            content: Text(
                              '${vehicle.brand} ${vehicle.model} (${vehicle.plate}) aracını silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz ve araçla ilişkili tüm parçalar da silinecektir.',
                            ),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.pop(context, false),
                                child: const Text('İptal'),
                              ),
                              FilledButton(
                                onPressed: () => Navigator.pop(context, true),
                                style: FilledButton.styleFrom(
                                  backgroundColor: Colors.red,
                                ),
                                child: const Text('Sil'),
                              ),
                            ],
                          ),
                        );

                        if (confirmed == true && context.mounted) {
                          try {
                            final service = ref.read(vehicleServiceProvider);
                            await service.deleteItem(vehicle.id);

                            if (context.mounted) {
                              ScaffoldMessenger.of(context)
                                ..hideCurrentSnackBar()
                                ..showSnackBar(
                                  const SnackBar(
                                    content: Text('Araç başarıyla silindi'),
                                    backgroundColor: Colors.green,
                                  ),
                                );
                            }
                          } on VehicleServiceException catch (e) {
                            if (context.mounted) {
                              ScaffoldMessenger.of(context)
                                ..hideCurrentSnackBar()
                                ..showSnackBar(
                                  SnackBar(
                                    content: Text(e.message),
                                    backgroundColor: Colors.red,
                                  ),
                                );
                            }
                          }
                        }
                      },
                      icon: const Icon(Icons.delete, color: Colors.red),
                      label: const Text(
                        'Sil',
                        style: TextStyle(color: Colors.red),
                      ),
                    ),
                    const SizedBox(width: 8),
                    FilledButton.icon(
                      onPressed: () {
                        // TODO: Navigate to vehicle detail/edit screen
                        ScaffoldMessenger.of(context)
                          ..hideCurrentSnackBar()
                          ..showSnackBar(
                            const SnackBar(
                              content: Text(
                                'Düzenleme ekranı yakında eklenecek',
                              ),
                            ),
                          );
                      },
                      icon: const Icon(Icons.edit),
                      label: const Text('Düzenle'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 100,
          child: Text(
            '$label:',
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
        ),
        Expanded(child: Text(value)),
      ],
    );
  }
}
