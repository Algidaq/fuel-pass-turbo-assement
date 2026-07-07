import { Outlet } from 'react-router-dom';

import styles from './AuthLayout.module.css';

export const AuthLayout = () => (
  <main className={styles.layout}>
    <section className={styles.shell} aria-label="Authentication">
      <div className={styles.brand} aria-label="FuelPass">
        <span className={styles.brandIcon} aria-hidden="true">
          <svg viewBox="0 0 24 24" role="img">
            <path d="M7 3h7a2 2 0 0 1 2 2v14H5V5a2 2 0 0 1 2-2Z" />
            <path d="M8 6h5v4H8V6Z" />
            <path d="M16 7h2l2 2v8a2 2 0 0 1-2 2h-2" />
            <path d="M18 9v3" />
          </svg>
        </span>
        <span className={styles.brandName}>FuelPass</span>
      </div>
      <Outlet />
      <footer className={styles.footer}>FuelPass Operations Platform</footer>
    </section>
  </main>
);
