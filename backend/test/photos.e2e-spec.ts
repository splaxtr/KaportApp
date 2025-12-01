import * as request from 'supertest';
import { createApp, cleanDatabase, ensureDummyFile } from './helpers';

describe('Photos E2E', () => {
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
      .send({ email: 'photo@test.com', password: 'Secret123', name: 'Photo' });
    adminToken = reg.body.accessToken;
    adminId = reg.body.user.id;
    await prisma.user.update({ where: { id: adminId }, data: { role: 'admin' } });
    const login = await request(httpServer)
      .post('/auth/login')
      .send({ email: 'photo@test.com', password: 'Secret123' });
    adminToken = login.body.accessToken;

    const shop = await request(httpServer)
      .post('/shops')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Photo Shop', ownerId: adminId });
    shopId = shop.body.id;

    const vehicle = await request(httpServer)
      .post('/vehicles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ shopId, plate: 'PHOTO123', brand: 'Brand', model: 'Model' });
    vehicleId = vehicle.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('uploads and deletes a photo', async () => {
    const upload = await request(httpServer)
      .post('/photos/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', dummyFile, { contentType: 'image/jpeg', filename: 'dummy.jpg' })
      .field('shopId', shopId)
      .field('vehicleId', vehicleId)
      .expect(201);

    expect(upload.body.url).toBeDefined();
    const photoId = upload.body.id;

    await request(httpServer)
      .delete(`/photos/${photoId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });
});
