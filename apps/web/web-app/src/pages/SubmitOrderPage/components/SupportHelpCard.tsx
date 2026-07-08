import styles from '../SubmitOrderPage.module.css';

export const SupportHelpCard = () => (
    <div className={styles.supportHelpCard}>
        <div className={styles.supportHelpHeading}>
            <span aria-hidden="true">?</span>
            <h3>Need assistance?</h3>
        </div>
        <p>Contact our flight support desk for urgent refueling requests or fleet management inquiries. Available 24/7.</p>
    </div>
);
