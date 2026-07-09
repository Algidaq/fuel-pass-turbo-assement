import { Card, CardBody } from '@fuel-pass/ui';

import styles from '../SubmitOrderPage.module.css';

const checklistItems = [
    'Confirm the aircraft tail number.',
    'Use a valid 4-letter ICAO airport code.',
    'Choose a realistic delivery time window.',
] as const;

export const SubmissionChecklistCard = () => (
    <Card className={styles.supportCard}>
        <CardBody className={styles.supportCardBody}>
            <h3>Submission checklist</h3>
            <ul className={styles.checklist}>
                {checklistItems.map((item) => (
                    <li key={item}>
                        <span aria-hidden="true">✓</span>
                        <p>{item}</p>
                    </li>
                ))}
            </ul>
        </CardBody>
    </Card>
);
