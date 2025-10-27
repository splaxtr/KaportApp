import 'package:fake_cloud_firestore/fake_cloud_firestore.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:kaportapp/models/part_model.dart';
import 'package:kaportapp/models/user_model.dart';
import 'package:kaportapp/services/part_service.dart';

void main() {
  late FakeFirebaseFirestore firestore;
  late PartService service;

  const actor = UserModel(
    id: 'actor-1',
    name: 'Owner',
    email: 'owner@shop.dev',
    role: 'owner',
    shopId: 'shop-1',
  );

  const basePart = PartModel(
    id: 'part-1',
    vehicleId: 'vehicle-1',
    name: 'sağ far',
    position: '',
    status: 'pending',
    quantity: 1,
    shopId: 'shop-1',
  );

  setUp(() {
    firestore = FakeFirebaseFirestore();
    service = PartService(firestore: firestore);
  });

  test('addItems writes one document per model', () async {
    final parts = List.generate(3, (index) {
      final suffix = index + 1;
      return basePart.copyWith(id: 'part-$suffix', name: 'part-$suffix');
    });

    await service.addItems(models: parts, actor: actor);

    final snapshot = await firestore.collection('parts').get();
    expect(snapshot.docs.length, parts.length);
  });

  test('addItems persists metadata and timestamp', () async {
    await service.addItems(models: [basePart], actor: actor);

    final doc = await firestore.collection('parts').doc(basePart.id).get();
    final data = doc.data();

    expect(data, isNotNull);
    expect(data!['shopId'], equals(actor.shopId));
    expect(data['name'], equals(basePart.name));
    expect(data['createdAt'], isNotNull);
  });

  test('addItems rejects models with mismatched shop', () async {
    final mismatched = basePart.copyWith(shopId: 'shop-2');

    await expectLater(
      () => service.addItems(models: [mismatched], actor: actor),
      throwsA(isA<PartServiceException>()),
    );
  });

  test('addItem still persists a single part', () async {
    await service.addItem(basePart, actor);

    final snapshot = await firestore.collection('parts').get();
    expect(snapshot.docs, hasLength(1));
    expect(snapshot.docs.first.data()['name'], equals(basePart.name));
  });
}
