import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:kaportapp/core/models/vehicle_model.dart';
import 'package:kaportapp/core/services/vehicle_service.dart';

/// Provider for VehicleService singleton
final vehicleServiceProvider = Provider<VehicleService>((ref) {
  return VehicleService();
});

/// Provider for vehicles stream filtered by shopId
/// Usage: `ref.watch(vehiclesStreamProvider(shopId))`
final vehiclesStreamProvider = StreamProvider.autoDispose
    .family<List<VehicleModel>, String>((ref, shopId) {
      final service = ref.watch(vehicleServiceProvider);
      return service.getItemsByShop(shopId);
    });

/// Provider for a single vehicle by ID
/// Returns `AsyncValue<VehicleModel?>` which can be null if not found
final vehicleByIdProvider = FutureProvider.autoDispose
    .family<VehicleModel?, String>((ref, vehicleId) async {
      final service = ref.watch(vehicleServiceProvider);
      return service.getItemById(vehicleId);
    });
