import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/part_model.dart';
import '../services/part_service.dart';
import '../state/part_providers.dart';
import '../state/user_session.dart';
import '../state/vehicle_providers.dart';

/// Screen for adding multiple parts to a vehicle in a single action.
class AddPartScreen extends ConsumerStatefulWidget {
  const AddPartScreen({super.key});

  static const String routeName = '/addPart';

  @override
  ConsumerState<AddPartScreen> createState() => _AddPartScreenState();
}

class _AddPartScreenState extends ConsumerState<AddPartScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _partsController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  String? _selectedVehicleId;
  bool _isSubmitting = false;

  List<String> _parsedParts = const [];
  final Set<String> _selectedParts = <String>{};

  @override
  void dispose() {
    _partsController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _handlePartsChanged(String value) {
    final updatedParts = value
        .split('\n')
        .map((line) => line.trim())
        .where((line) => line.isNotEmpty)
        .toList(growable: false);

    setState(() {
      _parsedParts = updatedParts;
      _selectedParts.removeWhere((part) => !updatedParts.contains(part));
    });
  }

  void _toggleSelection(String partName, bool? isSelected) {
    setState(() {
      if (isSelected ?? false) {
        _selectedParts.add(partName);
      } else {
        _selectedParts.remove(partName);
      }
    });
  }

  void _selectAll() {
    if (_parsedParts.isEmpty || _parsedParts.length == _selectedParts.length) {
      return;
    }

    setState(() {
      _selectedParts
        ..clear()
        ..addAll(_parsedParts);
    });
  }

  void _clearSelection() {
    if (_selectedParts.isEmpty) {
      return;
    }

    setState(() {
      _selectedParts.clear();
    });
  }

  bool get _canSubmit =>
      !_isSubmitting &&
      _selectedParts.isNotEmpty &&
      (_selectedVehicleId?.isNotEmpty ?? false);

  Future<void> _submitForm() async {
    final formState = _formKey.currentState;
    final isFormValid = formState?.validate() ?? false;

    if (!isFormValid || _selectedParts.isEmpty) {
      return;
    }

    if (_selectedVehicleId == null) {
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          const SnackBar(
            content: Text('Lütfen bir araç seçiniz'),
            backgroundColor: Colors.orange,
          ),
        );
      return;
    }

    final userState = ref.read(userSessionProvider);
    final user = userState.value;

    if (user == null || user.shopId == null || user.shopId!.isEmpty) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          const SnackBar(
            content: Text('Parça eklemek için bir dükkana atanmış olmalısınız'),
            backgroundColor: Colors.red,
          ),
        );
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      final service = ref.read(partServiceProvider);
      final partsToSave = List<String>.from(_selectedParts);
      final timestamp = DateTime.now().millisecondsSinceEpoch;

      var offset = 0;
      for (final partName in partsToSave) {
        final partId = '${user.shopId}_part_${timestamp + offset}';
        final part = PartModel(
          id: partId,
          vehicleId: _selectedVehicleId!,
          name: partName,
          position: '',
          status: 'pending',
          quantity: 1,
          shopId: user.shopId!,
        );

        await service.addItem(part, user);
        offset++;
      }

      if (!mounted) return;

      _partsController.clear();
      _handlePartsChanged('');

      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          SnackBar(
            content: Text('${partsToSave.length} parça eklendi.'),
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
          _isSubmitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final userState = ref.watch(userSessionProvider);

    return userState.when(
      data: (user) {
        if (user == null || user.shopId == null || user.shopId!.isEmpty) {
          return Scaffold(
            appBar: AppBar(title: const Text('Parça Ekle')),
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

        final theme = Theme.of(context);
        final colorScheme = theme.colorScheme;
        final vehiclesAsync = ref.watch(vehiclesStreamProvider(user.shopId!));
        final showScrollbarAlways = MediaQuery.of(context).size.height < 600;
        final hasParts = _parsedParts.isNotEmpty;
        final allPartsSelected =
            hasParts && _parsedParts.length == _selectedParts.length;

        return Scaffold(
          appBar: AppBar(title: const Text('Yeni Parça Ekle')),
          body: Form(
            key: _formKey,
            child: Scrollbar(
              controller: _scrollController,
              thumbVisibility: showScrollbarAlways,
              child: ListView(
                controller: _scrollController,
                padding: const EdgeInsets.all(16),
                children: [
                  vehiclesAsync.when(
                    data: (vehicles) {
                      if (vehicles.isEmpty) {
                        return Card(
                          color: Colors.orange.shade50,
                          child: const Padding(
                            padding: EdgeInsets.all(16),
                            child: Row(
                              children: [
                                Icon(Icons.warning, color: Colors.orange),
                                SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    'Önce araç eklemelisiniz. Parça eklemek için bir araca ihtiyacınız var.',
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      }

                      return DropdownButtonFormField<String>(
                        initialValue: _selectedVehicleId,
                        decoration: const InputDecoration(
                          labelText: 'Araç Seçin *',
                          prefixIcon: Icon(Icons.directions_car),
                          border: OutlineInputBorder(),
                        ),
                        items: vehicles.map((vehicle) {
                          return DropdownMenuItem(
                            value: vehicle.id,
                            child: Text(
                              '${vehicle.brand} ${vehicle.model} (${vehicle.plate})',
                            ),
                          );
                        }).toList(),
                        onChanged: (value) {
                          setState(() {
                            _selectedVehicleId = value;
                          });
                        },
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Lütfen bir araç seçiniz';
                          }
                          return null;
                        },
                      );
                    },
                    loading: () => const LinearProgressIndicator(),
                    error: (error, stack) => Card(
                      color: Colors.red.shade50,
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Text(
                          'Araçlar yüklenemedi: $error',
                          style: const TextStyle(color: Colors.red),
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  TextFormField(
                    key: const Key('add-part-multiline-field'),
                    controller: _partsController,
                    maxLines: null,
                    keyboardType: TextInputType.multiline,
                    onChanged: _handlePartsChanged,
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
                        onPressed: hasParts && !allPartsSelected
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

                  if (_parsedParts.isEmpty)
                    Card(
                      color: colorScheme.surfaceContainerHighest,
                      child: const Padding(
                        padding: EdgeInsets.all(16),
                        child: Text(
                          'Her satıra bir parça yazın. Satırlar anında aşağıdaki listeye eklenir.',
                        ),
                      ),
                    )
                  else
                    ..._parsedParts.map(
                      (partName) => CheckboxListTile(
                        title: Text(partName),
                        value: _selectedParts.contains(partName),
                        onChanged: (value) => _toggleSelection(partName, value),
                      ),
                    ),

                  const SizedBox(height: 24),

                  FilledButton.icon(
                    key: const Key('add-part-save-button'),
                    onPressed: _canSubmit ? _submitForm : null,
                    icon: _isSubmitting
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.check),
                    label: Text(_isSubmitting ? 'Kaydediliyor...' : 'Kaydet'),
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                  ),

                  const SizedBox(height: 16),

                  Card(
                    color: colorScheme.primaryContainer,
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Row(
                        children: [
                          Icon(
                            Icons.info_outline,
                            color: colorScheme.onPrimaryContainer,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'Her satıra bir parça adı ekleyin ve kaydetmeden önce eklemek istediğiniz parçaları işaretleyin.',
                              style: TextStyle(
                                color: colorScheme.onPrimaryContainer,
                                fontSize: 12,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
      loading: () =>
          const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (error, stack) => Scaffold(
        appBar: AppBar(title: const Text('Parça Ekle')),
        body: Center(child: Text('Kullanıcı bilgisi alınamadı: $error')),
      ),
    );
  }
}
