import {
    createFuelOrderReqDtoSchema,
    FuelOrderResDto,
    listFuelOrdersQueryDtoSchema,
    ListFuelOrdersResDto,
    ORDER_PERMISSIONS,
    updateFuelOrderStatusReqDtoSchema,
    type TCreateFuelOrderRequestDto,
    type TListFuelOrdersQueryDto,
    type TUpdateFuelOrderStatusRequestDto,
} from '@fuel-pass/contracts/backend';
import {
    ApiResponse,
    CsHeaders,
    JwtIntrospectionAuthGuard,
    PermissionsGuard,
    RequirePermissions,
    UuidValidatorPipe,
    ZodValidationPipe,
    type AuthenticatedRequest,
    type BaseApiHeaders,
} from '@fuel-pass/node-commons';
import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { CreateFuelOrderService } from '../services/create-fuel-order.service';
import { GetFuelOrderService } from '../services/get-fuel-order.service';
import { ListFuelOrdersService } from '../services/list-fuel-orders.service';
import { UpdateFuelOrderStatusService } from '../services/update-fuel-order-status.service';

@Controller('v1/fuel-orders')
@UseGuards(JwtIntrospectionAuthGuard, PermissionsGuard)
export class FuelOrdersController {
    public constructor(
        private readonly createFuelOrderService: CreateFuelOrderService,
        private readonly listFuelOrdersService: ListFuelOrdersService,
        private readonly getFuelOrderService: GetFuelOrderService,
        private readonly updateFuelOrderStatusService: UpdateFuelOrderStatusService
    ) {}

    @Post()
    @RequirePermissions(ORDER_PERMISSIONS.fuelOrderCreate.key)
    public async createFuelOrder(
        @Body(new ZodValidationPipe(createFuelOrderReqDtoSchema)) body: TCreateFuelOrderRequestDto,
        @Req() request: AuthenticatedRequest,
        @CsHeaders() headers: BaseApiHeaders
    ): Promise<ApiResponse<FuelOrderResDto>> {
        return this.createFuelOrderService.createFuelOrder({ headers, body, principal: request.auth });
    }

    @Get()
    @RequirePermissions(ORDER_PERMISSIONS.fuelOrderReadAll.key)
    public async listFuelOrders(
        @Query(new ZodValidationPipe(listFuelOrdersQueryDtoSchema)) query: TListFuelOrdersQueryDto,
        @CsHeaders() headers: BaseApiHeaders
    ): Promise<ApiResponse<ListFuelOrdersResDto>> {
        return this.listFuelOrdersService.listFuelOrders({ headers, query });
    }

    @Get(':id')
    @RequirePermissions(ORDER_PERMISSIONS.fuelOrderReadAll.key)
    public async getFuelOrderById(
        @Param('id', UuidValidatorPipe) id: string,
        @CsHeaders() headers: BaseApiHeaders
    ): Promise<ApiResponse<FuelOrderResDto>> {
        return this.getFuelOrderService.getFuelOrder({ headers, id });
    }

    @Patch(':id/status')
    @RequirePermissions(ORDER_PERMISSIONS.fuelOrderUpdateStatus.key)
    public async updateFuelOrderStatus(
        @Param('id', UuidValidatorPipe) id: string,
        @Body(new ZodValidationPipe(updateFuelOrderStatusReqDtoSchema)) body: TUpdateFuelOrderStatusRequestDto,
        @Req() request: AuthenticatedRequest,
        @CsHeaders() headers: BaseApiHeaders
    ): Promise<ApiResponse<FuelOrderResDto>> {
        return this.updateFuelOrderStatusService.updateFuelOrderStatus({ headers, id, body, principal: request.auth });
    }
}
