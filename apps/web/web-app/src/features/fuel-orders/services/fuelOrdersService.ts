import { env } from '../../../config/env';
import { httpClient } from '../../../services/httpClient';
import type { CreateFuelOrderRequest, FuelOrder } from '../types/fuelOrder.types';

const fuelOrdersUrl = `${env.ordersApiBaseUrl.replace(/\/+$/, '')}/v1/fuel-orders`;

export const fuelOrdersService = {
  createFuelOrder(request: CreateFuelOrderRequest): Promise<FuelOrder> {
    return httpClient<FuelOrder>(fuelOrdersUrl, {
      method: 'POST',
      body: request,
    });
  },
};
