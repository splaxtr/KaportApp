import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

class PartStatusPaletteEntry {
  const PartStatusPaletteEntry({required this.hex, required this.label});

  final String hex;
  final String label;
}

class PartStatusModel {
  const PartStatusModel({
    required this.id,
    required this.name,
    required this.colorHex,
  });

  final String id;
  final String name;
  final String colorHex;

  static const String defaultName = 'Beklemede';
  static const String defaultColorHex = '#FF9800';

  static const List<PartStatusPaletteEntry> palette = [
    PartStatusPaletteEntry(hex: '#FF9800', label: 'Turuncu'),
    PartStatusPaletteEntry(hex: '#4CAF50', label: 'Yeşil'),
    PartStatusPaletteEntry(hex: '#2196F3', label: 'Mavi'),
    PartStatusPaletteEntry(hex: '#E91E63', label: 'Pembe'),
    PartStatusPaletteEntry(hex: '#9C27B0', label: 'Mor'),
    PartStatusPaletteEntry(hex: '#FF5722', label: 'Koyu Turuncu'),
    PartStatusPaletteEntry(hex: '#607D8B', label: 'Mavi Gri'),
    PartStatusPaletteEntry(hex: '#00BCD4', label: 'Camgöbeği'),
  ];

  static final Set<String> _paletteHexes = palette
      .map((entry) => entry.hex)
      .toSet();

  static const List<PartStatusModel> defaultSeed = [
    PartStatusModel(id: '', name: defaultName, colorHex: defaultColorHex),
    PartStatusModel(id: '', name: 'Parça Geldi', colorHex: '#4CAF50'),
    PartStatusModel(id: '', name: 'Sipariş Geçildi', colorHex: '#2196F3'),
  ];

  Color get color {
    final hex = colorHex.replaceAll('#', '');
    if (hex.length == 6) {
      return Color(int.parse('FF$hex', radix: 16));
    }
    if (hex.length == 8) {
      return Color(int.parse(hex, radix: 16));
    }
    return const Color(0xFF9E9E9E);
  }

  Map<String, dynamic> toMap() => {'name': name, 'colorHex': colorHex};

  static PartStatusModel fromDoc(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data() ?? <String, dynamic>{};
    final name = (data['name'] as String?)?.trim();
    final normalizedColor = _normalizeHex(data['colorHex'] as String?);
    return PartStatusModel(
      id: doc.id,
      name: name == null || name.isEmpty ? defaultName : name,
      colorHex: normalizedColor.isNotEmpty ? normalizedColor : defaultColorHex,
    );
  }

  PartStatusModel copyWith({String? id, String? name, String? colorHex}) {
    return PartStatusModel(
      id: id ?? this.id,
      name: name ?? this.name,
      colorHex: colorHex ?? this.colorHex,
    );
  }

  static String labelForColor(String colorHex) {
    final entry = paletteEntryFor(colorHex);
    final normalized = _normalizeHex(colorHex);
    return entry?.label ?? (normalized.isNotEmpty ? normalized : colorHex);
  }

  static PartStatusPaletteEntry? paletteEntryFor(String colorHex) {
    final normalized = _normalizeHex(colorHex);
    try {
      return palette.firstWhere((entry) => entry.hex == normalized);
    } catch (_) {
      return null;
    }
  }

  static bool isValidColor(String? colorHex) {
    final normalized = _normalizeHex(colorHex);
    return _paletteHexes.contains(normalized);
  }

  static String ensurePaletteColor(String? colorHex) {
    final normalized = _normalizeHex(colorHex);
    if (_paletteHexes.contains(normalized)) {
      return normalized;
    }
    return defaultColorHex;
  }

  static String _normalizeHex(String? value) {
    if (value == null) return '';
    final hex = value.trim().replaceAll('#', '').toUpperCase();
    if (hex.length != 6) {
      return '';
    }
    final isValid = int.tryParse(hex, radix: 16) != null;
    if (!isValid) {
      return '';
    }
    return '#$hex';
  }
}
