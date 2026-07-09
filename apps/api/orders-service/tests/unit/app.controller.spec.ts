import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '../../src/app/app.controller';
import { AppService } from '../../src/app/app.service';

describe('AppController', () => {
    let app: TestingModule;

    beforeAll(async () => {
        app = await Test.createTestingModule({
            controllers: [AppController],
            providers: [AppService],
        }).compile();
    });

    describe('getData', () => {
        it('should return "Hello API"', () => {
            const appController = app.get<AppController>(AppController);
            expect(appController.getData()).toEqual({ message: 'Hello API' });
        });
    });

    describe('getHealth', () => {
        it('should return health status', () => {
            const appController = app.get<AppController>(AppController);
            expect(appController.getHealth()).toEqual({ status: 'ok', service: 'orders-service' });
        });
    });
});
