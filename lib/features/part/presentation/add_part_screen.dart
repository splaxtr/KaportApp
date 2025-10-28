import 'dart:collection';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:kaportapp/core/models/part_model.dart';
import 'package:kaportapp/core/models/user_model.dart';
import 'package:kaportapp/core/services/part_service.dart';
import 'package:kaportapp/core/state/user_session.dart';
import 'package:kaportapp/features/part/application/part_providers.dart';
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

  String? _selectedVehicleId;
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

  bool get _canSave =>
      !_isSaving &&
      _selectedParts.isNotEmpty &&
      (_selectedVehicleId != null && _selectedVehicleId!.isNotEmpty);

  Future<void> _saveParts(UserModel actor) async {
    if (!_canSave) return;

    setState(() {
      _isSaving = true;
    });

    final service = ref.read(partServiceProvider);
    final names = _selectedParts.toList(growable: false);
    final timestamp = DateTime.now().millisecondsSinceEpoch;

    final models = <PartModel>[];
    for (var i = 0; i < names.length; i++) {
      models.add(
        PartModel(
          id: '${actor.shopId}_part_${timestamp + i}',
          vehicleId: _selectedVehicleId!,
          name: names[i],
          position: '',
          status: 'pending',
          quantity: 1,
          shopId: actor.shopId ?? '',
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
    final session = ref.watch(userSessionProvider);

    return session.when(
      loading: () =>
          const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (error, _) => Scaffold(body: Center(child: Text('Hata: $error'))),
      data: (user) {
        if (user == null || user.shopId == null || user.shopId!.isEmpty) {
          return const Scaffold(
            body: Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  'Parça eklemek için bir dükkana atanmış olmalısınız.',
                ),
              ),
            ),
          );
        }

        final vehiclesAsync = ref.watch(vehiclesStreamProvider(user.shopId!));
        final hasParts = _parsedParts.isNotEmpty;
        final allSelected =
            hasParts && _parsedParts.length == _selectedParts.length;

        return Scaffold(
          appBar: AppBar(title: const Text('Parçaları Toplu Ekle')),
          body: vehiclesAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, _) =>
                Center(child: Text('Araçlar yüklenemedi: $error')),
            data: (vehicles) {
              if (vehicles.isEmpty) {
                return Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: const [
                        Icon(Icons.warning, size: 64, color: Colors.orange),
                        SizedBox(height: 16),
                        Text(
                          'Parça eklemek için önce en az bir araç oluşturmalısınız.',
                        ),
                      ],
                    ),
                  ),
                );
              }

              return SingleChildScrollView(
                controller: _scrollController,
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    DropdownButtonFormField<String>(
                      initialValue: _selectedVehicleId,
                      decoration: const InputDecoration(
                        labelText: 'Araç Seçin *',
                        border: OutlineInputBorder(),
                      ),
                      items: vehicles
                          .map(
                            (vehicle) => DropdownMenuItem(
                              value: vehicle.id,
                              child: Text(
                                '${vehicle.brand} ${vehicle.model} (${vehicle.plate})',
                              ),
                            ),
                          )
                          .toList(),
                      onChanged: (value) {
                        setState(() => _selectedVehicleId = value);
                      },
                    ),
                    const SizedBox(height: 24),
                    TextField(
                      controller: _textController,
                      maxLines: null,
                      onChanged: _handleTextChanged,
                      decoration: const InputDecoration(
                        labelText: 'Parçaları girin (her satıra bir parça)',
                        hintText:
                            'Örnek:\nsağ far\nsol davlumbaz\nkaput\narka tampon',
                        border: OutlineInputBorder(),
                        alignLabelWithHint: true,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Wrap(
                      spacing: 12,
                      runSpacing: 8,
                      children: [
                        FilledButton.tonal(
                          onPressed: hasParts && !allSelected
                              ? _selectAll
                              : null,
                          child: const Text('Tümünü Seç'),
                        ),
                        FilledButton.tonal(
                          onPressed: _selectedParts.isEmpty
                              ? null
                              : _clearSelection,
                          child: const Text('Tümünü Kaldır'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    if (!hasParts)
                      Card(
                        color: Theme.of(
                          context,
                        ).colorScheme.surfaceContainerHighest,
                        child: const Padding(
                          padding: EdgeInsets.all(16),
                          child: Text(
                            'Her satıra bir parça adı yazın. Satırlar anında aşağıdaki listeye eklenir.',
                          ),
                        ),
                      )
                    else
                      ..._parsedParts.map(
                        (name) => CheckboxListTile(
                          title: Text(name),
                          value: _selectedParts.contains(name),
                          onChanged: (value) => _togglePart(name, value),
                        ),
                      ),
                    const SizedBox(height: 24),
                    FilledButton.icon(
                      onPressed: _canSave ? () => _saveParts(user) : null,
                      icon: _isSaving
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.save_alt),
                      label: Text(_isSaving ? 'Kaydediliyor...' : 'Kaydet'),
                    ),
                    if (_recentlyAdded.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      Card(
                        color: Theme.of(context).colorScheme.primaryContainer,
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Son Eklenenler',
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  color: Theme.of(
                                    context,
                                  ).colorScheme.onPrimaryContainer,
                                ),
                              ),
                              const SizedBox(height: 8),
                              for (final part in _recentlyAdded)
                                Text(
                                  '• $part',
                                  style: TextStyle(
                                    color: Theme.of(
                                      context,
                                    ).colorScheme.onPrimaryContainer,
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              );
            },
          ),
        );
      },
    );
  }
}
