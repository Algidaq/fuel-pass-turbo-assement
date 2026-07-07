import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { routes } from '../../../routes/roleRoutes';
import { authSession } from '../services/authSession';

export const AuthSessionSubscriber = () => {
  const navigate = useNavigate();

  useEffect(
    () =>
      authSession.subscribeToSessionExpired(() => {
        navigate(routes.login, {
          replace: true,
          state: { sessionExpired: true },
        });
      }),
    [navigate],
  );

  return null;
};
