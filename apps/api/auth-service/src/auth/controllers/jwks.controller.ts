import type { JwksResponseDto } from '@fuel-pass/contracts';
import { ApiResponse } from '@fuel-pass/node-commons';
import { Controller, Get, HttpStatus } from '@nestjs/common';
import { TokenService } from '../services/token.service';

@Controller('.well-known')
export class JwksController {
    public constructor(private readonly tokenService: TokenService) {}

    @Get('jwks.json')
    public async getJwks(): Promise<ApiResponse<JwksResponseDto>> {
        const data = await this.tokenService.getJwks();

        return ApiResponse.builder<JwksResponseDto>().withSuccess({ status: HttpStatus.OK, data }).build();
    }
}
