import {
    createFuelOrderReqDtoSchema,
    fuelOrderIdParamSchema,
    FuelOrderResDto,
    ListFuelOrdersResDto,
    listFuelOrdersQueryDtoSchema,
    updateFuelOrderStatusReqDtoSchema,
    type TCreateFuelOrderRequestDto,
    type TListFuelOrdersQueryDto,
    type TUpdateFuelOrderStatusRequestDto,
} from '@fuel-pass/contracts';
import { ApiResponse, CsHeaders, ZodValidationPipe, type BaseApiHeaders } from '@fuel-pass/node-commons';
import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { OrdersJwtAuthGuard } from '../guards/orders-jwt-auth.guard';
import { OrdersPermissionsGuard } from '../guards/orders-permissions.guard';
import { RequirePermissions } from '../guards/permissions.decorator';
import { CreateFuelOrderService } from '../services/create-fuel-order.service';
import { GetFuelOrderService } from '../services/get-fuel-order.service';
import { ListFuelOrdersService } from '../services/list-fuel-orders.service';
import { UpdateFuelOrderStatusService } from '../services/update-fuel-order-status.service';
import type { AuthenticatedRequest } from '../types/auth-request.types';

@Controller('v1/fuel-orders')
@UseGuards(OrdersJwtAuthGuard, OrdersPermissionsGuard)
export class FuelOrdersController {
    public constructor(
        private readonly createFuelOrderService: CreateFuelOrderService,
        private readonly listFuelOrdersService: ListFuelOrdersService,
        private readonly getFuelOrderService: GetFuelOrderService,
        private readonly updateFuelOrderStatusService: UpdateFuelOrderStatusService
    ) {}

    @Post()
    @RequirePermissions('fuel_order:create')
    public async createFuelOrder(
        @Body(new ZodValidationPipe(createFuelOrderReqDtoSchema)) body: TCreateFuelOrderRequestDto,
        @Req() request: AuthenticatedRequest,
        @CsHeaders() headers: BaseApiHeaders
    ): Promise<ApiResponse<FuelOrderResDto>> {
        return this.createFuelOrderService.createFuelOrder({ headers, body, principal: request.auth });
    }

    @Get()
    @RequirePermissions('fuel_order:read_all')
    public async listFuelOrders(
        @Query(new ZodValidationPipe(listFuelOrdersQueryDtoSchema)) query: TListFuelOrdersQueryDto,
        @CsHeaders() headers: BaseApiHeaders
    ): Promise<ApiResponse<ListFuelOrdersResDto>> {
        return this.listFuelOrdersService.listFuelOrders({ headers, query });
    }

    @Get(':id')
    @RequirePermissions('fuel_order:read_all')
    public async getFuelOrderById(
        @Param('id', new ZodValidationPipe(fuelOrderIdParamSchema)) id: string,
        @CsHeaders() headers: BaseApiHeaders
    ): Promise<ApiResponse<FuelOrderResDto>> {
        return this.getFuelOrderService.getFuelOrder({ headers, id });
    }

    @Patch(':id/status')
    @RequirePermissions('fuel_order:update_status')
    public async updateFuelOrderStatus(
        @Param('id', new ZodValidationPipe(fuelOrderIdParamSchema)) id: string,
        @Body(new ZodValidationPipe(updateFuelOrderStatusReqDtoSchema)) body: TUpdateFuelOrderStatusRequestDto,
        @Req() request: AuthenticatedRequest,
        @CsHeaders() headers: BaseApiHeaders
    ): Promise<ApiResponse<FuelOrderResDto>> {
        return this.updateFuelOrderStatusService.updateFuelOrderStatus({ headers, id, body, principal: request.auth });
    }
}
