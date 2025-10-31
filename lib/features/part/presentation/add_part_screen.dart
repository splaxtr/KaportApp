import 'dart:collection';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:kaportapp/core/models/part_model.dart';
import 'package:kaportapp/core/models/part_status_model.dart';
import 'package:kaportapp/core/models/user_model.dart';
import 'package:kaportapp/core/models/vehicle_model.dart';
import 'package:kaportapp/core/services/part_service.dart';
import 'package:kaportapp/core/state/user_session.dart';
import 'package:kaportapp/features/part/application/part_providers.dart';
import 'package:kaportapp/features/part/application/part_status_providers.dart';
import 'package:kaportapp/features/vehicle/application/vehicle_providers.dart';

class AddPartScreen extends ConsumerStatefulWidget {
  const AddPartScreen({super.key});

  static const String routeName = '/addPart';

  @override
  ConsumerState<AddPartScreen> createState() => _AddPartScreenState();
}

class _AddPartScreenState extends ConsumerState<AddPartScreen> {
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  VehicleModel? _findVehicleById(
    List<VehicleModel> vehicles,
    String? vehicleId,
  ) {
    if (vehicleId == null) return null;
    for (final vehicle in vehicles) {
      if (vehicle.id == vehicleId) {
        return vehicle;
      }
    }
    return null;
  }

  void _ensureSelectedVehicle(List<VehicleModel> vehicles) {
    if (_selectedVehicleId != null &&
        vehicles.any((vehicle) => vehicle.id == _selectedVehicleId)) {
      return;
    }

    final nextId = vehicles.isNotEmpty ? vehicles.first.id : null;
    if (_selectedVehicleId == nextId) {
      return;
    }

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      setState(() {
        _selectedVehicleId = nextId;
      });
    });
  }

  String? _selectedVehicleId;
  String? _selectedStatusName;
  List<String> _parsedParts = const [];
  final Set<String> _selectedParts = <String>{};
  List<String> _recentlyAdded = const [];

  bool _isSaving = false;

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _handleTextChanged(String value) {
    final parsed = LinkedHashSet<String>.from(
      value
          .split('\n')
          .map((line) => line.trim())
          .where((line) => line.isNotEmpty),
    ).toList(growable: false);

    setState(() {
      _parsedParts = parsed;
      _selectedParts.removeWhere((part) => !parsed.contains(part));
    });
  }

  void _togglePart(String name, bool? selected) {
    setState(() {
      if (selected ?? false) {
        _selectedParts.add(name);
      } else {
        _selectedParts.remove(name);
      }
    });
  }

  void _selectAll() {
    if (_parsedParts.isEmpty) return;
    setState(() {
      _selectedParts
        ..clear()
        ..addAll(_parsedParts);
    });
  }

  void _clearSelection() {
    if (_selectedParts.isEmpty) return;
    setState(() {
      _selectedParts.clear();
    });
  }

  void _syncSelectedStatus(List<PartStatusModel> statuses) {
    if (!mounted) {
      return;
    }

    if (statuses.isEmpty) {
      if (_selectedStatusName != null) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (!mounted) return;
          setState(() {
            _selectedStatusName = null;
          });
        });
      }
      return;
    }

    final hasValidSelection =
        _selectedStatusName != null &&
        statuses.any((status) => status.name == _selectedStatusName);

    if (!hasValidSelection) {
      final next = statuses.first.name;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        setState(() {
          _selectedStatusName = next;
        });
      });
    }
  }

  String _statusNameForSave(List<PartStatusModel> statuses) {
    if (_selectedStatusName != null &&
        statuses.any((status) => status.name == _selectedStatusName)) {
      return _selectedStatusName!;
    }
    if (statuses.isNotEmpty) {
      return statuses.first.name;
    }
    return PartStatusModel.defaultName;
  }

  bool _canSaveForVehicle(VehicleModel? vehicle) =>
      !_isSaving && _selectedParts.isNotEmpty && vehicle != null;

  Future<void> _saveParts({
    required UserModel actor,
    required VehicleModel vehicle,
    required List<PartStatusModel> statuses,
  }) async {
    if (!_canSaveForVehicle(vehicle)) return;

    setState(() {
      _isSaving = true;
    });

    final service = ref.read(partServiceProvider);
    final names = _selectedParts.toList(growable: false);
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final statusName = _statusNameForSave(statuses);

    final models = <PartModel>[];
    for (var i = 0; i < names.length; i++) {
      models.add(
        PartModel(
          id: '${vehicle.shopId}_part_${timestamp + i}',
          vehicleId: vehicle.id,
          name: names[i],
          position: '',
          status: statusName,
          quantity: 1,
          shopId: vehicle.shopId,
        ),
      );
    }

    try {
      await service.addItems(models: models, actor: actor);
      if (!mounted) return;

      setState(() {
        _textController.clear();
        _parsedParts = const [];
        _selectedParts.clear();
        _recentlyAdded = names;
      });

      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          SnackBar(
            content: Text('${names.length} parça eklendi.'),
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
    } finally {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(userSessionProvider);

    if (user == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final isAdmin = user.role == 'admin';
    final assignedShopId = user.shopId;

    if (!isAdmin && (assignedShopId == null || assignedShopId.isEmpty)) {
      return const Scaffold(
        body: Center(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Text('Parça eklemek için bir dükkana atanmış olmalısınız.'),
          ),
        ),
      );
    }

    final vehiclesAsync = ref.watch(
      vehiclesStreamProvider(isAdmin ? null : assignedShopId),
    );

    return vehiclesAsync.when(
      loading: () =>
          const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (error, _) => Scaffold(
        appBar: AppBar(title: const Text('Parçaları Toplu Ekle')),
        body: Center(child: Text('Araçlar yüklenemedi: $error')),
      ),
      data: (vehicles) {
        _ensureSelectedVehicle(vehicles);

        if (vehicles.isEmpty) {
          return Scaffold(
            appBar: AppBar(title: const Text('Parçaları Toplu Ekle')),
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: const [
                    Icon(Icons.warning, size: 64, color: Colors.orange),
                    SizedBox(height: 16),
                    Text(
                      'Parça eklemek için önce en az bir araç oluşturmalısınız.',
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
          );
        }

        final selectedVehicle =
            _findVehicleById(vehicles, _selectedVehicleId) ?? vehicles.first;

        if (_selectedVehicleId != selectedVehicle.id) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (!mounted) return;
            setState(() {
              _selectedVehicleId = selectedVehicle.id;
            });
          });
        }

        final statusShopId = isAdmin
            ? selectedVehicle.shopId
            : assignedShopId ?? '';

        final statusesAsync = statusShopId.isNotEmpty
            ? ref.watch(partStatusesProvider(statusShopId))
            : const AsyncValue<List<PartStatusModel>>.data(<PartStatusModel>[]);

        Widget? floatingAction;

        final body = statusesAsync.when(
          loading: () {
            floatingAction = FloatingActionButton.extended(
              onPressed: null,
              icon: const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
              label: const Text('Kaydet'),
            );
            return const Center(child: CircularProgressIndicator());
          },
          error: (error, _) {
            floatingAction = FloatingActionButton.extended(
              onPressed: null,
              icon: const Icon(Icons.error_outline),
              label: const Text('Kaydet'),
            );
            return Center(child: Text('Durumlar yüklenemedi: $error'));
          },
          data: (statuses) {
            _syncSelectedStatus(statuses);

            final hasParts = _parsedParts.isNotEmpty;
            final allSelected =
                hasParts && _parsedParts.length == _selectedParts.length;
            final theme = Theme.of(context);
            final colorScheme = theme.colorScheme;

            floatingAction = FloatingActionButton.extended(
              onPressed: _canSaveForVehicle(selectedVehicle)
                  ? () => _saveParts(
                      actor: user,
                      vehicle: selectedVehicle,
                      statuses: statuses,
                    )
                  : null,
              icon: _isSaving
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.save_outlined),
              label: Text(
                _isSaving
                    ? 'Kaydediliyor...'
                    : '${_selectedParts.length} parçayı kaydet',
              ),
            );

            return Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      TextField(
                        controller: _textController,
                        maxLines: null,
                        minLines: 5,
                        decoration: const InputDecoration(
                          labelText:
                              'Parça adlarını her satıra bir tane olacak şekilde girin.',
                          hintText:
                              'Örnek:\nsağ far\nsol davlumbaz\nkaput\narka tampon',
                          border: OutlineInputBorder(),
                        ),
                        onChanged: _handleTextChanged,
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          FilledButton.icon(
                            onPressed: hasParts ? _selectAll : null,
                            icon: const Icon(Icons.done_all),
                            label: const Text('Tümünü Seç'),
                          ),
                          const SizedBox(width: 12),
                          OutlinedButton.icon(
                            onPressed: _selectedParts.isNotEmpty
                                ? _clearSelection
                                : null,
                            icon: const Icon(Icons.clear_all),
                            label: const Text('Tümünü Kaldır'),
                          ),
                          const Spacer(),
                          Text(
                            allSelected
                                ? 'Tüm parçalar seçili'
                                : '${_selectedParts.length}/${_parsedParts.length} parça seçildi',
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1),
                Expanded(
                  child: Row(
                    children: [
                      Expanded(
                        flex: 3,
                        child: Scrollbar(
                          controller: _scrollController,
                          thumbVisibility: true,
                          child: ListView.separated(
                            controller: _scrollController,
                            itemCount: _parsedParts.length,
                            separatorBuilder: (context, index) =>
                                const Divider(height: 1),
                            itemBuilder: (context, index) {
                              final partName = _parsedParts[index];
                              final isSelected = _selectedParts.contains(
                                partName,
                              );
                              return CheckboxListTile(
                                value: isSelected,
                                dense: true,
                                title: Text(partName),
                                onChanged: (value) =>
                                    _togglePart(partName, value),
                              );
                            },
                          ),
                        ),
                      ),
                      const VerticalDivider(width: 1),
                      Expanded(
                        flex: 2,
                        child: Scrollbar(
                          thumbVisibility: true,
                          child: ListView.separated(
                            itemCount: vehicles.length,
                            separatorBuilder: (context, index) =>
                                const Divider(height: 1),
                            itemBuilder: (context, index) {
                              final vehicle = vehicles[index];
                              final isSelected =
                                  _selectedVehicleId == vehicle.id;
                              return ListTile(
                                onTap: () {
                                  setState(() {
                                    _selectedVehicleId = vehicle.id;
                                  });
                                },
                                leading: Icon(
                                  isSelected
                                      ? Icons.radio_button_checked
                                      : Icons.radio_button_off,
                                  color: isSelected
                                      ? theme.colorScheme.primary
                                      : Colors.grey,
                                ),
                                title: Text(
                                  '${vehicle.brand} ${vehicle.model}',
                                  style: TextStyle(
                                    fontWeight: isSelected
                                        ? FontWeight.bold
                                        : FontWeight.normal,
                                  ),
                                ),
                                subtitle: Text('Plaka: ${vehicle.plate}'),
                              );
                            },
                          ),
                        ),
                      ),
                      const VerticalDivider(width: 1),
                      Expanded(
                        flex: 2,
                        child: Scrollbar(
                          thumbVisibility: true,
                          child: ListView.separated(
                            itemCount: statuses.length,
                            separatorBuilder: (context, index) =>
                                const Divider(height: 1),
                            itemBuilder: (context, index) {
                              final status = statuses[index];
                              final isSelected =
                                  _selectedStatusName == status.name;
                              return ListTile(
                                onTap: () {
                                  setState(() {
                                    _selectedStatusName = status.name;
                                  });
                                },
                                leading: Icon(
                                  isSelected
                                      ? Icons.radio_button_checked
                                      : Icons.radio_button_off,
                                  color: isSelected
                                      ? theme.colorScheme.primary
                                      : Colors.grey,
                                ),
                                title: Row(
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
                              );
                            },
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                if (_recentlyAdded.isNotEmpty) const Divider(height: 1),
                if (_recentlyAdded.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                    child: Card(
                      color: colorScheme.surfaceContainerHighest,
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  'Son Eklenenler',
                                  style: TextStyle(fontWeight: FontWeight.bold),
                                ),
                                TextButton(
                                  onPressed: () {
                                    if (!mounted) return;
                                    setState(() {
                                      _recentlyAdded = const [];
                                    });
                                  },
                                  child: const Text('Temizle'),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: _recentlyAdded
                                  .map(
                                    (part) => Chip(
                                      label: Text(part),
                                      backgroundColor:
                                          colorScheme.primaryContainer,
                                    ),
                                  )
                                  .toList(),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
              ],
            );
          },
        );

        return Scaffold(
          appBar: AppBar(title: const Text('Parçaları Toplu Ekle')),
          body: body,
          floatingActionButton: floatingAction,
        );
      },
    );
  }
}
