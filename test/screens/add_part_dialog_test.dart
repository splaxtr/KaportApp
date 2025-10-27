import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:kaportapp/models/part_model.dart';
import 'package:kaportapp/models/user_model.dart';
import 'package:kaportapp/screens/add_part_dialog.dart';
import 'package:kaportapp/services/part_service.dart';
import 'package:kaportapp/state/part_providers.dart';
import 'package:kaportapp/state/user_session.dart';

class MockPartService extends Mock implements PartService {}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  const fallbackPart = PartModel(
    id: 'fallback',
    vehicleId: 'vehicle',
    name: 'fallback-part',
    position: '',
    status: 'pending',
    quantity: 1,
    shopId: 'shop',
  );

  const fallbackUser = UserModel(
    id: 'user-fallback',
    name: 'Fallback User',
    email: 'fallback@user.dev',
    role: 'owner',
    shopId: 'shop',
  );

  setUpAll(() {
    registerFallbackValue(fallbackPart);
    registerFallbackValue(fallbackUser);
    registerFallbackValue(<PartModel>[]);
  });

  late MockPartService partService;

  const testUser = UserModel(
    id: 'user-1',
    name: 'Test User',
    email: 'test@user.dev',
    role: 'owner',
    shopId: 'shop-1',
  );

  Future<void> pumpAddPartDialog(WidgetTester tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          userSessionProvider.overrideWith(
            (ref) => Stream<UserModel?>.value(testUser),
          ),
          partServiceProvider.overrideWith((ref) => partService),
        ],
        child: const MaterialApp(
          home: Scaffold(
            body: Center(child: AddPartDialog(vehicleId: 'vehicle-1')),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
  }

  final saveButtonFinder = find.byKey(const Key('add-part-save-button'));
  final partsFieldFinder = find.byKey(const Key('add-part-multiline-field'));

  setUp(() {
    partService = MockPartService();
  });

  group('AddPartDialog multi-part input', () {
    testWidgets(
      'empty text field shows no checkboxes and keeps save disabled',
      (tester) async {
        await pumpAddPartDialog(tester);

        expect(find.byType(CheckboxListTile), findsNothing);

        final saveButton = tester.widget<FilledButton>(saveButtonFinder);
        expect(saveButton.onPressed, isNull);
      },
    );

    testWidgets('parses multi-line input into checkbox list', (tester) async {
      await pumpAddPartDialog(tester);

      const parts = 'sağ far\nkaput\narka tampon';
      await tester.enterText(partsFieldFinder, parts);
      await tester.pumpAndSettle();

      expect(find.byType(CheckboxListTile), findsNWidgets(3));

      await tester.enterText(partsFieldFinder, 'sağ far\narka tampon');
      await tester.pumpAndSettle();

      expect(find.byType(CheckboxListTile), findsNWidgets(2));
      expect(find.text('kaput'), findsNothing);
    });

    testWidgets('deduplicates identical lines', (tester) async {
      await pumpAddPartDialog(tester);

      const parts = 'sağ far\nkaput\nsağ far\nkaput';
      await tester.enterText(partsFieldFinder, parts);
      await tester.pumpAndSettle();

      expect(find.byType(CheckboxListTile), findsNWidgets(2));
      expect(find.text('sağ far'), findsOneWidget);
      expect(find.text('kaput'), findsOneWidget);
    });

    testWidgets('checkbox selection and select-all controls update state', (
      tester,
    ) async {
      await pumpAddPartDialog(tester);

      const parts = 'sağ far\nkaput\narka tampon';
      await tester.enterText(partsFieldFinder, parts);
      await tester.pumpAndSettle();

      expect(find.byType(CheckboxListTile), findsNWidgets(3));

      await tester.tap(find.widgetWithText(CheckboxListTile, 'sağ far'));
      await tester.pump();

      final saveAfterSelection = tester.widget<FilledButton>(saveButtonFinder);
      expect(saveAfterSelection.onPressed, isNotNull);

      await tester.tap(find.widgetWithText(FilledButton, 'Tümünü Seç'));
      await tester.pump();

      for (final partName in ['sağ far', 'kaput', 'arka tampon']) {
        final tile = tester.widget<CheckboxListTile>(
          find.widgetWithText(CheckboxListTile, partName),
        );
        expect(tile.value, isTrue);
      }

      await tester.tap(find.widgetWithText(FilledButton, 'Tümünü Kaldır'));
      await tester.pump();

      for (final partName in ['sağ far', 'kaput', 'arka tampon']) {
        final tile = tester.widget<CheckboxListTile>(
          find.widgetWithText(CheckboxListTile, partName),
        );
        expect(tile.value, isFalse);
      }
    });

    testWidgets('save button uses batch add and resets form', (tester) async {
      when(
        () => partService.addItems(
          models: any(named: 'models'),
          actor: any(named: 'actor'),
        ),
      ).thenAnswer((_) async {});

      await pumpAddPartDialog(tester);

      const parts = 'sağ far\nkaput\narka tampon';
      await tester.enterText(partsFieldFinder, parts);
      await tester.pumpAndSettle();

      await tester.tap(find.widgetWithText(FilledButton, 'Tümünü Seç'));
      await tester.pump();

      final scrollable = find.ancestor(
        of: saveButtonFinder,
        matching: find.byType(Scrollable),
      );
      await tester.scrollUntilVisible(
        saveButtonFinder,
        200,
        scrollable: scrollable,
      );
      await tester.tap(saveButtonFinder);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      final captured =
          verify(
                () => partService.addItems(
                  models: captureAny(named: 'models'),
                  actor: any(named: 'actor'),
                ),
              ).captured.single
              as List<PartModel>;
      expect(captured, hasLength(3));

      expect(find.text('3 parça eklendi.'), findsOneWidget);

      final textField = tester.widget<TextField>(partsFieldFinder);
      expect(textField.controller?.text ?? '', isEmpty);
      expect(find.byType(CheckboxListTile), findsNothing);
      expect(find.text('Son Eklenenler'), findsOneWidget);
    });

    testWidgets('errors surface via SnackBar and preserve form state', (
      tester,
    ) async {
      when(
        () => partService.addItems(
          models: any(named: 'models'),
          actor: any(named: 'actor'),
        ),
      ).thenThrow(PartServiceException('Firestore hatası'));

      await pumpAddPartDialog(tester);

      const parts = 'sağ far\nkaput';
      await tester.enterText(partsFieldFinder, parts);
      await tester.pumpAndSettle();

      await tester.tap(find.widgetWithText(CheckboxListTile, 'sağ far'));
      await tester.pump();

      final scrollable = find.ancestor(
        of: saveButtonFinder,
        matching: find.byType(Scrollable),
      );
      await tester.scrollUntilVisible(
        saveButtonFinder,
        200,
        scrollable: scrollable,
      );
      await tester.tap(saveButtonFinder);
      await tester.pump();

      expect(find.text('Firestore hatası'), findsOneWidget);

      final textField = tester.widget<TextField>(partsFieldFinder);
      expect(textField.controller?.text, equals('sağ far\nkaput'));

      final checkbox = tester.widget<CheckboxListTile>(
        find.widgetWithText(CheckboxListTile, 'sağ far'),
      );
      expect(checkbox.value, isTrue);

      verify(
        () => partService.addItems(
          models: any(named: 'models'),
          actor: any(named: 'actor'),
        ),
      ).called(1);

      final saveButton = tester.widget<FilledButton>(saveButtonFinder);
      expect(saveButton.onPressed, isNotNull);
    });
  });
}
