import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';

import 'package:kaportapp/core/models/shop_model.dart';
import 'package:kaportapp/core/models/user_model.dart';
import 'package:kaportapp/core/models/vehicle_model.dart';
import 'package:kaportapp/core/services/part_status_service.dart';
import 'package:kaportapp/core/utils/acl.dart';

/// Custom exception for ShopService errors
class ShopServiceException implements Exception {
  ShopServiceException(this.message);

  final String message;

  @override
  String toString() => 'ShopServiceException: $message';
}

/// Service for managing shops and their employees
class ShopService {
  ShopService({FirebaseFirestore? firestore})
    : _db = firestore ?? FirebaseFirestore.instance,
      _partStatusService = PartStatusService(firestore: firestore);

  final FirebaseFirestore _db;
  final PartStatusService _partStatusService;

  Stream<ShopModel?> watchShop(String shopId) {
    return _db
        .collection('shops')
        .doc(shopId)
        .snapshots()
        .map((snapshot) => snapshot.exists ? ShopModel.fromDoc(snapshot) : null);
  }

  Stream<List<UserModel>> watchShopEmployees(String shopId) {
    return _db
        .collection('users')
        .where('shopId', isEqualTo: shopId)
        .where('role', isEqualTo: 'employee')
        .snapshots()
        .map(
          (snapshot) => snapshot.docs
              .map((doc) => UserModel.fromDoc(doc.id, doc.data()))
              .toList(growable: false),
        );
  }

  Stream<List<UserModel>> watchAssignableEmployees() {
    return _db
        .collection('users')
        .where('shopId', isNull: true)
        .snapshots()
        .map(
          (snapshot) => snapshot.docs
              .map((doc) => UserModel.fromDoc(doc.id, doc.data()))
              .where(
                (user) => user.role == null ||
                    user.role!.isEmpty ||
                    user.role == 'employee',
              )
              .toList(growable: false),
        );
  }

  Stream<List<VehicleModel>> watchShopVehicles(String shopId) {
    return _db
        .collection('vehicles')
        .where('shopId', isEqualTo: shopId)
        .snapshots()
        .map(
          (snapshot) => snapshot.docs
              .map(VehicleModel.fromSnapshot)
              .toList(growable: false),
        );
  }

  Stream<List<ShopModel>> watchShops() {
    return _db
        .collection('shops')
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map(
          (snapshot) => snapshot.docs
              .map((doc) => ShopModel.fromDoc(doc))
              .toList(growable: false),
        );
  }

  Stream<List<UserModel>> watchUsers() {
    return _db
        .collection('users')
        .snapshots()
        .map(
          (snapshot) => snapshot.docs
              .map((doc) => UserModel.fromDoc(doc.id, doc.data()))
              .toList(growable: false),
        );
  }

  Stream<List<UserModel>> watchUsersWithoutShop() {
    return _db
        .collection('users')
        .where('shopId', isNull: true)
        .snapshots()
        .map(
          (snapshot) => snapshot.docs
              .map((doc) => UserModel.fromDoc(doc.id, doc.data()))
              .toList(growable: false),
        );
  }

  Stream<List<UserModel>> watchUsersByShop(String shopId) {
    return _db
        .collection('users')
        .where('shopId', isEqualTo: shopId)
        .snapshots()
        .map(
          (snapshot) => snapshot.docs
              .map((doc) => UserModel.fromDoc(doc.id, doc.data()))
              .toList(growable: false),
        );
  }

  Future<String> createShop({
    required UserModel actor,
    required String name,
    required String ownerId,
  }) async {
    if (!Acl.canAdminShops(actor)) {
      throw Exception('Yetki yok');
    }

    try {
      final ownerDoc = await _db.collection('users').doc(ownerId).get();
      if (!ownerDoc.exists) {
        throw Exception('Sahip bulunamadı');
      }
      final owner = UserModel.fromDoc(ownerDoc.id, ownerDoc.data()!);
      if (owner.shopId != null && owner.shopId!.isNotEmpty) {
        throw Exception('Kullanıcı zaten bir dükkana bağlı');
      }

      final batch = _db.batch();
      final shopRef = _db.collection('shops').doc();
      batch.set(shopRef, {
        'name': name,
        'ownerId': ownerId,
        'users': <String>[ownerId],
        'createdAt': FieldValue.serverTimestamp(),
      });
      batch.update(_db.collection('users').doc(ownerId), {
        'shopId': shopRef.id,
        'role': 'owner',
      });

      await batch.commit();
      await _partStatusService.seedDefaultStatuses(shopRef.id);
      return shopRef.id;
    } on FirebaseException catch (error) {
      debugPrint('createShop error: $error');
      throw Exception('Dükkan oluşturulamadı');
    }
  }

  Future<void> updateShop({
    required UserModel actor,
    required String shopId,
    required Map<String, dynamic> data,
  }) async {
    if (!(Acl.canAdminShops(actor) ||
        (actor.role == 'owner' && actor.shopId == shopId))) {
      throw Exception('Yetki yok');
    }
    try {
      await _db.collection('shops').doc(shopId).update(data);
    } on FirebaseException catch (error) {
      debugPrint('updateShop error: $error');
      throw Exception('Dükkan güncellenemedi');
    }
  }

  Future<void> addUserToShop({
    required UserModel actor,
    required String shopId,
    required String userId,
  }) async {
    if (!Acl.canManageUsers(actor, shopId)) {
      throw Exception('Yetki yok');
    }

    try {
      final userDoc = await _db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        throw Exception('Kullanıcı bulunamadı');
      }
      final data = userDoc.data() ?? <String, dynamic>{};
      final currentShopId = data['shopId'] as String?;
      if (currentShopId != null && currentShopId.isNotEmpty) {
        throw Exception('Kullanıcı başka bir dükkana bağlı');
      }

      final batch = _db.batch();
      batch.update(_db.collection('shops').doc(shopId), {
        'users': FieldValue.arrayUnion([userId]),
      });
      batch.update(_db.collection('users').doc(userId), {
        'shopId': shopId,
        'role': 'employee',
      });
      await batch.commit();
    } on FirebaseException catch (error) {
      debugPrint('addUserToShop error: $error');
      throw Exception('Kullanıcı eklenemedi');
    }
  }

  Future<void> addUserToShopByEmail({
    required UserModel actor,
    required String shopId,
    required String email,
  }) async {
    final normalizedEmail = email.trim().toLowerCase();
    final query = await _db
        .collection('users')
        .where('email', isEqualTo: normalizedEmail)
        .limit(1)
        .get();
    if (query.docs.isEmpty) {
      throw Exception('Kullanıcı bulunamadı');
    }
    final user = UserModel.fromDoc(
      query.docs.first.id,
      query.docs.first.data(),
    );
    return addUserToShop(actor: actor, shopId: shopId, userId: user.id);
  }

  Future<void> removeUserFromShop({
    required UserModel actor,
    required String shopId,
    required String userId,
  }) async {
    if (!Acl.canManageUsers(actor, shopId)) {
      throw Exception('Yetki yok');
    }

    try {
      final batch = _db.batch();
      batch.update(_db.collection('shops').doc(shopId), {
        'users': FieldValue.arrayRemove([userId]),
      });
      batch.update(_db.collection('users').doc(userId), {
        'shopId': null,
        'role': 'employee',
      });
      await batch.commit();
    } on FirebaseException catch (error) {
      debugPrint('removeUserFromShop error: $error');
      throw Exception('Kullanıcı çıkarılamadı');
    }
  }

  /// Assign an employee to the owner's shop
  /// Only owner can call this method
  /// This is a simplified version of addUserToShop specifically for employee assignment
  Future<void> assignEmployee({
    required UserModel actor,
    required String userId,
  }) async {
    try {
      // Only owners can assign employees
      if (actor.role != 'owner') {
        throw ShopServiceException('Yalnızca sahipler çalışan atayabilir');
      }

      // Owner must have a shop
      if (actor.shopId == null || actor.shopId!.isEmpty) {
        throw ShopServiceException('Dükkan bulunamadı');
      }

      // Fetch the user to be assigned
      final userDoc = await _db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        throw ShopServiceException('Kullanıcı bulunamadı');
      }

      final userData = userDoc.data();
      if (userData == null) {
        throw ShopServiceException('Kullanıcı verileri bulunamadı');
      }

      // Check if user is already assigned to a shop
      final currentShopId = userData['shopId'] as String?;
      if (currentShopId != null && currentShopId.isNotEmpty) {
        throw ShopServiceException('Kullanıcı zaten bir dükkana atanmış');
      }

      // Assign employee
      final batch = _db.batch();

      // Update shop's users array
      batch.update(_db.collection('shops').doc(actor.shopId!), {
        'users': FieldValue.arrayUnion([userId]),
      });

      // Update user's role and shopId
      batch.update(_db.collection('users').doc(userId), {
        'shopId': actor.shopId!,
        'role': 'employee',
      });

      await batch.commit();
    } on ShopServiceException {
      rethrow;
    } on FirebaseException catch (e) {
      debugPrint('ShopService.assignEmployee error: ${e.code} - ${e.message}');
      throw ShopServiceException('Çalışan atanamadı: ${e.message ?? e.code}');
    } catch (e) {
      debugPrint('ShopService.assignEmployee unexpected error: $e');
      throw ShopServiceException('Çalışan atanırken beklenmeyen hata oluştu');
    }
  }

  /// Get list of unassigned users (users without a shop)
  /// These users can be assigned to a shop
  /// Note: Firestore doesn't support whereIn with null values, so we fetch all users
  /// and filter client-side
  Stream<List<UserModel>> watchUnassignedUsers() {
    return _db
        .collection('users')
        .snapshots()
        .map(
          (snapshot) => snapshot.docs
              .map((doc) => UserModel.fromDoc(doc.id, doc.data()))
              .where((user) {
                // Filter users without a shop
                final hasNoShop = user.shopId == null || user.shopId!.isEmpty;
                // Exclude admin and owner roles
                final isNotAdminOrOwner =
                    user.role != 'admin' && user.role != 'owner';
                return hasNoShop && isNotAdminOrOwner;
              })
              .toList(growable: false),
        );
  }

  Future<void> deleteShop({
    required UserModel actor,
    required String shopId,
  }) async {
    if (!Acl.canAdminShops(actor)) {
      throw ShopServiceException('Yalnızca yöneticiler mağaza silebilir');
    }

    final shopRef = _db.collection('shops').doc(shopId);

    try {
      final snapshot = await shopRef.get();
      if (!snapshot.exists) {
        throw ShopServiceException('Dükkan bulunamadı');
      }

      final data = snapshot.data() ?? <String, dynamic>{};
      final users = ((data['users'] as List?) ?? const <dynamic>[])
          .map((e) => e.toString())
          .toList(growable: false);
      final ownerId = data['ownerId'] as String?;

      final batch = _db.batch();

      for (final userId in users) {
        final userRef = _db.collection('users').doc(userId);
        final update = <String, dynamic>{'shopId': null};
        if (userId != ownerId) {
          update['role'] = 'employee';
        }
        batch.update(userRef, update);
      }

      // Delete vehicles associated with the shop
      final vehiclesSnapshot = await _db
          .collection('vehicles')
          .where('shopId', isEqualTo: shopId)
          .get();
      for (final doc in vehiclesSnapshot.docs) {
        batch.delete(doc.reference);
      }

      // Delete parts associated with the shop
      final partsSnapshot = await _db
          .collection('parts')
          .where('shopId', isEqualTo: shopId)
          .get();
      for (final doc in partsSnapshot.docs) {
        batch.delete(doc.reference);
      }

      batch.delete(shopRef);

      await _partStatusService.deleteAllStatuses(shopId);

      await batch.commit();
    } on ShopServiceException {
      rethrow;
    } on FirebaseException catch (error) {
      debugPrint('deleteShop error: ${error.message ?? error.code}');
      throw ShopServiceException('Dükkan silinemedi: ${error.message ?? error.code}');
    } catch (error) {
      debugPrint('deleteShop unexpected error: $error');
      throw ShopServiceException('Dükkan silinirken beklenmeyen hata oluştu');
    }
  }
}
