import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/vehicle_model.dart';
import '../services/vehicle_service.dart';
import '../state/user_session.dart';
import '../state/vehicle_providers.dart';

/// Screen for adding a new vehicle to the shop
class AddVehicleScreen extends ConsumerStatefulWidget {
  const AddVehicleScreen({super.key});

  static const String routeName = '/addVehicle';

  @override
  ConsumerState<AddVehicleScreen> createState() => _AddVehicleScreenState();
}

class _AddVehicleScreenState extends ConsumerState<AddVehicleScreen> {
  final _formKey = GlobalKey<FormState>();
  final _plateController = TextEditingController();
  final _brandController = TextEditingController();
  final _modelController = TextEditingController();
  final _yearController = TextEditingController();
  final _customerNameController = TextEditingController();

  bool _isSubmitting = false;

  @override
  void dispose() {
    _plateController.dispose();
    _brandController.dispose();
    _modelController.dispose();
    _yearController.dispose();
    _customerNameController.dispose();
    super.dispose();
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) {
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
            content: Text('Araç eklemek için bir dükkana atanmış olmalısınız'),
            backgroundColor: Colors.red,
          ),
        );
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      final service = ref.read(vehicleServiceProvider);

      // Create vehicle model with auto-generated ID
      final vehicleId =
          '${user.shopId}_${DateTime.now().millisecondsSinceEpoch}';

      final vehicle = VehicleModel(
        id: vehicleId,
        plate: _plateController.text.trim().toUpperCase(),
        brand: _brandController.text.trim(),
        model: _modelController.text.trim(),
        year: int.parse(_yearController.text.trim()),
        customerName: _customerNameController.text.trim(),
        shopId: user.shopId!,
      );

      await service.addItem(vehicle, user);

      if (!mounted) return;

      // Show success message
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          const SnackBar(
            content: Text('Araç başarıyla eklendi'),
            backgroundColor: Colors.green,
          ),
        );

      // Navigate back
      Navigator.pop(context);
    } on VehicleServiceException catch (e) {
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
    return Scaffold(
      appBar: AppBar(
        title: const Text('Yeni Araç Ekle'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Plate Number Field
            TextFormField(
              controller: _plateController,
              decoration: const InputDecoration(
                labelText: 'Plaka *',
                hintText: '34 ABC 123',
                prefixIcon: Icon(Icons.numbers),
                border: OutlineInputBorder(),
              ),
              textCapitalization: TextCapitalization.characters,
              inputFormatters: [
                LengthLimitingTextInputFormatter(20),
              ],
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Plaka giriniz';
                }
                return null;
              },
            ),

            const SizedBox(height: 16),

            // Brand Field
            TextFormField(
              controller: _brandController,
              decoration: const InputDecoration(
                labelText: 'Marka *',
                hintText: 'Toyota, Mercedes, Ford, vb.',
                prefixIcon: Icon(Icons.branding_watermark),
                border: OutlineInputBorder(),
              ),
              textCapitalization: TextCapitalization.words,
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Marka giriniz';
                }
                return null;
              },
            ),

            const SizedBox(height: 16),

            // Model Field
            TextFormField(
              controller: _modelController,
              decoration: const InputDecoration(
                labelText: 'Model *',
                hintText: 'Corolla, C200, Focus, vb.',
                prefixIcon: Icon(Icons.local_car_wash),
                border: OutlineInputBorder(),
              ),
              textCapitalization: TextCapitalization.words,
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Model giriniz';
                }
                return null;
              },
            ),

            const SizedBox(height: 16),

            // Year Field
            TextFormField(
              controller: _yearController,
              decoration: const InputDecoration(
                labelText: 'Model Yılı *',
                hintText: '2023',
                prefixIcon: Icon(Icons.calendar_today),
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.number,
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
                LengthLimitingTextInputFormatter(4),
              ],
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Model yılı giriniz';
                }

                final year = int.tryParse(value.trim());
                if (year == null) {
                  return 'Geçerli bir yıl giriniz';
                }

                final currentYear = DateTime.now().year;
                if (year < 1900 || year > currentYear + 1) {
                  return 'Yıl 1900-${currentYear + 1} arasında olmalıdır';
                }

                return null;
              },
            ),

            const SizedBox(height: 16),

            // Customer Name Field
            TextFormField(
              controller: _customerNameController,
              decoration: const InputDecoration(
                labelText: 'Müşteri Adı *',
                hintText: 'Ahmet Yılmaz',
                prefixIcon: Icon(Icons.person),
                border: OutlineInputBorder(),
              ),
              textCapitalization: TextCapitalization.words,
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Müşteri adı giriniz';
                }
                return null;
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
              label: Text(_isSubmitting ? 'Kaydediliyor...' : 'Aracı Kaydet'),
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
                          color:
                              Theme.of(context).colorScheme.onPrimaryContainer,
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
  }
}

