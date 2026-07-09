import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { FuelOrderStatus } from './order.enums';
import type { FuelOrderEntity } from './fuel-order.entity';

@Entity({ name: 'fuel_order_status_history' })
@Index('idx_fuel_order_status_history_order_changed_at', ['fuelOrderId', 'changedAt'])
export class FuelOrderStatusHistoryEntity {
    @PrimaryGeneratedColumn('uuid')
    public id!: string;

    @Column({ name: 'fuel_order_id', type: 'uuid' })
    public fuelOrderId!: string;

    @Column({
        name: 'from_status',
        type: 'simple-enum',
        enum: FuelOrderStatus,
        nullable: true,
    })
    public fromStatus!: FuelOrderStatus | null;

    @Column({
        name: 'to_status',
        type: 'simple-enum',
        enum: FuelOrderStatus,
    })
    public toStatus!: FuelOrderStatus;

    @Column({ name: 'changed_by_user_id', type: 'uuid', nullable: true })
    public changedByUserId!: string | null;

    @Column({ name: 'changed_at', type: Date, default: (): string => 'CURRENT_TIMESTAMP' })
    public changedAt!: Date;

    @Column({ name: 'note', type: 'text', nullable: true })
    public note!: string | null;

    @ManyToOne('FuelOrderEntity', (fuelOrder: FuelOrderEntity): FuelOrderStatusHistoryEntity[] => fuelOrder.statusHistory, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'fuel_order_id' })
    public fuelOrder!: FuelOrderEntity;
}
