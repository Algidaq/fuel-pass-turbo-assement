import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { FuelOrderStatusHistoryEntity } from '../entities/fuel-order-status-history.entity';
import { FuelOrderEntity } from '../entities/fuel-order.entity';
import { FuelOrderStatus, VolumeUnit } from '../entities/order.enums';
import { OrderException } from '../orders.errors';

export interface CreateFuelOrderData {
    tailNumber: string;
    airportIcaoCode: string;
    requestedFuelVolume: string | number;
    status?: FuelOrderStatus;
    volumeUnit?: VolumeUnit;
    deliveryWindowStartAt: Date;
    deliveryWindowEndAt: Date;
    submittedByUserId?: string | null;
    lastStatusChangedByUserId?: string | null;
}

export interface FindFuelOrdersFilters {
    airportIcaoCode?: string;
    status?: FuelOrderStatus;
    page?: number;
    pageSize?: number;
}

export type FuelOrderStatusCounts = Record<FuelOrderStatus, number>;

interface FuelOrderStatusCountRaw {
    status: FuelOrderStatus;
    count: string | number;
}

export interface UpdateFuelOrderStatusData {
    fuelOrderId: string;
    status: FuelOrderStatus;
    changedByUserId?: string | null;
}

export interface ConditionalUpdateFuelOrderStatusData extends UpdateFuelOrderStatusData {
    currentStatus: FuelOrderStatus;
}

export interface CreateFuelOrderStatusHistoryData {
    fuelOrderId: string;
    fromStatus?: FuelOrderStatus | null;
    toStatus: FuelOrderStatus;
    changedByUserId?: string | null;
    changedAt?: Date;
    note?: string | null;
}

@Injectable()
export class FuelOrderRepository {
    public constructor(
        @InjectRepository(FuelOrderEntity) private readonly fuelOrderRepository: Repository<FuelOrderEntity>,
        @InjectRepository(FuelOrderStatusHistoryEntity)
        private readonly statusHistoryRepository: Repository<FuelOrderStatusHistoryEntity>
    ) {}

    public createFuelOrder(data: CreateFuelOrderData, manager?: EntityManager): Promise<FuelOrderEntity> {
        const repository = this.getFuelOrderRepository(manager);
        const fuelOrder = repository.create({
            ...data,
            requestedFuelVolume: data.requestedFuelVolume.toString(),
        });

        return repository.save(fuelOrder);
    }

    public findById(id: string, manager?: EntityManager): Promise<FuelOrderEntity | null> {
        return this.getFuelOrderRepository(manager).findOne({ where: { id } });
    }

    public async findByIdOrThrow(id: string, manager?: EntityManager): Promise<FuelOrderEntity> {
        const order = await this.getFuelOrderRepository(manager).findOne({ where: { id } });
        if (!order) {
            throw new OrderException(HttpStatus.NOT_FOUND, 'FuelOrderNotFound');
        }
        return order;
    }

    public async findByIdWithStatusHistoryOrThrow(id: string, manager?: EntityManager): Promise<FuelOrderEntity> {
        const order = await this.getFuelOrderRepository(manager).findOne({
            where: { id },
            relations: {
                statusHistory: true,
            },
            order: {
                statusHistory: {
                    changedAt: 'ASC',
                },
            },
        });
        if (!order) {
            throw new OrderException(HttpStatus.NOT_FOUND, 'FuelOrderNotFound');
        }
        return order;
    }

    public findMany(filters: FindFuelOrdersFilters = {}, manager?: EntityManager): Promise<FuelOrderEntity[]> {
        return this.getFuelOrderRepository(manager).find({
            where: {
                ...(filters.airportIcaoCode === undefined ? {} : { airportIcaoCode: filters.airportIcaoCode }),
                ...(filters.status === undefined ? {} : { status: filters.status }),
            },
            order: {
                createdAt: 'DESC',
            },
            skip: this.toSkip(filters),
            take: filters.pageSize,
        });
    }

    public findManyAndCount(filters: FindFuelOrdersFilters = {}, manager?: EntityManager): Promise<[FuelOrderEntity[], number]> {
        return this.getFuelOrderRepository(manager).findAndCount({
            where: {
                ...(filters.airportIcaoCode === undefined ? {} : { airportIcaoCode: filters.airportIcaoCode }),
                ...(filters.status === undefined ? {} : { status: filters.status }),
            },
            order: {
                createdAt: 'DESC',
            },
            skip: this.toSkip(filters),
            take: filters.pageSize,
        });
    }

    public async countByStatus(filters: FindFuelOrdersFilters = {}, manager?: EntityManager): Promise<FuelOrderStatusCounts> {
        const counts: FuelOrderStatusCounts = {
            [FuelOrderStatus.PENDING]: 0,
            [FuelOrderStatus.CONFIRMED]: 0,
            [FuelOrderStatus.COMPLETED]: 0,
        };
        const queryBuilder = this.getFuelOrderRepository(manager)
            .createQueryBuilder('fuelOrder')
            .select('fuelOrder.status', 'status')
            .addSelect('COUNT(fuelOrder.id)', 'count')
            .groupBy('fuelOrder.status');

        if (filters.airportIcaoCode !== undefined) {
            queryBuilder.andWhere('fuelOrder.airportIcaoCode = :airportIcaoCode', { airportIcaoCode: filters.airportIcaoCode });
        }

        if (filters.status !== undefined) {
            queryBuilder.andWhere('fuelOrder.status = :status', { status: filters.status });
        }

        const rows = await queryBuilder.getRawMany<FuelOrderStatusCountRaw>();

        for (const row of rows) {
            counts[row.status] = Number(row.count);
        }

        return counts;
    }

    public async updateStatus(data: UpdateFuelOrderStatusData, manager?: EntityManager): Promise<void> {
        await this.getFuelOrderRepository(manager).update(
            { id: data.fuelOrderId },
            {
                status: data.status,
                lastStatusChangedByUserId: data.changedByUserId ?? null,
            }
        );
    }

    public async updateStatusIfCurrent(data: ConditionalUpdateFuelOrderStatusData, manager?: EntityManager): Promise<boolean> {
        const result = await this.getFuelOrderRepository(manager).update(
            { id: data.fuelOrderId, status: data.currentStatus },
            {
                status: data.status,
                lastStatusChangedByUserId: data.changedByUserId ?? null,
            }
        );

        return (result.affected ?? 0) > 0;
    }

    public createStatusHistory(data: CreateFuelOrderStatusHistoryData, manager?: EntityManager): Promise<FuelOrderStatusHistoryEntity> {
        const repository = this.getStatusHistoryRepository(manager);
        const statusHistory = repository.create({
            ...data,
            fromStatus: data.fromStatus ?? null,
            changedByUserId: data.changedByUserId ?? null,
            note: data.note ?? null,
        });

        return repository.save(statusHistory);
    }

    private getFuelOrderRepository(manager?: EntityManager): Repository<FuelOrderEntity> {
        return manager?.getRepository(FuelOrderEntity) ?? this.fuelOrderRepository;
    }

    private getStatusHistoryRepository(manager?: EntityManager): Repository<FuelOrderStatusHistoryEntity> {
        return manager?.getRepository(FuelOrderStatusHistoryEntity) ?? this.statusHistoryRepository;
    }

    private toSkip(filters: FindFuelOrdersFilters): number | undefined {
        if (filters.page === undefined || filters.pageSize === undefined) {
            return undefined;
        }

        return (filters.page - 1) * filters.pageSize;
    }
}
