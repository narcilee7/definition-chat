import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Chat Integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/sessions should create a session', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/sessions')
      .send({ intent: 'test' })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.intent).toBe('test');
  });

  it('GET /api/sessions should return sessions', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/sessions')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });
});
