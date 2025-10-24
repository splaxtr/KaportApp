import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/part_model.dart';
import '../services/part_service.dart';

/// Provider for PartService singleton
final partServiceProvider = Provider<PartService>((ref) {
  return PartService();
});

/// Provider for parts stream filtered by shopId
/// Usage: ref.watch(partsStreamProvider(shopId))
final partsStreamProvider =
    StreamProvider.autoDispose.family<List<PartModel>, String>(
  (ref, shopId) {
    final service = ref.watch(partServiceProvider);
    return service.getItemsByShop(shopId);
  },
);

/// Provider for parts stream filtered by vehicleId and shopId
/// Both filters are required for Firestore security rules
/// Usage: `ref.watch(partsByVehicleProvider((vehicleId: '...', shopId: '...')))`
final partsByVehicleProvider = StreamProvider.autoDispose
    .family<List<PartModel>, ({String vehicleId, String shopId})>(
  (ref, params) {
    final service = ref.watch(partServiceProvider);
    return service.getItemsByVehicle(params.vehicleId, params.shopId);
  },
);

/// Provider for a single part by ID
/// Returns `AsyncValue<PartModel?>` which can be null if not found
final partByIdProvider =
    FutureProvider.autoDispose.family<PartModel?, String>(
  (ref, partId) async {
    final service = ref.watch(partServiceProvider);
    return service.getItemById(partId);
  },
);
