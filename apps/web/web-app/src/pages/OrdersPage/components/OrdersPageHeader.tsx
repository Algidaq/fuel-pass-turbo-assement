import { Badge, Button } from '@fuel-pass/ui';

import styles from '../OrdersPage.module.css';

type OrdersPageHeaderProps = {
    isRefreshing: boolean;
    onRefresh: () => void;
    roleLabel: string;
};

export const OrdersPageHeader = ({ isRefreshing, onRefresh, roleLabel }: OrdersPageHeaderProps) => (
    <header className={styles.header}>
        <div>
            <div className={styles.titleRow}>
                <h1>Fuel Orders</h1>
                <Badge variant="info">{roleLabel}</Badge>
            </div>
            <p>Track submitted fuel orders and update operational status.</p>
        </div>
        <Button disabled={isRefreshing} onClick={onRefresh} type="button" variant="secondary">
            <span aria-hidden="true">↻</span>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
    </header>
);
