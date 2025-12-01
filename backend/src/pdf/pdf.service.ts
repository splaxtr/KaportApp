import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivitiesService } from '../activities/activities.service';
import { PrismaService } from '../prisma/prisma.service';
import puppeteer from 'puppeteer';

@Injectable()
export class PdfService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  async generateVehicleReport(vehicleId: string, userId: string): Promise<Buffer> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        shop: true,
        parts: {
          include: { status: true },
          orderBy: { createdAt: 'asc' },
        },
        photos: true,
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    const baseUrl = (process.env.PDF_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
    const html = this.buildHtml(vehicle, baseUrl);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
    });

    await browser.close();

    await this.activitiesService.log(
      userId,
      vehicle.shopId,
      `PDF generated for vehicle: ${vehicle.plate}`,
      vehicle.id,
      'vehicle',
    );

    return Buffer.from(pdfBuffer);
  }

  buildHtml(vehicle: any, baseUrl: string): string {
    const partsRows = vehicle.parts
      .map(
        (p: any) => `
        <tr>
          <td>${p.name}</td>
          <td>${p.position ?? '-'}</td>
          <td>${p.quantity}</td>
          <td>${p.status?.label ?? p.statusKey}</td>
          <td>${p.status?.color ?? '-'}</td>
        </tr>`,
      )
      .join('');

    const normalizePhotoUrl = (url: string) => {
      if (!url) return '';
      if (url.startsWith('http')) return url;
      const cleaned = url.startsWith('/') ? url : `/uploads/${url}`;
      return `${baseUrl}${cleaned}`;
    };

    const photosGrid = vehicle.photos
      .map(
        (photo: any) => `
        <div class="photo">
          <img src="${normalizePhotoUrl(photo.url)}" alt="photo" />
        </div>`,
      )
      .join('');

    return `
    <!doctype html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        body { font-family: Arial, sans-serif; color: #1f2933; margin: 0; padding: 0; background: #f7f9fc; }
        .page { padding: 24px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .title { font-size: 20px; font-weight: 700; color: #0f172a; }
        .tag { background: #e3f2fd; color: #0f172a; padding: 6px 10px; border-radius: 8px; font-size: 12px; }
        .section { background: #fff; border-radius: 12px; padding: 16px; margin-bottom: 16px; box-shadow: 0 6px 12px rgba(15,23,42,0.06); }
        .section h2 { margin: 0 0 12px 0; font-size: 16px; color: #0f172a; }
        .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
        .field { background: #f8fafc; padding: 10px; border-radius: 8px; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th, td { padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: left; }
        th { background: #f1f5f9; }
        .photos { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
        .photo { background: #f8fafc; border-radius: 8px; padding: 6px; text-align: center; }
        .photo img { width: 100%; height: 120px; object-fit: cover; border-radius: 6px; }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <div class="title">Kaporta Raporu</div>
          <div class="tag">${new Date().toLocaleDateString()}</div>
        </div>

        <div class="section">
          <h2>Araç Bilgileri</h2>
          <div class="grid">
            <div class="field"><strong>Plaka:</strong> ${vehicle.plate}</div>
            <div class="field"><strong>Marka/Model:</strong> ${vehicle.brand} / ${vehicle.model}</div>
            <div class="field"><strong>Müşteri:</strong> ${vehicle.customerName ?? '-'}</div>
            <div class="field"><strong>TCKN/VKN:</strong> ${vehicle.tcknVkn ?? '-'}</div>
            <div class="field"><strong>Telefon:</strong> ${vehicle.phone ?? '-'}</div>
            <div class="field"><strong>Hasar Tarihi:</strong> ${vehicle.damageDate ? new Date(vehicle.damageDate).toLocaleDateString() : '-'}</div>
            <div class="field"><strong>Dosya No:</strong> ${vehicle.fileNo ?? '-'}</div>
            <div class="field"><strong>Eksper:</strong> ${vehicle.expertName ?? '-'}</div>
          </div>
        </div>

        <div class="section">
          <h2>İşletme Bilgileri</h2>
          <div class="grid">
            <div class="field"><strong>Adı:</strong> ${vehicle.shop?.name ?? '-'}</div>
            <div class="field"><strong>Shop ID:</strong> ${vehicle.shop?.id ?? '-'}</div>
          </div>
        </div>

        <div class="section">
          <h2>Parçalar</h2>
          <table>
            <thead>
              <tr>
                <th>Parça</th>
                <th>Konum</th>
                <th>Adet</th>
                <th>Durum</th>
                <th>Renk</th>
              </tr>
            </thead>
            <tbody>
              ${partsRows || '<tr><td colspan="5">Parça bulunamadı</td></tr>'}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Fotoğraflar</h2>
          <div class="photos">
            ${photosGrid || '<div class="field">Fotoğraf yok</div>'}
          </div>
        </div>
      </div>
    </body>
    </html>
    `;
  }
}
