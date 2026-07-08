import type { ListFuelOrdersResponseDto } from '@fuel-pass/contracts/backend';

import { env } from '../../../config/env';
import { httpClient } from '../../../services/httpClient';
import type {
    CreateFuelOrderRequest,
    FuelOrder,
    FuelOrderFilters,
    FuelOrdersList,
    FuelOrderStatus,
    UpdateFuelOrderStatusRequest,
} from '../types/fuelOrder.types';

const fuelOrdersUrl = `${env.ordersApiBaseUrl.replace(/\/+$/, '')}/v1/fuel-orders`;

type ApiResponse<TData> = {
    data?: TData;
};

const hasDataEnvelope = <TData>(response: TData | ApiResponse<TData>): response is ApiResponse<TData> =>
    typeof response === 'object' && response !== null && 'data' in response;

const unwrapApiResponse = <TData>(response: TData | ApiResponse<TData>, fallbackMessage: string): TData => {
    if (hasDataEnvelope(response)) {
        if (response.data === undefined) {
            throw {
                status: 500,
                message: fallbackMessage,
                details: response,
            };
        }

        return response.data;
    }

    return response;
};

const buildFuelOrdersListUrl = (params?: FuelOrderFilters): string => {
    const searchParams = new URLSearchParams();

    if (params?.airportIcaoCode) {
        searchParams.set('airportIcaoCode', params.airportIcaoCode);
    }

    if (params?.page) {
        searchParams.set('page', String(params.page));
    }

    if (params?.pageSize) {
        searchParams.set('pageSize', String(params.pageSize));
    }

    searchParams.set('include_status', 'true');

    const queryString = searchParams.toString();

    return queryString ? `${fuelOrdersUrl}?${queryString}` : fuelOrdersUrl;
};

const buildFuelOrderDetailUrl = (id: string, params?: { includeStatusHistory?: boolean; includeUser?: boolean }): string => {
    const searchParams = new URLSearchParams();

    if (params?.includeStatusHistory === true) {
        searchParams.set('include_status_history', 'true');
    }

    if (params?.includeUser === true) {
        searchParams.set('include_user', 'true');
    }

    const queryString = searchParams.toString();

    return queryString ? `${fuelOrdersUrl}/${id}?${queryString}` : `${fuelOrdersUrl}/${id}`;
};

export const fuelOrdersService = {
    async createFuelOrder(request: CreateFuelOrderRequest): Promise<FuelOrder> {
        const response = await httpClient<FuelOrder | ApiResponse<FuelOrder>>(fuelOrdersUrl, {
            method: 'POST',
            body: request,
        });

        return unwrapApiResponse(response, 'Fuel order was submitted, but no order was returned.');
    },

    async getFuelOrders(params?: FuelOrderFilters): Promise<FuelOrdersList> {
        const response = await httpClient<ListFuelOrdersResponseDto | ApiResponse<ListFuelOrdersResponseDto>>(
            buildFuelOrdersListUrl(params)
        );

        return unwrapApiResponse(response, 'Fuel orders could not be loaded.');
    },

    async getFuelOrder(id: string, params?: { includeStatusHistory?: boolean; includeUser?: boolean }): Promise<FuelOrder> {
        const response = await httpClient<FuelOrder | ApiResponse<FuelOrder>>(buildFuelOrderDetailUrl(id, params));

        return unwrapApiResponse(response, 'Fuel order could not be loaded.');
    },

    async updateFuelOrderStatus(id: string, status: FuelOrderStatus): Promise<FuelOrder> {
        const body: UpdateFuelOrderStatusRequest = { status };
        const response = await httpClient<FuelOrder | ApiResponse<FuelOrder>>(`${fuelOrdersUrl}/${id}/status`, {
            method: 'PATCH',
            body,
        });

        return unwrapApiResponse(response, 'Fuel order status was updated, but no order was returned.');
    },
};
