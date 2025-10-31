import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:kaportapp/core/models/part_status_model.dart';
import 'package:kaportapp/core/state/user_session.dart';
import 'package:kaportapp/features/part/application/part_status_providers.dart';

class ManagePartStatusesScreen extends ConsumerStatefulWidget {
  const ManagePartStatusesScreen({super.key});

  static const routeName = '/managePartStatuses';

  @override
  ConsumerState<ManagePartStatusesScreen> createState() =>
      _ManagePartStatusesScreenState();
}

class _ManagePartStatusesScreenState
    extends ConsumerState<ManagePartStatusesScreen> {
  Color _colorFromHex(String hex) {
    final cleaned = hex.replaceAll('#', '').toUpperCase();
    if (cleaned.length == 6) {
      final value = int.tryParse('FF$cleaned', radix: 16);
      if (value != null) {
        return Color(value);
      }
    } else if (cleaned.length == 8) {
      final value = int.tryParse(cleaned, radix: 16);
      if (value != null) {
        return Color(value);
      }
    }
    return Colors.grey;
  }

  Future<void> _showAddDialog(String shopId) async {
    final formKey = GlobalKey<FormState>();
    final nameController = TextEditingController();
    var selectedColor = PartStatusModel.defaultColorHex;

    final result = await showDialog<bool>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Yeni Durum Ekle'),
          content: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: nameController,
                  decoration: const InputDecoration(
                    labelText: 'Durum adı',
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Durum adı boş olamaz';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    'Renk şablonu',
                    style: Theme.of(context).textTheme.labelMedium,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: PartStatusModel.palette
                      .map(
                        (entry) => GestureDetector(
                          onTap: () => setDialogState(() {
                            selectedColor = entry.hex;
                          }),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 36,
                                height: 36,
                                decoration: BoxDecoration(
                                  color: _colorFromHex(entry.hex),
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: selectedColor == entry.hex
                                        ? Theme.of(context).colorScheme.primary
                                        : Colors.transparent,
                                    width: 3,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                entry.label,
                                style: Theme.of(
                                  context,
                                ).textTheme.bodySmall?.copyWith(fontSize: 11),
                              ),
                            ],
                          ),
                        ),
                      )
                      .toList(),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Vazgeç'),
            ),
            FilledButton(
              onPressed: () {
                if (formKey.currentState?.validate() ?? false) {
                  Navigator.of(context).pop(true);
                }
              },
              child: const Text('Kaydet'),
            ),
          ],
        ),
      ),
    );

    if (result != true) return;

    final service = ref.read(partStatusServiceProvider);
    try {
      await service.addStatus(
        shopId: shopId,
        name: nameController.text,
        colorHex: selectedColor,
      );
      if (mounted) {
        ScaffoldMessenger.of(context)
          ..hideCurrentSnackBar()
          ..showSnackBar(
            const SnackBar(
              content: Text('Durum eklendi'),
              backgroundColor: Colors.green,
            ),
          );
      }
    } on ArgumentError catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
          ..hideCurrentSnackBar()
          ..showSnackBar(
            SnackBar(content: Text(e.message), backgroundColor: Colors.red),
          );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
          ..hideCurrentSnackBar()
          ..showSnackBar(
            SnackBar(
              content: Text('Durum eklenemedi: $e'),
              backgroundColor: Colors.red,
            ),
          );
      }
    }
  }

  Future<void> _showEditDialog(String shopId, PartStatusModel status) async {
    final formKey = GlobalKey<FormState>();
    final nameController = TextEditingController(text: status.name);
    var selectedColor = PartStatusModel.ensurePaletteColor(status.colorHex);

    final result = await showDialog<bool>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Durumu Düzenle'),
          content: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: nameController,
                  decoration: const InputDecoration(
                    labelText: 'Durum adı',
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Durum adı boş olamaz';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    'Renk şablonu',
                    style: Theme.of(context).textTheme.labelMedium,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: PartStatusModel.palette
                      .map(
                        (entry) => GestureDetector(
                          onTap: () => setDialogState(() {
                            selectedColor = entry.hex;
                          }),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 36,
                                height: 36,
                                decoration: BoxDecoration(
                                  color: _colorFromHex(entry.hex),
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: selectedColor == entry.hex
                                        ? Theme.of(context).colorScheme.primary
                                        : Colors.transparent,
                                    width: 3,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                entry.label,
                                style: Theme.of(
                                  context,
                                ).textTheme.bodySmall?.copyWith(fontSize: 11),
                              ),
                            ],
                          ),
                        ),
                      )
                      .toList(),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Vazgeç'),
            ),
            FilledButton(
              onPressed: () {
                if (formKey.currentState?.validate() ?? false) {
                  Navigator.of(context).pop(true);
                }
              },
              child: const Text('Kaydet'),
            ),
          ],
        ),
      ),
    );

    if (result != true) return;

    final service = ref.read(partStatusServiceProvider);
    try {
      await service.updateStatus(
        shopId: shopId,
        statusId: status.id,
        name: nameController.text,
        colorHex: selectedColor,
      );
      if (mounted) {
        ScaffoldMessenger.of(context)
          ..hideCurrentSnackBar()
          ..showSnackBar(
            const SnackBar(
              content: Text('Durum güncellendi'),
              backgroundColor: Colors.green,
            ),
          );
      }
    } on ArgumentError catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
          ..hideCurrentSnackBar()
          ..showSnackBar(
            SnackBar(content: Text(e.message), backgroundColor: Colors.red),
          );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
          ..hideCurrentSnackBar()
          ..showSnackBar(
            SnackBar(
              content: Text('Durum güncellenemedi: $e'),
              backgroundColor: Colors.red,
            ),
          );
      }
    }
  }

  Future<void> _confirmDelete(String shopId, PartStatusModel status) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Durumu Sil'),
        content: Text(
          '"${status.name}" durumunu silmek istediğinize emin misiniz? Bu durumu kullanan parçalar "${PartStatusModel.defaultName}" durumuna çekilecektir.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Vazgeç'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Sil'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    final service = ref.read(partStatusServiceProvider);
    try {
      await service.deleteStatus(shopId: shopId, status: status);
      if (mounted) {
        ScaffoldMessenger.of(context)
          ..hideCurrentSnackBar()
          ..showSnackBar(
            const SnackBar(
              content: Text('Durum silindi'),
              backgroundColor: Colors.green,
            ),
          );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
          ..hideCurrentSnackBar()
          ..showSnackBar(
            SnackBar(
              content: Text('Durum silinemedi: $e'),
              backgroundColor: Colors.red,
            ),
          );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(userSessionProvider);

    if (user == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (user.shopId == null || user.shopId!.isEmpty) {
      return const Scaffold(
        body: Center(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Text(
              'Durum yönetimi için bir dükkana bağlı olmalısınız.',
            ),
          ),
        ),
      );
    }

    final shopId = user.shopId!;
    final statusesAsync = ref.watch(partStatusesProvider(shopId));
    final isOwner = user.role == 'owner';

    return Scaffold(
      appBar: AppBar(title: const Text('Parça Durumları')),
      floatingActionButton: isOwner
          ? FloatingActionButton.extended(
              onPressed: () => _showAddDialog(shopId),
              icon: const Icon(Icons.add),
              label: const Text('Yeni Durum Ekle'),
            )
          : null,
      body: statusesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) =>
            Center(child: Text('Durumlar yüklenemedi: $error')),
        data: (statuses) {
          if (statuses.isEmpty) {
            return const Center(child: Text('Durum bulunamadı'));
          }

          return ListView.builder(
            itemCount: statuses.length,
            padding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 8,
            ),
            itemBuilder: (context, index) {
              final status = statuses[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  leading: CircleAvatar(backgroundColor: status.color),
                  title: Text(status.name),
                  trailing: isOwner
                      ? Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: const Icon(Icons.edit),
                              onPressed: () => _showEditDialog(shopId, status),
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete_outline),
                              onPressed: () => _confirmDelete(
                                shopId,
                                status,
                              ),
                            ),
                          ],
                        )
                      : null,
                ),
              );
            },
          );
        },
      ),
    );
  }

}
