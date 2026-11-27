import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  const healthCheckService = { check: jest.fn() };
  const db = { pingCheck: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: healthCheckService },
        { provide: TypeOrmHealthIndicator, useValue: db },
      ],
    }).compile();

    controller = moduleRef.get(HealthController);
  });

  it('vérifie la connexion à la base de données', async () => {
    const result = { status: 'ok', details: { database: { status: 'up' } } };
    healthCheckService.check.mockImplementation(
      async (indicators: Array<() => unknown>) => {
        await Promise.all(indicators.map((indicator) => indicator()));
        return result;
      },
    );

    await expect(controller.check()).resolves.toEqual(result);
    expect(db.pingCheck).toHaveBeenCalledWith('database');
  });
});
