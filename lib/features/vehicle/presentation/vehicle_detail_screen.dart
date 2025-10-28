import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:kaportapp/core/models/part_model.dart';
import 'package:kaportapp/core/services/part_service.dart';
import 'package:kaportapp/core/state/user_session.dart';
import 'package:kaportapp/features/part/presentation/widgets/multi_part_entry_dialog.dart';
import 'package:kaportapp/features/vehicle/application/vehicle_providers.dart';
import 'package:kaportapp/features/part/application/part_providers.dart';

class VehicleDetailScreen extends ConsumerStatefulWidget {
  const VehicleDetailScreen({super.key, required this.vehicleId});

  final String vehicleId;
  static const String routeName = '/vehicleDetail';

  @override
  ConsumerState<VehicleDetailScreen> createState() =>
      _VehicleDetailScreenState();
}

class _VehicleDetailScreenState extends ConsumerState<VehicleDetailScreen> {
  Future<void> _showMultiPartDialog() async {
    final userState = ref.read(userSessionProvider);
    final user = userState.value;
    if (user == null) return;

    final addedCount = await showDialog<int>(
      context: context,
      builder: (context) =>
          MultiPartEntryDialog(vehicleId: widget.vehicleId, actor: user),
    );

    if (!mounted || addedCount == null || addedCount <= 0) return;

    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text('$addedCount parça eklendi.'),
          backgroundColor: Colors.green,
        ),
      );
  }

  Future<void> _showEditPartDialog(PartModel part) async {
    final nameController = TextEditingController(text: part.name);
    final quantityController = TextEditingController(
      text: part.quantity.toString(),
    );
    var selectedStatus = part.status;

    final result = await showDialog<bool>(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              title: const Text('Parçayı Düzenle'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: nameController,
                    decoration: const InputDecoration(
                      labelText: 'Parça Adı',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: quantityController,
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    decoration: const InputDecoration(
                      labelText: 'Miktar',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: selectedStatus,
                    decoration: const InputDecoration(
                      labelText: 'Durum',
                      border: OutlineInputBorder(),
                    ),
                    items: const [
                      DropdownMenuItem(
                        value: 'pending',
                        child: Text('Beklemede'),
                      ),
                      DropdownMenuItem(
                        value: 'ordered',
                        child: Text('Sipariş Verildi'),
                      ),
                      DropdownMenuItem(
                        value: 'installed',
                        child: Text('Takıldı'),
                      ),
                    ],
                    onChanged: (value) {
                      if (value != null) {
                        setState(() => selectedStatus = value);
                      }
                    },
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(false),
                  child: const Text('İptal'),
                ),
                FilledButton(
                  onPressed: () => Navigator.of(context).pop(true),
                  child: const Text('Kaydet'),
                ),
              ],
            );
          },
        );
      },
    );

    if (result != true || !mounted) return;

    final newName = nameController.text.trim();
    final quantity = int.tryParse(quantityController.text.trim());
    if (newName.isEmpty || quantity == null || quantity < 1) {
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          const SnackBar(
            content: Text('Geçerli bir ad ve miktar giriniz'),
            backgroundColor: Colors.red,
          ),
        );
      return;
    }

    try {
      final service = ref.read(partServiceProvider);
      final user = ref.read(userSessionProvider).value;
      if (user == null) return;

      await service.updatePart(
        actor: user,
        partId: part.id,
        updates: {
          'name': newName,
          'quantity': quantity,
          'status': selectedStatus,
        },
      );

      if (!mounted) return;
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          const SnackBar(
            content: Text('Parça güncellendi.'),
            backgroundColor: Colors.green,
          ),
        );
    } on PartServiceException catch (e) {
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
    }
  }

  Future<void> _deletePart(PartModel part) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Parçayı Sil'),
        content: Text(
          '${part.name} parçasını silmek istediğinize emin misiniz?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('İptal'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Sil'),
          ),
        ],
      ),
    );

    if (confirm != true || !mounted) return;

    try {
      final service = ref.read(partServiceProvider);
      final user = ref.read(userSessionProvider).value;
      if (user == null) return;

      await service.deletePart(actor: user, partId: part.id);

      if (!mounted) return;
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          SnackBar(
            content: Text('${part.name} silindi'),
            backgroundColor: Colors.green,
          ),
        );
    } on PartServiceException catch (e) {
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
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'pending':
        return Colors.orange;
      case 'ordered':
        return Colors.blue;
      case 'installed':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'pending':
        return 'Beklemede';
      case 'ordered':
        return 'Sipariş Verildi';
      case 'installed':
        return 'Takıldı';
      default:
        return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    final userState = ref.watch(userSessionProvider);

    return userState.when(
      data: (user) {
        if (user == null) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        final shopId = user.shopId;
        if (shopId == null || shopId.isEmpty) {
          return Scaffold(
            appBar: AppBar(title: const Text('Araç Detayı')),
            body: const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  'Bu ekrana erişmek için bir dükkana atanmış olmalısınız.',
                ),
              ),
            ),
          );
        }

        final vehicleAsync = ref.watch(vehicleByIdProvider(widget.vehicleId));
        final partsAsync = ref.watch(
          partsByVehicleProvider((vehicleId: widget.vehicleId, shopId: shopId)),
        );

        return Scaffold(
          appBar: AppBar(
            title: const Text('Araç Detayı'),
            actions: [
              IconButton(
                onPressed: _showMultiPartDialog,
                icon: const Icon(Icons.add),
              ),
            ],
          ),
          body: vehicleAsync.when(
            data: (vehicle) {
              if (vehicle == null) {
                return const Center(child: Text('Araç bulunamadı.'));
              }

              return Column(
                children: [
                  Card(
                    margin: const EdgeInsets.all(16),
                    child: ListTile(
                      title: Text('${vehicle.brand} ${vehicle.model}'),
                      subtitle: Text('Plaka: ${vehicle.plate}'),
                    ),
                  ),
                  Expanded(
                    child: partsAsync.when(
                      data: (parts) {
                        if (parts.isEmpty) {
                          return Center(
                            child: Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 24,
                              ),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.inventory_2_outlined,
                                    size: 64,
                                    color: Colors.grey.shade400,
                                  ),
                                  const SizedBox(height: 16),
                                  Text(
                                    'Bu araca bağlı parça yok',
                                    style: TextStyle(
                                      fontSize: 16,
                                      color: Colors.grey.shade600,
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  Text(
                                    'Yeni parçaları eklerken açılan penceredeki çok satırlı alana '
                                    'her satıra bir parça adı yazın. Kaydetmeden önce listeden '
                                    'eklemek istediklerinizi işaretleyebilirsiniz.',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      color: Colors.grey.shade600,
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  TextButton.icon(
                                    onPressed: _showMultiPartDialog,
                                    icon: const Icon(Icons.add),
                                    label: const Text('İlk parçayı ekle'),
                                  ),
                                ],
                              ),
                            ),
                          );
                        }

                        return ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: parts.length,
                          itemBuilder: (context, index) {
                            final part = parts[index];
                            return Card(
                              margin: const EdgeInsets.only(bottom: 12),
                              child: ListTile(
                                contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 12,
                                ),
                                title: Text(
                                  part.name,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const SizedBox(height: 4),
                                    Text('Miktar: ${part.quantity}'),
                                    const SizedBox(height: 4),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 4,
                                      ),
                                      decoration: BoxDecoration(
                                        color: _statusColor(part.status),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        _statusLabel(part.status),
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 11,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                trailing: PopupMenuButton<String>(
                                  onSelected: (value) {
                                    if (value == 'edit') {
                                      _showEditPartDialog(part);
                                    } else if (value == 'delete') {
                                      _deletePart(part);
                                    }
                                  },
                                  itemBuilder: (context) => const [
                                    PopupMenuItem(
                                      value: 'edit',
                                      child: Row(
                                        children: [
                                          Icon(Icons.edit, size: 20),
                                          SizedBox(width: 8),
                                          Text('Düzenle'),
                                        ],
                                      ),
                                    ),
                                    PopupMenuItem(
                                      value: 'delete',
                                      child: Row(
                                        children: [
                                          Icon(
                                            Icons.delete,
                                            size: 20,
                                            color: Colors.red,
                                          ),
                                          SizedBox(width: 8),
                                          Text(
                                            'Sil',
                                            style: TextStyle(color: Colors.red),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        );
                      },
                      error: (error, _) =>
                          Center(child: Text('Parçalar yüklenemedi: $error')),
                      loading: () =>
                          const Center(child: CircularProgressIndicator()),
                    ),
                  ),
                ],
              );
            },
            error: (error, _) =>
                Center(child: Text('Araç yüklenemedi: $error')),
            loading: () => const Center(child: CircularProgressIndicator()),
          ),
        );
      },
      error: (error, _) => Scaffold(body: Center(child: Text('Hata: $error'))),
      loading: () =>
          const Scaffold(body: Center(child: CircularProgressIndicator())),
    );
  }
}
