import * as fs from 'fs';
import * as request from 'supertest';
import { createApp, cleanDatabase, ensureDummyFile } from './helpers';

describe('PDF E2E', () => {
  let app;
  let httpServer;
  let prisma;
  let adminToken: string;
  let adminId: string;
  let shopId: string;
  let vehicleId: string;
  let dummyFile: string;

  beforeAll(async () => {
    const setup = await createApp();
    app = setup.app;
    prisma = setup.prisma;
    httpServer = app.getHttpServer();
    await cleanDatabase(prisma);
    dummyFile = ensureDummyFile();

    const reg = await request(httpServer)
      .post('/auth/register')
      .send({ email: 'pdf2@test.com', password: 'Secret123', name: 'PDF2' });
    adminId = reg.body.user.id;
    await prisma.user.update({ where: { id: adminId }, data: { role: 'admin' } });
    const login = await request(httpServer)
      .post('/auth/login')
      .send({ email: 'pdf2@test.com', password: 'Secret123' });
    adminToken = login.body.accessToken;

    const shop = await request(httpServer)
      .post('/shops')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'PDF Shop', ownerId: adminId });
    shopId = shop.body.id;

    const vehicle = await request(httpServer)
      .post('/vehicles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ shopId, plate: 'PDFE2E', brand: 'Brand', model: 'Model' });
    vehicleId = vehicle.body.id;

    await request(httpServer)
      .post('/part-statuses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ key: 'pending', label: 'Pending', color: '#999', order: 1 });

    await request(httpServer)
      .post('/parts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        shopId,
        vehicleId,
        name: 'Kaput',
        statusKey: 'pending',
      });

    await request(httpServer)
      .post('/photos/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', dummyFile)
      .field('shopId', shopId)
      .field('vehicleId', vehicleId);
  });

  afterAll(async () => {
    await app.close();
  });

  it('generates PDF and logs activity', async () => {
    const res = await request(httpServer)
      .get(`/pdf/vehicle/${vehicleId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .buffer()
      .parse((res, cb) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => cb(null, Buffer.concat(chunks)));
      })
      .expect(200);

    const pdfBuffer: Buffer = res.body;
    expect(pdfBuffer.length).toBeGreaterThan(2000);

    const activities = await prisma.activity.findMany({
      where: { scope: 'vehicle', refId: vehicleId },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });
    expect(activities[0]?.payload?.message).toContain('PDF generated for vehicle');

    fs.writeFileSync('/tmp/test-pdf.pdf', pdfBuffer);
  });
});
