import { Card, CardBody } from '@fuel-pass/ui';

import styles from './EmptyState.module.css';

type EmptyStateProps = {
    title: string;
    description?: string;
};

export const EmptyState = ({ title, description }: EmptyStateProps) => (
    <Card className={styles.emptyState}>
        <CardBody>
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
        </CardBody>
    </Card>
);
