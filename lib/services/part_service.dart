import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';

import '../models/part_model.dart';
import '../models/user_model.dart';

/// Custom exception for PartService errors
class PartServiceException implements Exception {
  PartServiceException(this.message);

  final String message;

  @override
  String toString() => 'PartServiceException: $message';
}

/// Service for managing vehicle parts in Firestore
class PartService {
  PartService({FirebaseFirestore? firestore})
      : this._(firestore ?? FirebaseFirestore.instance);

  PartService._(FirebaseFirestore firestore)
      : _partsCollection = firestore.collection('parts');

  final CollectionReference<Map<String, dynamic>> _partsCollection;

  /// Add a new part to the collection
  Future<void> addItem(PartModel model, UserModel actor) async {
    // Validate actor has permission
    if (actor.role != 'owner' && actor.role != 'employee') {
      throw PartServiceException('Yetkisiz işlem');
    }

    // Validate shopId matches actor's shop
    if (model.shopId != actor.shopId) {
      throw PartServiceException('Parça sadece kendi dükkanınıza eklenebilir');
    }

    try {
      final data = model.toFirestore();
      data['createdAt'] ??= FieldValue.serverTimestamp();
      await _partsCollection.doc(model.id).set(data);
    } on FirebaseException catch (exception) {
      debugPrint('PartService.addItem error: $exception');
      throw PartServiceException(
        'Parça eklenemedi: ${exception.message ?? exception.code}',
      );
    }
  }

  /// Update an existing part with actor validation
  Future<void> updatePart({
    required UserModel actor,
    required String partId,
    required Map<String, dynamic> updates,
  }) async {
    // Validate actor has permission
    if (actor.role != 'owner' && actor.role != 'employee') {
      throw PartServiceException('Yetkisiz işlem');
    }

    try {
      // Fetch the part to validate shopId
      final partDoc = await _partsCollection.doc(partId).get();
      if (!partDoc.exists) {
        throw PartServiceException('Parça bulunamadı');
      }

      final partData = partDoc.data();
      if (partData == null) {
        throw PartServiceException('Parça verisi bulunamadı');
      }

      final partShopId = partData['shopId'] as String?;

      // Validate shopId matches actor's shop
      if (partShopId != actor.shopId) {
        throw PartServiceException('Bu parçayı düzenleme yetkiniz yok');
      }

      final payload = Map<String, dynamic>.from(updates)
        ..['updatedAt'] = FieldValue.serverTimestamp();
      await _partsCollection.doc(partId).update(payload);
    } on PartServiceException {
      rethrow;
    } on FirebaseException catch (exception) {
      debugPrint('PartService.updatePart error: $exception');
      throw PartServiceException(
        'Parça güncellenemedi: ${exception.message ?? exception.code}',
      );
    }
  }

  /// Delete a part by ID with actor validation
  Future<void> deletePart({
    required UserModel actor,
    required String partId,
  }) async {
    // Validate actor has permission
    if (actor.role != 'owner' && actor.role != 'employee') {
      throw PartServiceException('Yetkisiz işlem');
    }

    try {
      // Fetch the part to validate shopId
      final partDoc = await _partsCollection.doc(partId).get();
      if (!partDoc.exists) {
        throw PartServiceException('Parça bulunamadı');
      }

      final partData = partDoc.data();
      if (partData == null) {
        throw PartServiceException('Parça verisi bulunamadı');
      }

      final partShopId = partData['shopId'] as String?;

      // Validate shopId matches actor's shop
      if (partShopId != actor.shopId) {
        throw PartServiceException('Bu parçayı silme yetkiniz yok');
      }

      await _partsCollection.doc(partId).delete();
    } on PartServiceException {
      rethrow;
    } on FirebaseException catch (exception) {
      debugPrint('PartService.deletePart error: $exception');
      throw PartServiceException(
        'Parça silinemedi: ${exception.message ?? exception.code}',
      );
    }
  }

  /// Update an existing part (legacy method, use updatePart instead)
  @Deprecated('Use updatePart with actor validation instead')
  Future<void> updateItem(String id, Map<String, dynamic> data) async {
    try {
      final payload = Map<String, dynamic>.from(data)
        ..['updatedAt'] = FieldValue.serverTimestamp();
      await _partsCollection.doc(id).update(payload);
    } on FirebaseException catch (exception) {
      debugPrint('PartService.updateItem error: $exception');
      throw PartServiceException(
        'Parça güncellenemedi: ${exception.message ?? exception.code}',
      );
    }
  }

  /// Delete a part by ID (legacy method, use deletePart instead)
  @Deprecated('Use deletePart with actor validation instead')
  Future<void> deleteItem(String id) async {
    try {
      await _partsCollection.doc(id).delete();
    } on FirebaseException catch (exception) {
      debugPrint('PartService.deleteItem error: $exception');
      throw PartServiceException(
        'Parça silinemedi: ${exception.message ?? exception.code}',
      );
    }
  }

  /// Get parts stream filtered by shop ID
  Stream<List<PartModel>> getItemsByShop(String shopId) {
    return _partsCollection
        .where('shopId', isEqualTo: shopId)
        .snapshots()
        .map(
          (snapshot) => snapshot.docs
              .map(PartModel.fromSnapshot)
              .toList(growable: false),
        );
  }

  /// Get parts stream filtered by vehicle ID and shop ID
  /// Both filters are required for Firestore security rules to work properly
  Stream<List<PartModel>> getItemsByVehicle(String vehicleId, String shopId) {
    return _partsCollection
        .where('vehicleId', isEqualTo: vehicleId)
        .where('shopId', isEqualTo: shopId)
        .snapshots()
        .map(
          (snapshot) => snapshot.docs
              .map(PartModel.fromSnapshot)
              .toList(growable: false),
        );
  }

  /// Get a single part by ID
  Future<PartModel?> getItemById(String id) async {
    try {
      final snapshot = await _partsCollection.doc(id).get();
      if (!snapshot.exists) {
        return null;
      }
      return PartModel.fromSnapshot(snapshot);
    } on FirebaseException catch (exception) {
      debugPrint('PartService.getItemById error: $exception');
      throw PartServiceException(
        'Parça getirilemedi: ${exception.message ?? exception.code}',
      );
    }
  }
}
