import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/shop_model.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../services/shop_service.dart';

final authServiceProvider = Provider<AuthService>((ref) => AuthService());

/// User session stream provider based on Firebase auth state
final userSessionProvider = StreamProvider.autoDispose<UserModel?>((ref) async* {
  final auth = ref.watch(authServiceProvider);

  await for (final firebaseUser in auth.authChanges()) {
    if (firebaseUser == null) {
      yield null;
    } else {
      try {
        final model = await auth.fetchUserModel(firebaseUser.uid);
        yield model;
      } catch (error) {
        debugPrint('UserSession load failed: $error');
        rethrow;
      }
    }
  }
});

final isAdminProvider = Provider<bool>((ref) {
  final user = ref.watch(userSessionProvider).value;
  return user?.role == 'admin';
});

final isOwnerProvider = Provider<bool>((ref) {
  final user = ref.watch(userSessionProvider).value;
  return user?.role == 'owner';
});

final isEmployeeProvider = Provider<bool>((ref) {
  final user = ref.watch(userSessionProvider).value;
  return user?.role == 'employee';
});

final shopServiceProvider = Provider<ShopService>((ref) => ShopService());

final shopsStreamProvider = StreamProvider.autoDispose<List<ShopModel>>((ref) {
  final service = ref.watch(shopServiceProvider);
  return service.watchShops();
});

final usersStreamProvider = StreamProvider.autoDispose<List<UserModel>>((ref) {
  final service = ref.watch(shopServiceProvider);
  return service.watchUsers();
});

final availableOwnersProvider = StreamProvider.autoDispose<List<UserModel>>((
  ref,
) {
  final service = ref.watch(shopServiceProvider);
  return service.watchUsersWithoutShop();
});

final shopUsersProvider = StreamProvider.autoDispose
    .family<List<UserModel>, String>((ref, shopId) {
      final service = ref.watch(shopServiceProvider);
      return service.watchUsersByShop(shopId);
    });

/// Provider for unassigned users (users without a shop)
/// These users can be assigned to a shop by owners
final unassignedUsersProvider =
    StreamProvider.autoDispose<List<UserModel>>((ref) {
  final service = ref.watch(shopServiceProvider);
  return service.watchUnassignedUsers();
});
