import 'package:fake_cloud_firestore/fake_cloud_firestore.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:kaportapp/core/models/user_model.dart';
import 'package:kaportapp/core/services/user_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late FakeFirebaseFirestore firestore;
  late UserService service;

  setUp(() {
    firestore = FakeFirebaseFirestore();
    service = UserService(firestore: firestore);
  });

  Future<void> seedUsers() async {
    await firestore.collection('users').doc('owner-1').set({
      'name': 'Owner Bir',
      'email': 'owner1@example.com',
      'role': 'owner',
      'shopId': null,
    });
    await firestore.collection('users').doc('owner-2').set({
      'name': 'Owner İki',
      'email': 'owner2@example.com',
      'role': 'owner',
      'shopId': 'shop-existing',
    });
    await firestore.collection('users').doc('candidate').set({
      'name': 'Aday',
      'email': 'candidate@example.com',
      'role': null,
      'shopId': null,
    });
    await firestore.collection('users').doc('employee').set({
      'name': 'Calisan',
      'email': 'employee@example.com',
      'role': 'employee',
      'shopId': null,
    });
  }

  test('getUsersByRole returns only matching roles including null', () async {
    await seedUsers();

    final result = await service.getUsersByRole(const [null, 'owner']).first;
    final ids = result.map((user) => user.id).toSet();

    expect(ids, contains('owner-1'));
    expect(ids, contains('candidate'));
    expect(ids, isNot(contains('employee')));
  });

  test('assignUserRole updates role and shopId with guards', () async {
    await firestore.collection('users').doc('user-1').set({
      'name': 'Test User',
      'email': 'test@example.com',
      'role': null,
      'shopId': null,
    });

    await service.assignUserRole('user-1', 'employee', 'shop-1');

    final snapshot = await firestore.collection('users').doc('user-1').get();
    final model = UserModel.fromDoc(snapshot.id, snapshot.data()!);

    expect(model.role, 'employee');
    expect(model.shopId, 'shop-1');

    await firestore.collection('users').doc('other-shop-user').set({
      'name': 'Other',
      'email': 'other@example.com',
      'role': 'employee',
      'shopId': 'shop-2',
    });

    await expectLater(
      () => service.assignUserRole('other-shop-user', 'employee', 'shop-3'),
      throwsA(isA<UserServiceException>()),
    );
  });
}
