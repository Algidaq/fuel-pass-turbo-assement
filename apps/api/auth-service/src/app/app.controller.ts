import { PinoAppLogger } from '@fuel-pass/node-commons';
import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
    public constructor(private readonly log: PinoAppLogger) {}

    @Get('health')
    public getHealth(): { status: string; service: string } {
        this.log.info('health');
        return {
            status: 'ok',
            service: 'auth-service',
        };
    }
}
