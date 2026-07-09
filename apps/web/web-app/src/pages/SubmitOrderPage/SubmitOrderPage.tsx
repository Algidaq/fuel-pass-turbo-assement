import { FuelOrderDetailsCard } from './components/FuelOrderDetailsCard';
import { OrderStatusGuidanceCard } from './components/OrderStatusGuidanceCard';
import { SubmissionChecklistCard } from './components/SubmissionChecklistCard';
import { SubmitOrderHeader } from './components/SubmitOrderHeader';
import { SupportHelpCard } from './components/SupportHelpCard';
import styles from './SubmitOrderPage.module.css';

export const SubmitOrderPage = () => (
    <section className={styles.page}>
        <SubmitOrderHeader />

        <div className={styles.grid}>
            <div className={styles.main}>
                <FuelOrderDetailsCard />
            </div>

            <aside className={styles.support} aria-label="Fuel order guidance">
                <SubmissionChecklistCard />
                <OrderStatusGuidanceCard />
                <SupportHelpCard />
            </aside>
        </div>
    </section>
);
