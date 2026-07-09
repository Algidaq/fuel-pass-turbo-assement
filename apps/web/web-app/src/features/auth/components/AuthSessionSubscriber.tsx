import { Box, Button, Card, Modal } from '@fuel-pass/ui';
import { useEffect, useRef, useState } from 'react';
import type { Location } from 'react-router-dom';
import { useLocation, useNavigate } from 'react-router-dom';

import { routes } from '../../../routes/roleRoutes';
import { authSession } from '../services/authSession';
import { useAuthStore } from '../store/auth.store';
import styles from './AuthSessionSubscriber.module.css';

export const AuthSessionSubscriber = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const clearSession = useAuthStore((state) => state.clearSession);
  const [isSessionExpiredDialogOpen, setIsSessionExpiredDialogOpen] = useState(false);
  const expiredLocationRef = useRef<Location | null>(null);

  useEffect(
    () =>
      authSession.subscribeToSessionExpired(() => {
        expiredLocationRef.current = location;
        setIsSessionExpiredDialogOpen(true);
      }),
    [location],
  );

  const handleLoginRedirect = () => {
    const expiredLocation = expiredLocationRef.current ?? location;

    setIsSessionExpiredDialogOpen(false);
    authSession.resetSessionExpiredNotification();
    clearSession();
    navigate(routes.login, {
      replace: true,
      state: {
        sessionExpired: true,
        from: expiredLocation,
      },
    });
  };

  return (
    <Modal aria-labelledby="session-expired-title" open={isSessionExpiredDialogOpen}>
      <Card className={styles.dialog}>
        <Box className={styles.content}>
          <Box className={styles.copy}>
            <h2 className={styles.title} id="session-expired-title">
              Login expired
            </h2>
            <p className={styles.message}>Your session has expired. Please sign in again to continue from this page.</p>
          </Box>
          <Box className={styles.actions}>
            <Button onClick={handleLoginRedirect} type="button">
              Sign in again
            </Button>
          </Box>
        </Box>
      </Card>
    </Modal>
  );
};
