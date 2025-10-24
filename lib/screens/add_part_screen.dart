import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/part_model.dart';
import '../services/part_service.dart';
import '../state/part_providers.dart';
import '../state/user_session.dart';
import '../state/vehicle_providers.dart';

/// Screen for adding a new part to a vehicle
class AddPartScreen extends ConsumerStatefulWidget {
  const AddPartScreen({super.key});

  static const String routeName = '/addPart';

  @override
  ConsumerState<AddPartScreen> createState() => _AddPartScreenState();
}

class _AddPartScreenState extends ConsumerState<AddPartScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _positionController = TextEditingController();
  final _quantityController = TextEditingController();

  String? _selectedVehicleId;
  String _selectedStatus = 'pending'; // pending, ordered, installed

  bool _isSubmitting = false;

  final List<String> _statusOptions = [
    'pending',
    'ordered',
    'installed',
  ];

  final Map<String, String> _statusLabels = {
    'pending': 'Beklemede',
    'ordered': 'Sipariş Verildi',
    'installed': 'Takıldı',
  };

  @override
  void dispose() {
    _nameController.dispose();
    _positionController.dispose();
    _quantityController.dispose();
    super.dispose();
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) {
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

      // Create part model with auto-generated ID
      final partId = '${user.shopId}_part_${DateTime.now().millisecondsSinceEpoch}';

      final part = PartModel(
        id: partId,
        vehicleId: _selectedVehicleId!,
        name: _nameController.text.trim(),
        position: _positionController.text.trim(),
        status: _selectedStatus,
        quantity: int.parse(_quantityController.text.trim()),
        shopId: user.shopId!,
      );

      await service.addItem(part, user);

      if (!mounted) return;

      // Show success message
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          const SnackBar(
            content: Text('Parça başarıyla eklendi'),
            backgroundColor: Colors.green,
          ),
        );

      // Navigate back
      Navigator.pop(context);
    } on PartServiceException catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          SnackBar(
            content: Text(e.message),
            backgroundColor: Colors.red,
          ),
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

        final vehiclesAsync = ref.watch(vehiclesStreamProvider(user.shopId!));

        return Scaffold(
          appBar: AppBar(
            title: const Text('Yeni Parça Ekle'),
          ),
          body: Form(
            key: _formKey,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Vehicle Selection Dropdown
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
                      decoration: const InputDecoration(
                        labelText: 'Araç Seçin *',
                        prefixIcon: Icon(Icons.directions_car),
                        border: OutlineInputBorder(),
                      ),
                      initialValue: _selectedVehicleId,
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

                // Part Name Field
                TextFormField(
                  controller: _nameController,
                  decoration: const InputDecoration(
                    labelText: 'Parça Adı *',
                    hintText: 'Ön Fren Balatası, Motor Yağı, vb.',
                    prefixIcon: Icon(Icons.build),
                    border: OutlineInputBorder(),
                  ),
                  textCapitalization: TextCapitalization.words,
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Parça adı giriniz';
                    }
                    return null;
                  },
                ),

                const SizedBox(height: 16),

                // Position Field
                TextFormField(
                  controller: _positionController,
                  decoration: const InputDecoration(
                    labelText: 'Konum/Pozisyon *',
                    hintText: 'Ön Sol, Arka Sağ, Motor, vb.',
                    prefixIcon: Icon(Icons.place),
                    border: OutlineInputBorder(),
                  ),
                  textCapitalization: TextCapitalization.words,
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Konum giriniz';
                    }
                    return null;
                  },
                ),

                const SizedBox(height: 16),

                // Quantity Field
                TextFormField(
                  controller: _quantityController,
                  decoration: const InputDecoration(
                    labelText: 'Miktar *',
                    hintText: '1, 2, 4, vb.',
                    prefixIcon: Icon(Icons.numbers),
                    border: OutlineInputBorder(),
                  ),
                  keyboardType: TextInputType.number,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    LengthLimitingTextInputFormatter(3),
                  ],
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Miktar giriniz';
                    }

                    final quantity = int.tryParse(value.trim());
                    if (quantity == null || quantity < 1) {
                      return 'Miktar en az 1 olmalıdır';
                    }

                    return null;
                  },
                ),

                const SizedBox(height: 16),

                // Status Selection
                DropdownButtonFormField<String>(
                  decoration: const InputDecoration(
                    labelText: 'Durum *',
                    prefixIcon: Icon(Icons.info),
                    border: OutlineInputBorder(),
                  ),
                  initialValue: _selectedStatus,
                  items: _statusOptions.map((status) {
                    return DropdownMenuItem(
                      value: status,
                      child: Text(_statusLabels[status] ?? status),
                    );
                  }).toList(),
                  onChanged: (value) {
                    if (value != null) {
                      setState(() {
                        _selectedStatus = value;
                      });
                    }
                  },
                ),

                const SizedBox(height: 32),

                // Submit Button
                FilledButton.icon(
                  onPressed: _isSubmitting ? null : _submitForm,
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
                  label: Text(_isSubmitting ? 'Kaydediliyor...' : 'Parçayı Kaydet'),
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),

                const SizedBox(height: 16),

                // Info Card
                Card(
                  color: Theme.of(context).colorScheme.primaryContainer,
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        Icon(
                          Icons.info_outline,
                          color: Theme.of(context).colorScheme.onPrimaryContainer,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            '* ile işaretli alanlar zorunludur',
                            style: TextStyle(
                              color: Theme.of(context)
                                  .colorScheme
                                  .onPrimaryContainer,
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
        );
      },
      loading: () => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      ),
      error: (error, stack) => Scaffold(
        appBar: AppBar(title: const Text('Parça Ekle')),
        body: Center(child: Text('Kullanıcı bilgisi alınamadı: $error')),
      ),
    );
  }
}

