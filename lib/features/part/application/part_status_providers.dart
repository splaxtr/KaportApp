import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:kaportapp/core/models/part_status_model.dart';
import 'package:kaportapp/core/services/part_status_service.dart';

final partStatusServiceProvider = Provider<PartStatusService>((ref) {
  return PartStatusService();
});

final partStatusesProvider = StreamProvider.autoDispose
    .family<List<PartStatusModel>, String>((ref, shopId) {
  if (shopId.isEmpty) {
    return const Stream.empty();
  }
  final service = ref.watch(partStatusServiceProvider);
  return service.watchStatuses(shopId);
});
