import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';

import 'package:kaportapp/core/models/shop_model.dart';
import 'package:kaportapp/core/models/user_model.dart';
import 'package:kaportapp/core/services/auth_service.dart';
import 'package:kaportapp/core/services/shop_service.dart';
import 'package:kaportapp/core/services/user_service.dart';

final authServiceProvider = Provider<AuthService>((ref) => AuthService());

class UserSessionNotifier extends StateNotifier<UserModel?> {
  UserSessionNotifier(AuthService authService)
    : _authService = authService,
      super(null) {
    _subscription = _authService!.authStateChanges().listen(_handleAuthChange);
  }

  UserSessionNotifier.test(super.state) : _authService = null;

  final AuthService? _authService;
  StreamSubscription<User?>? _subscription;
  String? _lastObservedUid;

  bool get isLoggedIn => state != null;
  UserModel? get currentUser => state;

  Future<void> _handleAuthChange(User? firebaseUser) async {
    _lastObservedUid = firebaseUser?.uid;

    final auth = _authService;
    if (auth == null) {
      if (firebaseUser == null && mounted) {
        state = null;
      }
      return;
    }

    if (firebaseUser == null) {
      if (mounted) {
        state = null;
      }
      return;
    }

    try {
      final profile = await auth.fetchUserModel(firebaseUser.uid);
      if (!mounted || _lastObservedUid != firebaseUser.uid) {
        return;
      }
      state = profile;
    } catch (error) {
      debugPrint('UserSessionNotifier.fetch error: $error');
      if (mounted && _lastObservedUid == firebaseUser.uid) {
        state = null;
      }
    }
  }

  Future<void> refresh() async {
    final auth = _authService;
    if (auth == null) return;
    await _handleAuthChange(auth.currentUser);
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}

final userSessionProvider =
    StateNotifierProvider<UserSessionNotifier, UserModel?>((ref) {
      final auth = ref.watch(authServiceProvider);
      return UserSessionNotifier(auth);
    });

final isAdminProvider = Provider<bool>((ref) {
  final user = ref.watch(userSessionProvider);
  return user?.role == 'admin';
});

final isOwnerProvider = Provider<bool>((ref) {
  final user = ref.watch(userSessionProvider);
  return user?.role == 'owner';
});

final isEmployeeProvider = Provider<bool>((ref) {
  final user = ref.watch(userSessionProvider);
  return user?.role == 'employee';
});

final userServiceProvider = Provider<UserService>((ref) => UserService());
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
  final users = ref.watch(userServiceProvider);
  return users
      .getUsersByRole(const [null, 'owner'])
      .map(
        (list) => list
            .where((user) => user.shopId == null || user.shopId!.isEmpty)
            .toList(growable: false),
      );
});

final shopUsersProvider = StreamProvider.autoDispose
    .family<List<UserModel>, String>((ref, shopId) {
      final service = ref.watch(shopServiceProvider);
      return service.watchUsersByShop(shopId);
    });

/// Provider for unassigned users (users without a shop)
/// These users can be assigned to a shop by owners
final unassignedUsersProvider = StreamProvider.autoDispose<List<UserModel>>((
  ref,
) {
  final owner = ref.watch(userSessionProvider);
  if (owner == null || owner.role != 'owner') {
    return Stream<List<UserModel>>.value(const <UserModel>[]);
  }

  final users = ref.watch(userServiceProvider);
  return users
      .watchUsersByShop(null)
      .map(
        (list) => list
            .where((user) => user.shopId == null || user.shopId!.isEmpty)
            .where((user) => user.role == null || user.role == 'employee')
            .toList(growable: false),
      );
});
