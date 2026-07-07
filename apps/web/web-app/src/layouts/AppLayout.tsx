import { Outlet } from 'react-router-dom';

import { AppHeader } from '../components/navigation/AppHeader';
import styles from './AppLayout.module.css';

export const AppLayout = () => {
  return (
    <div className={styles.layout}>
      <AppHeader />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
};
