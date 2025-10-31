import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:kaportapp/core/models/part_status_model.dart';
import 'package:kaportapp/core/models/user_model.dart';
import 'package:kaportapp/core/state/user_session.dart';
import 'package:kaportapp/features/part/application/part_status_providers.dart';
import 'package:kaportapp/features/part/presentation/manage_part_statuses_screen.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  const testStatuses = [
    PartStatusModel(
      id: 'status-default',
      name: PartStatusModel.defaultName,
      colorHex: PartStatusModel.defaultColorHex,
    ),
    PartStatusModel(
      id: 'status-installed',
      name: 'Takıldı',
      colorHex: '#4CAF50',
    ),
  ];

  ProviderScope buildScope(UserModel user) {
    return ProviderScope(
      overrides: [
        userSessionProvider.overrideWith(
          (ref) => UserSessionNotifier.test(user),
        ),
        partStatusesProvider(user.shopId!).overrideWith(
          (ref) => Stream<List<PartStatusModel>>.value(testStatuses),
        ),
      ],
      child: const MaterialApp(home: ManagePartStatusesScreen()),
    );
  }

  const ownerUser = UserModel(
    id: 'owner-1',
    name: 'Owner',
    email: 'owner@shop.dev',
    role: 'owner',
    shopId: 'shop-1',
  );

  const employeeUser = UserModel(
    id: 'employee-1',
    name: 'Employee',
    email: 'employee@shop.dev',
    role: 'employee',
    shopId: 'shop-1',
  );

  testWidgets('owners can access add/edit/delete controls', (tester) async {
    await tester.pumpWidget(buildScope(ownerUser));
    await tester.pumpAndSettle();

    expect(find.byType(FloatingActionButton), findsOneWidget);
    expect(find.byIcon(Icons.edit), findsWidgets);
    expect(find.byIcon(Icons.delete_outline), findsWidgets);
  });

  testWidgets('employees see read-only status list', (tester) async {
    await tester.pumpWidget(buildScope(employeeUser));
    await tester.pumpAndSettle();

    expect(find.byType(FloatingActionButton), findsNothing);
    expect(find.byIcon(Icons.edit), findsNothing);
    expect(find.byIcon(Icons.delete_outline), findsNothing);
  });
}
