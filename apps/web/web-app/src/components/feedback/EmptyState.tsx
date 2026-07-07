import { Card, CardBody } from '@fuel-pass/ui';

type EmptyStateProps = {
    title: string;
    description?: string;
};

export const EmptyState = ({ title, description }: EmptyStateProps) => (
    <Card className="empty-state">
        <CardBody>
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
        </CardBody>
    </Card>
);
