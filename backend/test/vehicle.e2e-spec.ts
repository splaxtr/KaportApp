import * as request from 'supertest';
import { createApp, cleanDatabase } from './helpers';

describe('Vehicles E2E', () => {
  let app;
  let httpServer;
  let prisma;
  let adminToken: string;
  let adminId: string;
  let shopId: string;

  beforeAll(async () => {
    const setup = await createApp();
    app = setup.app;
    prisma = setup.prisma;
    httpServer = app.getHttpServer();
    await cleanDatabase(prisma);

    const reg = await request(httpServer)
      .post('/auth/register')
      .send({ email: 'veh@test.com', password: 'Secret123', name: 'Veh' });
    adminToken = reg.body.accessToken;
    adminId = reg.body.user.id;
    await prisma.user.update({ where: { id: adminId }, data: { role: 'admin' } });
    const login = await request(httpServer)
      .post('/auth/login')
      .send({ email: 'veh@test.com', password: 'Secret123' });
    adminToken = login.body.accessToken;

    const shop = await request(httpServer)
      .post('/shops')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Veh Shop', ownerId: adminId });
    shopId = shop.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates, lists, gets, deletes vehicle', async () => {
    const create = await request(httpServer)
      .post('/vehicles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ shopId, plate: 'TEST123', brand: 'Brand', model: 'Model' })
      .expect(201);

    const vehicleId = create.body.id;

    const list = await request(httpServer)
      .get(`/vehicles?shopId=${shopId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(list.body).toHaveLength(1);

    await request(httpServer)
      .get(`/vehicles/${vehicleId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    await request(httpServer)
      .delete(`/vehicles/${vehicleId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });
});
