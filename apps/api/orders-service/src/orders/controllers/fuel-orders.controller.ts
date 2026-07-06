import type {
    CreateFuelOrderRequestDto,
    FuelOrderResponseDto,
    ListFuelOrdersQueryDto,
    ListFuelOrdersResponseDto,
    UpdateFuelOrderStatusRequestDto,
} from '@fuel-pass/contracts';
import { ApiResponse } from '@fuel-pass/node-commons';
import { Body, Controller, Get, HttpStatus, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { OrdersJwtAuthGuard } from '../guards/orders-jwt-auth.guard';
import { OrdersPermissionsGuard } from '../guards/orders-permissions.guard';
import { RequirePermissions } from '../guards/permissions.decorator';
import { ORDER_ERRORS, OrderFailure } from '../orders.errors';
import { FuelOrdersService } from '../services/fuel-orders.service';
import type { AuthenticatedRequest } from '../types/auth-request.types';

@Controller('v1/fuel-orders')
@UseGuards(OrdersJwtAuthGuard, OrdersPermissionsGuard)
export class FuelOrdersController {
    public constructor(private readonly fuelOrdersService: FuelOrdersService) {}

    @Post()
    @RequirePermissions('fuel_order:create')
    public async createFuelOrder(
        @Body() body: Partial<CreateFuelOrderRequestDto>,
        @Req() request: AuthenticatedRequest
    ): Promise<ApiResponse<FuelOrderResponseDto>> {
        try {
            const data = await this.fuelOrdersService.createFuelOrder(body, request.auth.userId);

            return ApiResponse.builder<FuelOrderResponseDto>().withSuccess({ status: HttpStatus.CREATED, data }).build();
        } catch (error: unknown) {
            return this.orderFailure<FuelOrderResponseDto>(error);
        }
    }

    @Get()
    @RequirePermissions('fuel_order:read_all')
    public async listFuelOrders(@Query() query: ListFuelOrdersQueryDto): Promise<ApiResponse<ListFuelOrdersResponseDto>> {
        try {
            const data = await this.fuelOrdersService.listFuelOrders(query);

            return ApiResponse.builder<ListFuelOrdersResponseDto>().withSuccess({ status: HttpStatus.OK, data }).build();
        } catch (error: unknown) {
            return this.orderFailure<ListFuelOrdersResponseDto>(error);
        }
    }

    @Get(':id')
    @RequirePermissions('fuel_order:read_all')
    public async getFuelOrderById(@Param('id') id: string): Promise<ApiResponse<FuelOrderResponseDto>> {
        try {
            const data = await this.fuelOrdersService.getFuelOrderById(id);

            return ApiResponse.builder<FuelOrderResponseDto>().withSuccess({ status: HttpStatus.OK, data }).build();
        } catch (error: unknown) {
            return this.orderFailure<FuelOrderResponseDto>(error);
        }
    }

    @Patch(':id/status')
    @RequirePermissions('fuel_order:update_status')
    public async updateFuelOrderStatus(
        @Param('id') id: string,
        @Body() body: Partial<UpdateFuelOrderStatusRequestDto>,
        @Req() request: AuthenticatedRequest
    ): Promise<ApiResponse<FuelOrderResponseDto>> {
        try {
            const data = await this.fuelOrdersService.updateFuelOrderStatus({
                id,
                body,
                userId: request.auth.userId,
            });

            return ApiResponse.builder<FuelOrderResponseDto>().withSuccess({ status: HttpStatus.OK, data }).build();
        } catch (error: unknown) {
            return this.orderFailure<FuelOrderResponseDto>(error);
        }
    }

    private orderFailure<T>(error: unknown): ApiResponse<T> {
        if (error instanceof OrderFailure) {
            return ApiResponse.builder<T>()
                .withFailure({ status: this.statusForFailure(error), errors: ORDER_ERRORS[error.key] })
                .build();
        }

        throw error;
    }

    private statusForFailure(error: OrderFailure): HttpStatus {
        switch (error.key) {
            case 'FuelOrderNotFound':
                return HttpStatus.NOT_FOUND;
            case 'InvalidStatusTransition':
                return HttpStatus.CONFLICT;
            case 'Forbidden':
                return HttpStatus.FORBIDDEN;
            case 'InvalidRequest':
                return HttpStatus.BAD_REQUEST;
            default:
                return HttpStatus.BAD_REQUEST;
        }
    }
}
