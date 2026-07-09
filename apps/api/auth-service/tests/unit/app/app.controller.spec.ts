import { PinoAppLogger } from '@fuel-pass/node-commons';
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '../../../src/app/app.controller';

describe('AppController', () => {
    let app: TestingModule;
    const loggerMock = {
        info: jest.fn(),
    };

    beforeEach(async () => {
        loggerMock.info.mockClear();

        app = await Test.createTestingModule({
            controllers: [AppController],
            providers: [
                {
                    provide: PinoAppLogger,
                    useValue: loggerMock,
                },
            ],
        }).compile();
    });

    describe('getHealth', () => {
        it('should return health status', () => {
            const appController = app.get<AppController>(AppController);

            expect(appController.getHealth()).toEqual({ status: 'ok', service: 'auth-service' });
            expect(loggerMock.info).toHaveBeenCalledWith('health');
        });
    });
});
