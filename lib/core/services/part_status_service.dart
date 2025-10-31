import 'package:cloud_firestore/cloud_firestore.dart';

import 'package:kaportapp/core/models/part_status_model.dart';
import 'package:kaportapp/core/services/part_service.dart';

class PartStatusService {
  PartStatusService({FirebaseFirestore? firestore})
    : _firestore = firestore ?? FirebaseFirestore.instance,
      _partService = PartService(firestore: firestore);

  final FirebaseFirestore _firestore;
  final PartService _partService;

  CollectionReference<Map<String, dynamic>> _statusesRef(String shopId) {
    return _firestore.collection('shops').doc(shopId).collection('statuses');
  }

  Stream<List<PartStatusModel>> watchStatuses(String shopId) {
    return _statusesRef(shopId)
        .orderBy('name')
        .snapshots()
        .map(
          (snapshot) => snapshot.docs
              .map(PartStatusModel.fromDoc)
              .toList(growable: false),
        );
  }

  Future<void> seedDefaultStatuses(String shopId) async {
    final existing = await _statusesRef(shopId).limit(1).get();
    if (existing.docs.isNotEmpty) {
      return;
    }

    final batch = _firestore.batch();
    for (final template in PartStatusModel.defaultSeed) {
      final docRef = _statusesRef(shopId).doc();
      batch.set(docRef, template.toMap());
    }
    await batch.commit();
  }

  Future<void> addStatus({
    required String shopId,
    required String name,
    String? colorHex,
  }) async {
    final sanitizedName = name.trim();
    if (sanitizedName.isEmpty) {
      throw ArgumentError('Durum adı boş olamaz');
    }

    final normalizedColor = PartStatusModel.ensurePaletteColor(colorHex);

    final existing = await _statusesRef(
      shopId,
    ).where('name', isEqualTo: sanitizedName).limit(1).get();
    if (existing.docs.isNotEmpty) {
      throw ArgumentError('Bu ad ile bir durum zaten mevcut');
    }

    await _statusesRef(shopId).add(
      PartStatusModel(
        id: '',
        name: sanitizedName,
        colorHex: normalizedColor,
      ).toMap(),
    );
  }

  Future<void> updateStatus({
    required String shopId,
    required String statusId,
    required String name,
    String? colorHex,
  }) async {
    final sanitizedName = name.trim();
    if (sanitizedName.isEmpty) {
      throw ArgumentError('Durum adı boş olamaz');
    }

    final normalizedColor = PartStatusModel.ensurePaletteColor(colorHex);

    final possibleDuplicate = await _statusesRef(
      shopId,
    ).where('name', isEqualTo: sanitizedName).limit(1).get();
    if (possibleDuplicate.docs.isNotEmpty &&
        possibleDuplicate.docs.first.id != statusId) {
      throw ArgumentError('Bu ad ile bir durum zaten mevcut');
    }

    await _statusesRef(shopId)
        .doc(statusId)
        .update(
          PartStatusModel(
            id: statusId,
            name: sanitizedName,
            colorHex: normalizedColor,
          ).toMap(),
        );
  }

  Future<void> deleteStatus({
    required String shopId,
    required PartStatusModel status,
    String fallbackName = PartStatusModel.defaultName,
  }) async {
    await _firestore.runTransaction((transaction) async {
      final statusRef = _statusesRef(shopId).doc(status.id);
      transaction.delete(statusRef);
    });

    await _partService.updateStatusForShop(
      shopId: shopId,
      fromStatus: status.name,
      fallbackStatus: fallbackName,
    );
  }

  Future<void> deleteAllStatuses(String shopId) async {
    final snapshot = await _statusesRef(shopId).get();
    if (snapshot.docs.isEmpty) {
      return;
    }

    final batch = _firestore.batch();
    for (final doc in snapshot.docs) {
      batch.delete(doc.reference);
    }
    await batch.commit();
  }
}
