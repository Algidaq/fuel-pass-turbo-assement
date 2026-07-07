import dataSource from './data-source';

export async function seedOrdersData(): Promise<void> {
    const initializedDataSource = dataSource.isInitialized ? dataSource : await dataSource.initialize();

    await initializedDataSource.transaction(async (entityManager): Promise<void> => {
        await entityManager.query(`
            INSERT INTO "fuel_orders" (
                "id",
                "tail_number",
                "airport_icao_code",
                "requested_fuel_volume",
                "volume_unit",
                "delivery_window_start_at",
                "delivery_window_end_at",
                "status",
                "submitted_by_user_id",
                "last_status_changed_by_user_id"
            )
            VALUES
                (
                    '8f4f3314-8971-4bfe-a8b4-7ec9cbd66f1f',
                    'N123FP',
                    'OMDB',
                    1500.00,
                    'LITERS',
                    '2026-07-07T10:00:00.000Z',
                    '2026-07-07T12:00:00.000Z',
                    'PENDING',
                    '5aa0f497-f484-4eeb-a4c1-8dc363c3e0c4',
                    '5aa0f497-f484-4eeb-a4c1-8dc363c3e0c4'
                ),
                (
                    '6481e294-288e-4a2d-8df5-1cf285367a30',
                    'N456FP',
                    'OMAA',
                    2400.00,
                    'LITERS',
                    '2026-07-08T08:00:00.000Z',
                    '2026-07-08T10:00:00.000Z',
                    'CONFIRMED',
                    '5aa0f497-f484-4eeb-a4c1-8dc363c3e0c4',
                    '6abf35f5-1a16-40c3-bbe0-916ba0986c84'
                ),
                (
                    '42c5f1d8-88c3-4a09-aa5e-4f24d70c4cb6',
                    'N789FP',
                    'OMSJ',
                    3200.00,
                    'LITERS',
                    '2026-07-09T13:00:00.000Z',
                    '2026-07-09T15:00:00.000Z',
                    'COMPLETED',
                    '5aa0f497-f484-4eeb-a4c1-8dc363c3e0c4',
                    '6abf35f5-1a16-40c3-bbe0-916ba0986c84'
                )
            ON CONFLICT ("id") DO NOTHING
        `);

        await entityManager.query(`
            INSERT INTO "fuel_order_status_history" (
                "id",
                "fuel_order_id",
                "from_status",
                "to_status",
                "changed_by_user_id",
                "changed_at",
                "note"
            )
            VALUES
                (
                    '8d56c297-6f53-465c-b6ed-dff19e8498b8',
                    '8f4f3314-8971-4bfe-a8b4-7ec9cbd66f1f',
                    NULL,
                    'PENDING',
                    '5aa0f497-f484-4eeb-a4c1-8dc363c3e0c4',
                    '2026-07-06T08:00:00.000Z',
                    'Seed order submitted.'
                ),
                (
                    '546d3306-90ed-4d8c-b09d-4ce849144bcf',
                    '6481e294-288e-4a2d-8df5-1cf285367a30',
                    NULL,
                    'PENDING',
                    '5aa0f497-f484-4eeb-a4c1-8dc363c3e0c4',
                    '2026-07-06T09:00:00.000Z',
                    'Seed order submitted.'
                ),
                (
                    '8cfc7a3e-1123-42bf-805d-dfd8d99d0f46',
                    '6481e294-288e-4a2d-8df5-1cf285367a30',
                    'PENDING',
                    'CONFIRMED',
                    '6abf35f5-1a16-40c3-bbe0-916ba0986c84',
                    '2026-07-06T10:00:00.000Z',
                    'Seed order confirmed.'
                ),
                (
                    '7d0f0d05-56cb-4d37-bda7-a86f244cf0d9',
                    '42c5f1d8-88c3-4a09-aa5e-4f24d70c4cb6',
                    NULL,
                    'PENDING',
                    '5aa0f497-f484-4eeb-a4c1-8dc363c3e0c4',
                    '2026-07-06T11:00:00.000Z',
                    'Seed order submitted.'
                ),
                (
                    '977c80d0-35f1-4fa3-b211-3978cc86c561',
                    '42c5f1d8-88c3-4a09-aa5e-4f24d70c4cb6',
                    'PENDING',
                    'CONFIRMED',
                    '6abf35f5-1a16-40c3-bbe0-916ba0986c84',
                    '2026-07-06T12:00:00.000Z',
                    'Seed order confirmed.'
                ),
                (
                    '4ad79db8-c7cc-4514-94ef-5735f1899443',
                    '42c5f1d8-88c3-4a09-aa5e-4f24d70c4cb6',
                    'CONFIRMED',
                    'COMPLETED',
                    '6abf35f5-1a16-40c3-bbe0-916ba0986c84',
                    '2026-07-06T13:00:00.000Z',
                    'Seed order completed.'
                )
            ON CONFLICT ("id") DO NOTHING
        `);
    });
}

async function runSeed(): Promise<void> {
    try {
        await seedOrdersData();
        console.log('Orders seed data applied successfully.');
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
}

if (require.main === module) {
    void runSeed().catch((error: unknown): void => {
        console.error('Failed to apply orders seed data.', error);
        process.exitCode = 1;
    });
}
