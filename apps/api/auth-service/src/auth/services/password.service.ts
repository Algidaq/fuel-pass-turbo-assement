import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { getAuthRuntimeConfig } from '../../configs/auth.config';

@Injectable()
export class PasswordService {
    public constructor(private readonly configService: ConfigService) {}

    private get bcryptRounds(): number {
        return this.configService.get<number>('auth.bcryptRounds') ?? getAuthRuntimeConfig().bcryptRounds;
    }

    public hashPassword(rawPassword: string): Promise<string> {
        return bcrypt.hash(rawPassword, this.bcryptRounds);
    }

    public verifyPassword(rawPassword: string, passwordHash: string): Promise<boolean> {
        return bcrypt.compare(rawPassword, passwordHash);
    }
}
