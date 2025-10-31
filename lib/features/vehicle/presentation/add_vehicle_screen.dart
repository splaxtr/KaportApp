import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:kaportapp/core/models/shop_model.dart';
import 'package:kaportapp/core/models/vehicle_model.dart';
import 'package:kaportapp/core/services/vehicle_service.dart';
import 'package:kaportapp/core/state/user_session.dart';
import 'package:kaportapp/features/vehicle/application/vehicle_providers.dart';

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

  String? _selectedShopIdForAdmin;
  bool _isSubmitting = false;

  void _syncSelectedShopForAdmin(List<ShopModel> shops) {
    if (shops.isEmpty) {
      if (_selectedShopIdForAdmin != null) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (!mounted) return;
          setState(() {
            _selectedShopIdForAdmin = null;
          });
        });
      }
      return;
    }

    if (_selectedShopIdForAdmin != null &&
        shops.any((shop) => shop.id == _selectedShopIdForAdmin)) {
      return;
    }

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      setState(() {
        _selectedShopIdForAdmin = shops.first.id;
      });
    });
  }

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

    final user = ref.read(userSessionProvider);

    if (user == null) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          const SnackBar(
            content: Text('Kullanıcı oturumu bulunamadı'),
            backgroundColor: Colors.red,
          ),
        );
      return;
    }

    final isAdmin = user.role == 'admin';
    final targetShopId = isAdmin ? _selectedShopIdForAdmin : user.shopId;

    if (targetShopId == null || targetShopId.isEmpty) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          SnackBar(
            content: Text(
              isAdmin
                  ? 'Araç eklemek için bir dükkana seçmeniz gerekiyor'
                  : 'Araç eklemek için bir dükkana atanmış olmalısınız',
            ),
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
          '${targetShopId}_${DateTime.now().millisecondsSinceEpoch}';

      final vehicle = VehicleModel(
        id: vehicleId,
        plate: _plateController.text.trim().toUpperCase(),
        brand: _brandController.text.trim(),
        model: _modelController.text.trim(),
        year: int.parse(_yearController.text.trim()),
        customerName: _customerNameController.text.trim(),
        shopId: targetShopId,
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
    final user = ref.watch(userSessionProvider);

    if (user == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final isAdmin = user.role == 'admin';
    final shopsAsync = isAdmin
        ? ref.watch(shopsStreamProvider)
        : const AsyncValue<List<ShopModel>>.data(<ShopModel>[]);

    return shopsAsync.when(
      loading: () =>
          const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (error, _) => Scaffold(
        appBar: AppBar(title: const Text('Yeni Araç Ekle')),
        body: Center(child: Text('Mağazalar yüklenemedi: $error')),
      ),
      data: (shops) {
        if (isAdmin) {
          _syncSelectedShopForAdmin(shops);

          if (shops.isEmpty) {
            return Scaffold(
              appBar: AppBar(title: const Text('Yeni Araç Ekle')),
              body: const Center(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: Text(
                    'Henüz kayıtlı bir dükkan bulunmuyor. Araç eklemek için önce bir dükkan oluşturmalısınız.',
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
            );
          }
        }

        return Scaffold(
          appBar: AppBar(title: const Text('Yeni Araç Ekle')),
          body: Form(
            key: _formKey,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (isAdmin) ...[
                  DropdownButtonFormField<String>(
                    // ignore: deprecated_member_use
                    value: _selectedShopIdForAdmin,
                    decoration: const InputDecoration(
                      labelText: 'Dükkan *',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.storefront),
                    ),
                    items: shops
                        .map(
                          (shop) => DropdownMenuItem(
                            value: shop.id,
                            child: Text(shop.name),
                          ),
                        )
                        .toList(),
                    onChanged: (value) {
                      setState(() {
                        _selectedShopIdForAdmin = value;
                      });
                    },
                  ),
                  const SizedBox(height: 16),
                ],

                TextFormField(
                  controller: _plateController,
                  decoration: const InputDecoration(
                    labelText: 'Plaka *',
                    hintText: '34 ABC 123',
                    prefixIcon: Icon(Icons.numbers),
                    border: OutlineInputBorder(),
                  ),
                  textCapitalization: TextCapitalization.characters,
                  inputFormatters: [LengthLimitingTextInputFormatter(20)],
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Plaka giriniz';
                    }
                    return null;
                  },
                ),

                const SizedBox(height: 16),

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

                TextFormField(
                  controller: _yearController,
                  decoration: const InputDecoration(
                    labelText: 'Model Yılı *',
                    hintText: '2023',
                    prefixIcon: Icon(Icons.calendar_today),
                    border: OutlineInputBorder(),
                  ),
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Model yılı giriniz';
                    }
                    final year = int.tryParse(value.trim());
                    if (year == null || year < 1900 || year > 2100) {
                      return 'Geçerli bir yıl giriniz';
                    }
                    return null;
                  },
                ),

                const SizedBox(height: 16),

                TextFormField(
                  controller: _customerNameController,
                  decoration: const InputDecoration(
                    labelText: 'Müşteri Adı',
                    hintText: 'İsteğe bağlı',
                    prefixIcon: Icon(Icons.person_outline),
                    border: OutlineInputBorder(),
                  ),
                  textCapitalization: TextCapitalization.words,
                ),

                const SizedBox(height: 24),

                FilledButton.icon(
                  onPressed: _isSubmitting ? null : _submitForm,
                  icon: _isSubmitting
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.save_outlined),
                  label: Text(_isSubmitting ? 'Kaydediliyor...' : 'Kaydet'),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
