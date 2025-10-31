import 'dart:async';
import 'dart:collection';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:kaportapp/core/models/part_model.dart';
import 'package:kaportapp/core/models/part_status_model.dart';
import 'package:kaportapp/core/models/user_model.dart';
import 'package:kaportapp/core/services/part_service.dart';
import 'package:kaportapp/core/state/user_session.dart';
import 'package:kaportapp/features/part/application/part_providers.dart';
import 'package:kaportapp/features/part/application/part_status_providers.dart';

final _partsTextControllerProvider =
    Provider.autoDispose<TextEditingController>((ref) {
      final controller = TextEditingController();

      ref.onDispose(controller.dispose);

      ref.listen<AddPartDialogState>(addPartDialogControllerProvider, (
        previous,
        next,
      ) {
        if (controller.text != next.rawText) {
          controller
            ..text = next.rawText
            ..selection = TextSelection.collapsed(offset: next.rawText.length);
        }
      });

      return controller;
    });

class AddPartDialogState {
  const AddPartDialogState({
    required this.rawText,
    required this.parsedParts,
    required this.selectedParts,
    required this.isSaving,
    required this.recentlyAdded,
    required this.recentlyAddedAt,
    this.selectedStatus,
  });

  factory AddPartDialogState.initial() => const AddPartDialogState(
    rawText: '',
    parsedParts: <String>[],
    selectedParts: <String>{},
    isSaving: false,
    recentlyAdded: <String>[],
    recentlyAddedAt: null,
    selectedStatus: null,
  );

  static const Object _statusSentinel = Object();

  final String rawText;
  final List<String> parsedParts;
  final Set<String> selectedParts;
  final bool isSaving;
  final List<String> recentlyAdded;
  final DateTime? recentlyAddedAt;
  final String? selectedStatus;

  bool get canSubmit => !isSaving && selectedParts.isNotEmpty;

  AddPartDialogState copyWith({
    String? rawText,
    List<String>? parsedParts,
    Set<String>? selectedParts,
    bool? isSaving,
    List<String>? recentlyAdded,
    DateTime? recentlyAddedAt,
    Object? selectedStatus = _statusSentinel,
  }) {
    return AddPartDialogState(
      rawText: rawText ?? this.rawText,
      parsedParts: parsedParts ?? this.parsedParts,
      selectedParts: selectedParts ?? this.selectedParts,
      isSaving: isSaving ?? this.isSaving,
      recentlyAdded: recentlyAdded ?? this.recentlyAdded,
      recentlyAddedAt: recentlyAddedAt ?? this.recentlyAddedAt,
      selectedStatus: identical(selectedStatus, _statusSentinel)
          ? this.selectedStatus
          : selectedStatus as String?,
    );
  }
}

class AddPartDialogController extends Notifier<AddPartDialogState> {
  Timer? _recentClearTimer;

  @override
  AddPartDialogState build() {
    ref.onDispose(() {
      _recentClearTimer?.cancel();
      _recentClearTimer = null;
    });
    return AddPartDialogState.initial();
  }

  void updateText(String value) {
    final uniqueParts = LinkedHashSet<String>.from(
      value
          .split('\n')
          .map((line) => line.trim())
          .where((line) => line.isNotEmpty),
    ).toList(growable: false);

    final retainedSelection = state.selectedParts
        .where((part) => uniqueParts.contains(part))
        .toSet();

    state = state.copyWith(
      rawText: value,
      parsedParts: uniqueParts,
      selectedParts: retainedSelection,
    );
  }

  void toggleSelection(String partName, bool shouldSelect) {
    final nextSelection = Set<String>.from(state.selectedParts);
    if (shouldSelect) {
      nextSelection.add(partName);
    } else {
      nextSelection.remove(partName);
    }

    state = state.copyWith(selectedParts: nextSelection);
  }

  void selectAll() {
    if (state.parsedParts.isEmpty) return;

    state = state.copyWith(selectedParts: state.parsedParts.toSet());
  }

  void clearSelection() {
    if (state.selectedParts.isEmpty) return;

    state = state.copyWith(selectedParts: <String>{});
  }

  void syncStatuses(List<PartStatusModel> statuses) {
    if (statuses.isEmpty) {
      if (state.selectedStatus != null) {
        state = state.copyWith(selectedStatus: null);
      }
      return;
    }

    final hasValidSelection =
        state.selectedStatus != null &&
        statuses.any((status) => status.name == state.selectedStatus);

    if (!hasValidSelection) {
      state = state.copyWith(selectedStatus: statuses.first.name);
    }
  }

  void setSelectedStatus(String? statusName) {
    state = state.copyWith(selectedStatus: statusName);
  }

  Future<int> submit({
    required UserModel actor,
    required String vehicleId,
    required PartService service,
    required List<PartStatusModel> statuses,
  }) async {
    if (state.selectedParts.isEmpty || state.isSaving) {
      return 0;
    }

    state = state.copyWith(isSaving: true);

    final selectedNames = state.parsedParts
        .where((part) => state.selectedParts.contains(part))
        .toList(growable: false);

    if (selectedNames.isEmpty) {
      state = state.copyWith(isSaving: false);
      return 0;
    }

    final statusForSave =
        state.selectedStatus ??
        (statuses.isNotEmpty
            ? statuses.first.name
            : PartStatusModel.defaultName);

    final timestampBase = DateTime.now().millisecondsSinceEpoch;
    final partsToCreate = <PartModel>[];
    for (var i = 0; i < selectedNames.length; i++) {
      final name = selectedNames[i];
      partsToCreate.add(
        PartModel(
          id: '${actor.shopId}_part_${timestampBase + i}',
          vehicleId: vehicleId,
          name: name,
          position: '',
          status: statusForSave,
          quantity: 1,
          shopId: actor.shopId!,
        ),
      );
    }

    try {
      await service.addItems(models: partsToCreate, actor: actor);
    } finally {
      if (ref.mounted && state.isSaving) {
        state = state.copyWith(isSaving: false);
      }
    }

    if (!ref.mounted) {
      return selectedNames.length;
    }

    _recentClearTimer?.cancel();

    state = state.copyWith(
      rawText: '',
      parsedParts: const <String>[],
      selectedParts: const <String>{},
      recentlyAdded: selectedNames,
      recentlyAddedAt: DateTime.now(),
    );

    _recentClearTimer = Timer(const Duration(minutes: 1), () {
      if (!ref.mounted) return;
      state = state.copyWith(
        recentlyAdded: const <String>[],
        recentlyAddedAt: null,
      );
    });

    return selectedNames.length;
  }
}

final addPartDialogControllerProvider =
    NotifierProvider.autoDispose<AddPartDialogController, AddPartDialogState>(
      AddPartDialogController.new,
    );

class AddPartDialog extends ConsumerWidget {
  const AddPartDialog({super.key, required this.vehicleId});

  final String vehicleId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(addPartDialogControllerProvider);
    final controller = ref.read(addPartDialogControllerProvider.notifier);
    final textController = ref.watch(_partsTextControllerProvider);
    final service = ref.watch(partServiceProvider);
    final user = ref.watch(userSessionProvider);

    ref.listen<AddPartDialogState>(addPartDialogControllerProvider, (
      previous,
      next,
    ) {
      if (previous?.isSaving == true && !next.isSaving) {
        FocusScope.of(context).unfocus();
      }
    });

    if (user == null || user.shopId == null || user.shopId!.isEmpty) {
      return const AlertDialog(
        title: Text('Parça Ekle'),
        content: Text('Parça eklemek için bir dükkana atanmış olmalısınız.'),
      );
    }

    final shopId = user.shopId!;
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final hasParts = state.parsedParts.isNotEmpty;
    final allSelected =
        hasParts && state.selectedParts.length == state.parsedParts.length;
    final maxDialogHeight = MediaQuery.of(context).size.height * 0.9;
    final statusesAsync = ref.watch(partStatusesProvider(shopId));

    return statusesAsync.when(
      loading: () => const AlertDialog(
        content: SizedBox(
          height: 80,
          child: Center(child: CircularProgressIndicator()),
        ),
      ),
      error: (error, _) => AlertDialog(
        title: const Text('Parça Ekle'),
        content: Text('Durumlar yüklenemedi: $error'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).maybePop(),
            child: const Text('Kapat'),
          ),
        ],
      ),
      data: (statuses) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (!context.mounted) return;
          controller.syncStatuses(statuses);
        });
        final selectedStatus =
            state.selectedStatus ??
            (statuses.isNotEmpty ? statuses.first.name : null);

        return Dialog(
          insetPadding: const EdgeInsets.symmetric(
            horizontal: 24,
            vertical: 24,
          ),
          child: ConstrainedBox(
            constraints: BoxConstraints(
              maxWidth: 520,
              maxHeight: maxDialogHeight,
            ),
            child: SingleChildScrollView(
              key: const Key('add-part-dialog-scroll'),
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Parçaları Ekleyin', style: theme.textTheme.titleLarge),
                  const SizedBox(height: 16),
                  if (statuses.isNotEmpty)
                    DropdownButtonFormField<String>(
                      initialValue: selectedStatus,
                      decoration: const InputDecoration(
                        labelText: 'Varsayılan Durum',
                        border: OutlineInputBorder(),
                      ),
                      items: statuses
                          .map(
                            (status) => DropdownMenuItem(
                              value: status.name,
                              child: Row(
                                children: [
                                  Container(
                                    width: 14,
                                    height: 14,
                                    margin: const EdgeInsets.only(right: 8),
                                    decoration: BoxDecoration(
                                      color: status.color,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                  ),
                                  Text(status.name),
                                ],
                              ),
                            ),
                          )
                          .toList(),
                      onChanged: controller.setSelectedStatus,
                    )
                  else
                    Card(
                      color: colorScheme.surfaceContainerHighest,
                      child: const Padding(
                        padding: EdgeInsets.all(16),
                        child: Text(
                          'Durum tanımlı değil. Kaydedilen parçalar varsayılan olarak "Beklemede" ile işaretlenecek.',
                        ),
                      ),
                    ),
                  const SizedBox(height: 16),
                  TextField(
                    key: const Key('add-part-multiline-field'),
                    controller: textController,
                    maxLines: null,
                    onChanged: controller.updateText,
                    decoration: const InputDecoration(
                      labelText: 'Parçaları girin (her satıra bir parça)',
                      hintText:
                          'Örnek:\nsağ far\nsol davlumbaz\nkaput\narka tampon',
                      border: OutlineInputBorder(),
                      alignLabelWithHint: true,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 12,
                    runSpacing: 8,
                    children: [
                      FilledButton.tonal(
                        onPressed: hasParts && !allSelected
                            ? controller.selectAll
                            : null,
                        child: const Text('Tümünü Seç'),
                      ),
                      FilledButton.tonal(
                        onPressed: state.selectedParts.isEmpty
                            ? null
                            : controller.clearSelection,
                        child: const Text('Tümünü Kaldır'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (!hasParts)
                    Card(
                      color: colorScheme.surfaceContainerHighest,
                      child: const Padding(
                        padding: EdgeInsets.all(16),
                        child: Text(
                          'Her satıra bir parça adı yazın. Satırlar anında aşağıdaki listeye eklenir.',
                        ),
                      ),
                    )
                  else
                    SizedBox(
                      height: 220,
                      child: Scrollbar(
                        child: ListView.builder(
                          itemCount: state.parsedParts.length,
                          itemBuilder: (context, index) {
                            final partName = state.parsedParts[index];
                            final selected = state.selectedParts.contains(
                              partName,
                            );

                            return CheckboxListTile(
                              title: Text(partName),
                              value: selected,
                              onChanged: (value) => controller.toggleSelection(
                                partName,
                                value ?? false,
                              ),
                            );
                          },
                        ),
                      ),
                    ),
                  const SizedBox(height: 16),
                  FilledButton.icon(
                    key: const Key('add-part-save-button'),
                    onPressed: state.canSubmit
                        ? () async {
                            try {
                              final addedCount = await controller.submit(
                                actor: user,
                                vehicleId: vehicleId,
                                service: service,
                                statuses: statuses,
                              );

                              if (!context.mounted || addedCount == 0) {
                                return;
                              }

                              ScaffoldMessenger.of(context)
                                ..hideCurrentSnackBar()
                                ..showSnackBar(
                                  SnackBar(
                                    content: Text('$addedCount parça eklendi.'),
                                    backgroundColor: Colors.green,
                                  ),
                                );
                            } on PartServiceException catch (error) {
                              if (!context.mounted) return;
                              ScaffoldMessenger.of(context)
                                ..hideCurrentSnackBar()
                                ..showSnackBar(
                                  SnackBar(
                                    content: Text(error.message),
                                    backgroundColor: Colors.red,
                                  ),
                                );
                            } catch (error) {
                              if (!context.mounted) return;
                              ScaffoldMessenger.of(context)
                                ..hideCurrentSnackBar()
                                ..showSnackBar(
                                  SnackBar(
                                    content: Text('Beklenmeyen hata: $error'),
                                    backgroundColor: Colors.red,
                                  ),
                                );
                            }
                          }
                        : null,
                    icon: state.isSaving
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.save_alt),
                    label: Text(state.isSaving ? 'Kaydediliyor...' : 'Kaydet'),
                  ),
                  if (state.recentlyAdded.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    Card(
                      color: colorScheme.primaryContainer,
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Son Eklenenler',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                                color: colorScheme.onPrimaryContainer,
                              ),
                            ),
                            const SizedBox(height: 8),
                            for (final part in state.recentlyAdded)
                              Text(
                                '• $part',
                                style: TextStyle(
                                  color: colorScheme.onPrimaryContainer,
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      onPressed: () => Navigator.of(context).maybePop(),
                      child: const Text('Kapat'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
