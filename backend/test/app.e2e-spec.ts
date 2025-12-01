import * as request from 'supertest';
import { createApp, cleanDatabase } from './helpers';

describe('Auth E2E', () => {
  let app;
  let httpServer;
  let prisma;

  beforeAll(async () => {
    const setup = await createApp();
    app = setup.app;
    prisma = setup.prisma;
    httpServer = app.getHttpServer();
    await cleanDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers a user', async () => {
    const res = await request(httpServer)
      .post('/auth/register')
      .send({ email: 'auth@test.com', password: 'Secret123', name: 'Auth' })
      .expect(201);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it('logins and refreshes token', async () => {
    await prisma.user.update({
      where: { email: 'auth@test.com' },
      data: { role: 'admin' },
    });

    const login = await request(httpServer)
      .post('/auth/login')
      .send({ email: 'auth@test.com', password: 'Secret123' })
      .expect(201);

    const refresh = await request(httpServer)
      .post('/auth/refresh')
      .send({ refreshToken: login.body.refreshToken })
      .expect(201);

    expect(refresh.body.accessToken).toBeDefined();
    expect(refresh.body.refreshToken).toBeDefined();
  });
});
