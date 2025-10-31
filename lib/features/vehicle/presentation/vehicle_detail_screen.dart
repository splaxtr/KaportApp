import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:printing/printing.dart';

import 'package:kaportapp/core/models/part_model.dart';
import 'package:kaportapp/core/models/part_status_model.dart';
import 'package:kaportapp/core/models/vehicle_model.dart';
import 'package:kaportapp/core/services/part_service.dart';
import 'package:kaportapp/core/services/pdf_service.dart';
import 'package:kaportapp/core/state/user_session.dart';
import 'package:kaportapp/features/part/application/part_providers.dart';
import 'package:kaportapp/features/part/application/part_status_providers.dart';
import 'package:kaportapp/features/part/presentation/widgets/multi_part_entry_dialog.dart';
import 'package:kaportapp/features/vehicle/application/vehicle_providers.dart';

class VehicleDetailScreen extends ConsumerStatefulWidget {
  const VehicleDetailScreen({super.key, required this.vehicleId});

  final String vehicleId;
  static const String routeName = '/vehicleDetail';

  @override
  ConsumerState<VehicleDetailScreen> createState() =>
      _VehicleDetailScreenState();
}

class _VehicleDetailScreenState extends ConsumerState<VehicleDetailScreen> {
  bool _isExportingPdf = false;

  Future<void> _showMultiPartDialog(String shopId) async {
    final user = ref.read(userSessionProvider);
    if (user == null) return;

    final addedCount = await showDialog<int>(
      context: context,
      builder: (context) => MultiPartEntryDialog(
        vehicleId: widget.vehicleId,
        actor: user,
        shopId: shopId,
      ),
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

  Future<void> _exportPartsAsPdf({
    required VehicleModel vehicle,
    required List<PartModel> parts,
  }) async {
    if (_isExportingPdf) return;

    setState(() => _isExportingPdf = true);

    try {
      final pdfService = ref.read(pdfServiceProvider);
      final result = await pdfService.generatePartsReport(
        vehicle: vehicle,
        parts: parts,
      );

      if (!mounted) return;

      setState(() => _isExportingPdf = false);

      await showDialog<void>(
        context: context,
        builder: (dialogContext) {
          return AlertDialog(
            title: const Text('PDF Çıktısı'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Çıktı adı',
                  style: TextStyle(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 8),
                SelectableText(
                  result.fileName,
                  style: const TextStyle(fontSize: 14),
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(dialogContext).pop(),
                child: const Text('Kapat'),
              ),
              TextButton(
                onPressed: () async {
                  Navigator.of(dialogContext).pop();
                  try {
                    await Printing.layoutPdf(
                      onLayout: (format) async => result.bytes,
                    );
                  } catch (_) {
                    // Önizleme iptal edilebilir, sessizce devam et.
                  }
                },
                child: const Text('Önizle'),
              ),
              FilledButton(
                onPressed: () async {
                  Navigator.of(dialogContext).pop();
                  try {
                    await Printing.sharePdf(
                      bytes: result.bytes,
                      filename: result.fileName,
                    );
                  } catch (_) {
                    if (!mounted) return;
                    ScaffoldMessenger.of(context)
                      ..hideCurrentSnackBar()
                      ..showSnackBar(
                        const SnackBar(
                          content: Text('PDF paylaşımı başarısız oldu.'),
                          backgroundColor: Colors.red,
                        ),
                      );
                  }
                },
                child: const Text('Gönder'),
              ),
            ],
          );
        },
      );
    } catch (error) {
      if (!mounted) return;
      setState(() => _isExportingPdf = false);
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          SnackBar(
            content: Text('PDF oluşturulamadı: $error'),
            backgroundColor: Colors.red,
          ),
        );
    }
  }

  Future<void> _showEditPartDialog(
    PartModel part,
    List<PartStatusModel> statuses,
  ) async {
    final nameController = TextEditingController(text: part.name);
    final quantityController = TextEditingController(
      text: part.quantity.toString(),
    );
    final statusOptions = statuses.isNotEmpty
        ? List<PartStatusModel>.from(statuses)
        : <PartStatusModel>[
            const PartStatusModel(
              id: 'default',
              name: PartStatusModel.defaultName,
              colorHex: PartStatusModel.defaultColorHex,
            ),
          ];

    if (part.status.isNotEmpty &&
        statusOptions.every((status) => status.name != part.status)) {
      statusOptions.add(
        PartStatusModel(
          id: 'legacy-${part.status}',
          name: part.status,
          colorHex: PartStatusModel.defaultColorHex,
        ),
      );
    }

    var selectedStatus =
        statusOptions.any((status) => status.name == part.status)
        ? part.status
        : statusOptions.first.name;

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
                    items: statusOptions
                        .map(
                          (status) => DropdownMenuItem(
                            value: status.name,
                            child: Row(
                              children: [
                                Container(
                                  width: 14,
                                  height: 14,
                                  margin: const EdgeInsets.only(right: 8),
                                  decoration: BoxDecoration(
                                    color: status.color,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                ),
                                Text(status.name),
                              ],
                            ),
                          ),
                        )
                        .toList(),
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
      final user = ref.read(userSessionProvider);
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
      final user = ref.read(userSessionProvider);
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

  PartStatusModel _statusMetaFor(
    List<PartStatusModel> statuses,
    String statusName,
  ) {
    for (final status in statuses) {
      if (status.name == statusName) {
        return status;
      }
    }

    if (statusName.isNotEmpty) {
      return PartStatusModel(
        id: 'legacy-$statusName',
        name: statusName,
        colorHex: PartStatusModel.defaultColorHex,
      );
    }

    return const PartStatusModel(
      id: 'default-fallback',
      name: PartStatusModel.defaultName,
      colorHex: PartStatusModel.defaultColorHex,
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(userSessionProvider);

    if (user == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final isAdmin = user.role == 'admin';
    final vehicleAsync = ref.watch(vehicleByIdProvider(widget.vehicleId));

    return vehicleAsync.when(
      loading: () =>
          const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (error, _) => Scaffold(
        appBar: AppBar(title: const Text('Araç Detayı')),
        body: Center(child: Text('Araç yüklenemedi: $error')),
      ),
      data: (vehicle) {
        if (vehicle == null) {
          return Scaffold(
            appBar: AppBar(title: const Text('Araç Detayı')),
            body: const Center(child: Text('Araç bulunamadı.')),
          );
        }

        final vehicleShopId = vehicle.shopId;

        if (!isAdmin) {
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

          if (vehicleShopId != shopId) {
            return Scaffold(
              appBar: AppBar(title: const Text('Araç Detayı')),
              body: const Center(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: Text('Bu aracı görüntüleme yetkiniz yok.'),
                ),
              ),
            );
          }
        }

        final statusesAsync = ref.watch(partStatusesProvider(vehicleShopId));
        final partsAsync = ref.watch(
          partsByVehicleProvider((
            vehicleId: widget.vehicleId,
            shopId: vehicleShopId,
          )),
        );

        final exportableParts = partsAsync.maybeWhen(
          data: (parts) => parts,
          orElse: () => const <PartModel>[],
        );
        final canExportPdf = !_isExportingPdf;

        return Scaffold(
          appBar: AppBar(
            title: const Text('Araç Detayı'),
            actions: [
              if (_isExportingPdf)
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 16),
                  child: SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                )
              else
                IconButton(
                  tooltip: 'Parçaları PDF olarak dışa aktar',
                  onPressed: canExportPdf
                      ? () => _exportPartsAsPdf(
                          vehicle: vehicle,
                          parts: exportableParts,
                        )
                      : null,
                  icon: const Icon(Icons.picture_as_pdf),
                ),
              IconButton(
                tooltip: 'Parça ekle',
                onPressed: () => _showMultiPartDialog(vehicleShopId),
                icon: const Icon(Icons.add),
              ),
            ],
          ),
          body: statusesAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, _) =>
                Center(child: Text('Durumlar yüklenemedi: $error')),
            data: (statuses) {
              return Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${vehicle.brand} ${vehicle.model}',
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text('Plaka: ${vehicle.plate}'),
                            Text('Yıl: ${vehicle.year}'),
                            if (vehicle.customerName.isNotEmpty)
                              Text('Müşteri: ${vehicle.customerName}'),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const Divider(height: 1),
                  Expanded(
                    child: partsAsync.when(
                      data: (parts) {
                        if (parts.isEmpty) {
                          return Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: const [
                                Icon(
                                  Icons.inventory_2_outlined,
                                  size: 64,
                                  color: Colors.grey,
                                ),
                                SizedBox(height: 16),
                                Text('Bu araca ait parça bulunmuyor.'),
                              ],
                            ),
                          );
                        }

                        return ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: parts.length,
                          separatorBuilder: (context, index) =>
                              const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final part = parts[index];
                            final statusMeta = _statusMetaFor(
                              statuses,
                              part.status,
                            );
                            return Card(
                              child: ListTile(
                                contentPadding: const EdgeInsets.all(16),
                                title: Text(part.name),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const SizedBox(height: 4),
                                    Text('Miktar: ${part.quantity}'),
                                    const SizedBox(height: 4),
                                    Chip(
                                      label: Text(statusMeta.name),
                                      backgroundColor: statusMeta.color
                                          .withValues(alpha: 0.15),
                                      labelStyle: TextStyle(
                                        color: statusMeta.color,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                                trailing: Wrap(
                                  spacing: 8,
                                  children: [
                                    IconButton(
                                      tooltip: 'Düzenle',
                                      icon: const Icon(Icons.edit_outlined),
                                      onPressed: () =>
                                          _showEditPartDialog(part, statuses),
                                    ),
                                    IconButton(
                                      tooltip: 'Sil',
                                      icon: const Icon(Icons.delete_outline),
                                      onPressed: () => _deletePart(part),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        );
                      },
                      loading: () =>
                          const Center(child: CircularProgressIndicator()),
                      error: (error, _) =>
                          Center(child: Text('Parçalar yüklenemedi: $error')),
                    ),
                  ),
                ],
              );
            },
          ),
        );
      },
    );
  }
}
