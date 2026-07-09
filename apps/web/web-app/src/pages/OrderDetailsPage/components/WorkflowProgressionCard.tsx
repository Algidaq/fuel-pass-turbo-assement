import { Card, CardBody, CardHeader } from '@fuel-pass/ui';
import { getFuelOrderStatusLabel, getNextFuelOrderStatus, type FuelOrder, type FuelOrderStatus } from '../../../features/fuel-orders';
import styles from '../OrderDetailsPage.module.css';

const workflowStatuses: FuelOrderStatus[] = ['PENDING', 'CONFIRMED', 'COMPLETED'];

export const WorkflowProgressionCard = ({ order }: { order: FuelOrder }) => {
    const currentIndex = workflowStatuses.indexOf(order.status);
    const nextStatus = getNextFuelOrderStatus(order.status);

    return (
        <Card className={styles.card}>
            <CardHeader>
                <h2>Workflow progression</h2>
            </CardHeader>
            <CardBody>
                <div className={styles.workflow} aria-label="Order status workflow">
                    {workflowStatuses.map((status, index) => {
                        const isComplete = index < currentIndex;
                        const isCurrent = status === order.status;

                        return (
                            <div
                                className={styles.workflowStep}
                                data-state={isCurrent ? 'current' : isComplete ? 'complete' : 'pending'}
                                key={status}
                            >
                                <span>{isComplete ? 'OK' : index + 1}</span>
                                <strong>{getFuelOrderStatusLabel(status)}</strong>
                            </div>
                        );
                    })}
                </div>
                <div className={styles.transitionMap}>
                    <p>Transition Map</p>
                    <ul>
                        <li data-state={currentIndex > 0 ? 'complete' : nextStatus === 'CONFIRMED' ? 'current' : 'pending'}>
                            Pending to Confirmed
                        </li>
                        <li data-state={currentIndex > 1 ? 'complete' : nextStatus === 'COMPLETED' ? 'current' : 'pending'}>
                            Confirmed to Completed
                        </li>
                    </ul>
                </div>
            </CardBody>
        </Card>
    );
};
