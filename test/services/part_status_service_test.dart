import 'package:fake_cloud_firestore/fake_cloud_firestore.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:kaportapp/core/models/part_status_model.dart';
import 'package:kaportapp/core/services/part_status_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('PartStatusService', () {
    late FakeFirebaseFirestore firestore;
    late PartStatusService service;

    setUp(() {
      firestore = FakeFirebaseFirestore();
      service = PartStatusService(firestore: firestore);
    });

    test('seedDefaultStatuses creates default items once', () async {
      await service.seedDefaultStatuses('shop-1');

      final snapshot = await firestore
          .collection('shops')
          .doc('shop-1')
          .collection('statuses')
          .get();

      expect(snapshot.docs.length, PartStatusModel.defaultSeed.length);

      // Calling again should not duplicate entries
      await service.seedDefaultStatuses('shop-1');
      final secondSnapshot = await firestore
          .collection('shops')
          .doc('shop-1')
          .collection('statuses')
          .get();

      expect(secondSnapshot.docs.length, PartStatusModel.defaultSeed.length);
    });

    test(
      'addStatus falls back to palette when invalid color provided',
      () async {
        const shopId = 'shop-2';
        await service.addStatus(
          shopId: shopId,
          name: 'Özel Durum',
          colorHex: '#INVALID',
        );

        final doc = await firestore
            .collection('shops')
            .doc(shopId)
            .collection('statuses')
            .limit(1)
            .get();

        expect(doc.docs, hasLength(1));
        expect(
          doc.docs.first.data()['colorHex'],
          PartStatusModel.defaultColorHex,
        );
      },
    );
  });
}
