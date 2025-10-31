import 'dart:io';
import 'dart:typed_data';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

import 'package:kaportapp/core/models/part_model.dart';
import 'package:kaportapp/core/models/vehicle_model.dart';

class PdfService {
  static pw.Font? _fontRegular;
  static pw.Font? _fontBold;
  static pw.Font? _fontItalic;
  static pw.Font? _fontBoldItalic;

  Future<PdfReportResult> generatePartsReport({
    required VehicleModel vehicle,
    required List<PartModel> parts,
  }) async {
    await _ensureFonts();

    final brand = _normalize(vehicle.brand);
    final model = _normalize(vehicle.model);
    final plate = _normalize(vehicle.plate);
    final year = vehicle.year.toString();
    final customer = _normalize(vehicle.customerName);
    final normalizedParts = parts
        .map(
          (part) => _NormalizedPart(
            name: _normalize(part.name),
            status: _normalize(part.status),
            quantity: part.quantity,
          ),
        )
        .toList(growable: false);

    final pdf = pw.Document(
      theme: pw.ThemeData.withFont(
        base: _fontRegular!,
        bold: _fontBold!,
        italic: _fontItalic ?? _fontRegular!,
        boldItalic: _fontBoldItalic ?? _fontBold!,
      ),
    );
    final now = DateTime.now();
    final formattedDate = _formatDate(now);

    pdf.addPage(
      pw.MultiPage(
        margin: const pw.EdgeInsets.symmetric(horizontal: 32, vertical: 36),
        footer: (context) => _buildFooter(context, formattedDate),
        build: (context) => [
          _buildHeader(
            brand: brand,
            model: model,
            plate: plate,
            year: year,
            customer: customer,
            formattedDate: formattedDate,
          ),
          pw.SizedBox(height: 24),
          _buildPartsTable(normalizedParts),
        ],
      ),
    );

    final directory = await getApplicationDocumentsDirectory();
    final sanitizedPlate = _sanitize(vehicle.plate);
    final fileName = '${sanitizedPlate}_parca_listesi.pdf';
    final file = File('${directory.path}/$fileName');

    final bytes = await pdf.save();
    await file.writeAsBytes(bytes, flush: true);
    return PdfReportResult(file: file, bytes: bytes, fileName: fileName);
  }

  static Future<void> _ensureFonts() async {
    _fontRegular ??= await PdfGoogleFonts.robotoRegular();
    _fontBold ??= await PdfGoogleFonts.robotoBold();
    _fontItalic ??= await PdfGoogleFonts.robotoItalic();
    _fontBoldItalic ??= await PdfGoogleFonts.robotoBoldItalic();
  }

  String _sanitize(String input) {
    final normalized = input.trim().replaceAll(RegExp(r'[^A-Za-z0-9]'), '_');
    if (normalized.isEmpty) {
      return 'arac';
    }
    return normalized;
  }

  String _normalize(String? input) {
    if (input == null || input.isEmpty) {
      return '';
    }
    final buffer = StringBuffer();
    for (final codePoint in input.runes) {
      if (_isValidUnicodeScalar(codePoint)) {
        buffer.writeCharCode(codePoint);
      }
    }
    return buffer.toString();
  }

  bool _isValidUnicodeScalar(int codePoint) {
    if (codePoint >= 0 && codePoint <= 0xD7FF) return true;
    if (codePoint >= 0xE000 && codePoint <= 0x10FFFF) return true;
    return false;
  }

  pw.Widget _buildHeader({
    required String brand,
    required String model,
    required String plate,
    required String year,
    required String customer,
    required String formattedDate,
  }) {
    final safeCustomer = customer.isNotEmpty ? customer : 'Belirtilmemiş';
    final safeYear = year.isNotEmpty ? year : '-';
    final titleLine = [
      brand,
      model,
    ].where((value) => value.isNotEmpty).join(' ');

    return pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Text(
          'Araç Parça Raporu',
          style: pw.TextStyle(
            font: _fontBold,
            fontSize: 22,
            color: PdfColors.blueGrey900,
          ),
        ),
        pw.SizedBox(height: 8),
        pw.Text(
          titleLine.isNotEmpty ? '$titleLine • $plate' : plate,
          style: pw.TextStyle(font: _fontRegular, fontSize: 14),
        ),
        pw.Text(
          'Plaka: $plate',
          style: pw.TextStyle(font: _fontRegular, fontSize: 12),
        ),
        pw.Text(
          'Yıl: $safeYear',
          style: pw.TextStyle(font: _fontRegular, fontSize: 12),
        ),
        pw.Text(
          'Müşteri: $safeCustomer',
          style: pw.TextStyle(font: _fontRegular, fontSize: 12),
        ),
        pw.SizedBox(height: 4),
        pw.Text(
          'Rapor Tarihi: $formattedDate',
          style: pw.TextStyle(font: _fontRegular, fontSize: 12),
        ),
        pw.Divider(color: PdfColors.blueGrey200, thickness: 1),
      ],
    );
  }

  pw.Widget _buildPartsTable(List<_NormalizedPart> parts) {
    if (parts.isEmpty) {
      return pw.Container(
        padding: const pw.EdgeInsets.symmetric(vertical: 32),
        alignment: pw.Alignment.center,
        child: pw.Text(
          'Bu araca ait kayıtlı parça bulunmuyor.',
          style: pw.TextStyle(
            font: _fontRegular,
            fontSize: 14,
            color: PdfColors.blueGrey600,
          ),
        ),
      );
    }

    return pw.Table(
      columnWidths: const {
        0: pw.FlexColumnWidth(2),
        1: pw.FlexColumnWidth(1.4),
        2: pw.FlexColumnWidth(0.8),
      },
      border: pw.TableBorder(
        horizontalInside: pw.BorderSide(
          color: PdfColors.blueGrey100,
          width: 0.3,
        ),
        verticalInside: pw.BorderSide(color: PdfColors.blueGrey100, width: 0.3),
        top: pw.BorderSide(color: PdfColors.blueGrey200, width: 0.5),
        bottom: pw.BorderSide(color: PdfColors.blueGrey200, width: 0.5),
        left: pw.BorderSide(color: PdfColors.blueGrey200, width: 0.5),
        right: pw.BorderSide(color: PdfColors.blueGrey200, width: 0.5),
      ),
      children: [
        pw.TableRow(
          decoration: const pw.BoxDecoration(color: PdfColors.blueGrey800),
          children: [
            _buildTableHeaderCell('Parça Adı'),
            _buildTableHeaderCell('Durum'),
            _buildTableHeaderCell('Adet', alignCenter: true),
          ],
        ),
        for (var i = 0; i < parts.length; i++)
          pw.TableRow(
            decoration: pw.BoxDecoration(
              color: i.isEven ? PdfColors.white : PdfColors.blueGrey50,
            ),
            children: [
              _buildTableCell(parts[i].name),
              _buildTableCell(
                parts[i].status.isNotEmpty ? parts[i].status : 'Belirtilmemiş',
              ),
              _buildTableCell(parts[i].quantity.toString(), alignCenter: true),
            ],
          ),
      ],
    );
  }

  pw.Widget _buildTableHeaderCell(String text, {bool alignCenter = false}) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 10, horizontal: 8),
      child: pw.Align(
        alignment: alignCenter ? pw.Alignment.center : pw.Alignment.centerLeft,
        child: pw.Text(
          text,
          style: pw.TextStyle(
            font: _fontBold,
            fontSize: 12,
            color: PdfColors.white,
          ),
        ),
      ),
    );
  }

  pw.Widget _buildTableCell(String text, {bool alignCenter = false}) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 10, horizontal: 8),
      child: pw.Align(
        alignment: alignCenter ? pw.Alignment.center : pw.Alignment.centerLeft,
        child: pw.Text(
          text,
          style: pw.TextStyle(
            font: _fontRegular,
            fontSize: 11,
            color: PdfColors.blueGrey900,
          ),
        ),
      ),
    );
  }

  pw.Widget _buildFooter(pw.Context context, String formattedDate) {
    return pw.Container(
      padding: const pw.EdgeInsets.only(top: 12),
      decoration: const pw.BoxDecoration(
        border: pw.Border(top: pw.BorderSide(color: PdfColors.blueGrey200)),
      ),
      child: pw.Row(
        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
        children: [
          pw.Text(
            'KaportApp',
            style: pw.TextStyle(
              font: _fontRegular,
              fontSize: 10,
              color: PdfColors.blueGrey700,
            ),
          ),
          pw.Text(
            formattedDate,
            style: pw.TextStyle(
              font: _fontRegular,
              fontSize: 10,
              color: PdfColors.blueGrey700,
            ),
          ),
          pw.Text(
            'Sayfa ${context.pageNumber} / ${context.pagesCount}',
            style: pw.TextStyle(
              font: _fontRegular,
              fontSize: 10,
              color: PdfColors.blueGrey700,
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    final day = date.day.toString().padLeft(2, '0');
    final month = date.month.toString().padLeft(2, '0');
    final year = date.year.toString();
    return '$day.$month.$year';
  }
}

class PdfReportResult {
  PdfReportResult({
    required this.file,
    required this.bytes,
    required this.fileName,
  });

  final File file;
  final Uint8List bytes;
  final String fileName;
}

class _NormalizedPart {
  _NormalizedPart({
    required this.name,
    required this.status,
    required this.quantity,
  });

  final String name;
  final String status;
  final int quantity;
}

final pdfServiceProvider = Provider<PdfService>((ref) {
  return PdfService();
});
