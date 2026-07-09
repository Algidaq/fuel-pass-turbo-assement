import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import type { FuelOrderStatusHistoryEntity } from './fuel-order-status-history.entity';
import { FuelOrderStatus, VolumeUnit } from './order.enums';

@Entity({ name: 'fuel_orders' })
@Index('idx_fuel_orders_airport_icao_code', ['airportIcaoCode'])
@Index('idx_fuel_orders_created_at', ['createdAt'])
@Index('idx_fuel_orders_status', ['status'])
export class FuelOrderEntity {
    @PrimaryGeneratedColumn('uuid')
    public id!: string;

    @Column({ name: 'tail_number', type: 'varchar', length: 32 })
    public tailNumber!: string;

    @Column({ name: 'airport_icao_code', type: 'varchar', length: 4 })
    public airportIcaoCode!: string;

    @Column({ name: 'requested_fuel_volume', type: 'numeric', precision: 12, scale: 2 })
    public requestedFuelVolume!: string;

    @Column({
        name: 'volume_unit',
        type: 'simple-enum',
        enum: VolumeUnit,
        default: VolumeUnit.LITERS,
    })
    public volumeUnit!: VolumeUnit;

    @Column({ name: 'delivery_window_start_at', type: Date })
    public deliveryWindowStartAt!: Date;

    @Column({ name: 'delivery_window_end_at', type: Date })
    public deliveryWindowEndAt!: Date;

    @Column({
        name: 'status',
        type: 'simple-enum',
        enum: FuelOrderStatus,
        default: FuelOrderStatus.PENDING,
    })
    public status!: FuelOrderStatus;

    @Column({ name: 'submitted_by_user_id', type: 'uuid', nullable: true })
    public submittedByUserId!: string | null;

    @Column({ name: 'last_status_changed_by_user_id', type: 'uuid', nullable: true })
    public lastStatusChangedByUserId!: string | null;

    @CreateDateColumn({ name: 'created_at' })
    public createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    public updatedAt!: Date;

    @OneToMany('FuelOrderStatusHistoryEntity', (history: FuelOrderStatusHistoryEntity): FuelOrderEntity => history.fuelOrder)
    public statusHistory!: FuelOrderStatusHistoryEntity[];
}
