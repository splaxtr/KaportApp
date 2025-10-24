import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';

import '../models/user_model.dart';
import '../models/vehicle_model.dart';

class VehicleService {
  VehicleService({FirebaseFirestore? firestore})
    : this._(firestore ?? FirebaseFirestore.instance);

  VehicleService._(FirebaseFirestore firestore)
    : _firestore = firestore,
      _vehiclesCollection = firestore.collection('vehicles'),
      _partsCollection = firestore.collection('parts');

  final FirebaseFirestore _firestore;
  final CollectionReference<Map<String, dynamic>> _vehiclesCollection;
  final CollectionReference<Map<String, dynamic>> _partsCollection;

  Future<void> addItem(VehicleModel model, UserModel actor) async {
    // Validate actor has permission
    if (actor.role != 'owner' && actor.role != 'employee') {
      throw VehicleServiceException('Yetkisiz işlem');
    }

    // Validate shopId matches actor's shop
    if (model.shopId != actor.shopId) {
      throw VehicleServiceException('Araç sadece kendi dükkanınıza eklenebilir');
    }

    try {
      final data = model.toFirestore();
      data['createdAt'] ??= FieldValue.serverTimestamp();
      await _vehiclesCollection.doc(model.id).set(data);
    } on FirebaseException catch (exception) {
      debugPrint('VehicleService.addItem error: $exception');
      throw VehicleServiceException(
        'Araç eklenemedi: ${exception.message ?? exception.code}',
      );
    }
  }

  Future<void> updateItem(String id, Map<String, dynamic> data) async {
    try {
      final payload = Map<String, dynamic>.from(data)
        ..['updatedAt'] = FieldValue.serverTimestamp();
      await _vehiclesCollection.doc(id).update(payload);
    } on FirebaseException catch (exception) {
      debugPrint('VehicleService.updateItem error: $exception');
      throw VehicleServiceException(
        'Araç güncellenemedi: ${exception.message ?? exception.code}',
      );
    }
  }

  Future<void> deleteItem(String id) async {
    try {
      final batch = _firestore.batch();
      final vehicleRef = _vehiclesCollection.doc(id);
      batch.delete(vehicleRef);

      final relatedParts = await _partsCollection
          .where('vehicleId', isEqualTo: id)
          .get();

      for (final doc in relatedParts.docs) {
        batch.delete(doc.reference);
      }

      await batch.commit();
    } on FirebaseException catch (exception) {
      debugPrint('VehicleService.deleteItem error: $exception');
      throw VehicleServiceException(
        'Araç silinemedi: ${exception.message ?? exception.code}',
      );
    }
  }

  Stream<List<VehicleModel>> getItemsByShop(String shopId) {
    return _vehiclesCollection
        .where('shopId', isEqualTo: shopId)
        .snapshots()
        .map(
          (snapshot) => snapshot.docs
              .map(VehicleModel.fromSnapshot)
              .toList(growable: false),
        );
  }

  Future<VehicleModel?> getItemById(String id) async {
    try {
      final snapshot = await _vehiclesCollection.doc(id).get();
      if (!snapshot.exists) {
        return null;
      }
      return VehicleModel.fromSnapshot(snapshot);
    } on FirebaseException catch (exception) {
      debugPrint('VehicleService.getItemById error: $exception');
      throw VehicleServiceException(
        'Araç getirilemedi: ${exception.message ?? exception.code}',
      );
    }
  }
}

class VehicleServiceException implements Exception {
  VehicleServiceException(this.message);

  final String message;

  @override
  String toString() => message;
}
