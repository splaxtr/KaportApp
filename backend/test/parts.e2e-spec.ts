import * as request from 'supertest';
import { createApp, cleanDatabase } from './helpers';

describe('Parts E2E', () => {
  let app;
  let httpServer;
  let prisma;
  let adminToken: string;
  let adminId: string;
  let shopId: string;
  let vehicleId: string;

  beforeAll(async () => {
    const setup = await createApp();
    app = setup.app;
    prisma = setup.prisma;
    httpServer = app.getHttpServer();
    await cleanDatabase(prisma);

    const reg = await request(httpServer)
      .post('/auth/register')
      .send({ email: 'part@test.com', password: 'Secret123', name: 'Part' });
    adminToken = reg.body.accessToken;
    adminId = reg.body.user.id;
    await prisma.user.update({ where: { id: adminId }, data: { role: 'admin' } });
    const login = await request(httpServer)
      .post('/auth/login')
      .send({ email: 'part@test.com', password: 'Secret123' });
    adminToken = login.body.accessToken;

    const shop = await request(httpServer)
      .post('/shops')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Part Shop', ownerId: adminId });
    shopId = shop.body.id;

    const vehicle = await request(httpServer)
      .post('/vehicles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ shopId, plate: 'PART123', brand: 'Brand', model: 'Model' });
    vehicleId = vehicle.body.id;

    await request(httpServer)
      .post('/part-statuses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ key: 'pending', label: 'Pending', color: '#999', order: 1 })
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates, updates, deletes part', async () => {
    const create = await request(httpServer)
      .post('/parts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        shopId,
        vehicleId,
        name: 'Kaput',
        statusKey: 'pending',
      })
      .expect(201);

    const partId = create.body.id;

    await request(httpServer)
      .patch(`/parts/${partId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ quantity: 2 })
      .expect(200);

    await request(httpServer)
      .delete(`/parts/${partId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });
});
