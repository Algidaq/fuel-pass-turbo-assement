import { Badge, Card, CardBody } from '@fuel-pass/ui';

import { FuelOrderForm } from '../../features/fuel-orders';
import styles from './SubmitOrderPage.module.css';

export const SubmitOrderPage = () => (
  <section className={styles.page}>
    <div className={styles.header}>
      <div className={styles.titleRow}>
        <h1>Submit Fuel Order</h1>
        <Badge variant="info">Aircraft Operator</Badge>
      </div>
      <p>
        Request aircraft refueling at a specific airport and delivery window. Ensure all data conforms to international aviation standards.
      </p>
    </div>

    <div className={styles.grid}>
      <div className={styles.main}>
        <Card className={styles.orderCard}>
          <CardBody className={styles.orderCardBody}>
            <div className={styles.orderCardHeader}>
              <h2>Fuel order details</h2>
              <p>Enter the aircraft, airport, fuel volume, and delivery time window.</p>
            </div>
            <FuelOrderForm />
          </CardBody>
        </Card>
      </div>

      <aside className={styles.support} aria-label="Fuel order guidance">
        <Card className={styles.supportCard}>
          <CardBody className={styles.supportCardBody}>
            <h3>Submission checklist</h3>
            <ul className={styles.checklist}>
              <li>
                <span aria-hidden="true">✓</span>
                <p>Confirm the aircraft tail number.</p>
              </li>
              <li>
                <span aria-hidden="true">✓</span>
                <p>Use a valid 4-letter ICAO airport code.</p>
              </li>
              <li>
                <span aria-hidden="true">✓</span>
                <p>Choose a realistic delivery time window.</p>
              </li>
            </ul>
          </CardBody>
        </Card>

        <Card className={styles.supportCard}>
          <CardBody className={styles.supportCardBody}>
            <div className={styles.supportHeadingRow}>
              <h3>Order status</h3>
              <span className={styles.pendingBadge}>Pending</span>
            </div>
            <p>
              New fuel orders are created as Pending until operations confirm scheduling. You will receive a notification once the status
              updates.
            </p>
          </CardBody>
        </Card>

        <div className={styles.supportHelpCard}>
          <div className={styles.supportHelpHeading}>
            <span aria-hidden="true">?</span>
            <h3>Need assistance?</h3>
          </div>
          <p>Contact our flight support desk for urgent refueling requests or fleet management inquiries. Available 24/7.</p>
        </div>
      </aside>
    </div>
  </section>
);
