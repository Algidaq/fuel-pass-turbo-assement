import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
    public constructor(private readonly appService: AppService) {}

    @Get('health')
    public getHealth(): { status: string; service: string } {
        return {
            status: 'ok',
            service: 'auth-service',
        };
    }

    @Get()
    public getData(): Promise<{ message: string }> {
        return new Promise((reslove, _reject): void => {
            setTimeout((): void => {
                reslove(this.appService.getData());
            }, 1);
        });
    }
}
