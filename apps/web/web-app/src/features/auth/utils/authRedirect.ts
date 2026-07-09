import type { Location } from 'react-router-dom';

import type { AuthUser } from '../types/auth.types';
import { getDefaultRouteForUser, isRouteAllowedForUser, routes } from '../../../routes/roleRoutes';

type RedirectLocationState = {
  from?: Location;
};

const isSafeAppPath = (path: string): boolean => path.startsWith('/') && !path.startsWith('//') && path !== routes.login;

export const getRedirectPathAfterLogin = (user: AuthUser, state: unknown): string => {
  const from = (state as RedirectLocationState | null)?.from;

  if (!from) {
    return getDefaultRouteForUser(user);
  }

  const intendedPath = `${from.pathname}${from.search}${from.hash}`;

  if (isSafeAppPath(intendedPath) && isRouteAllowedForUser(from.pathname, user)) {
    return intendedPath;
  }

  return getDefaultRouteForUser(user);
};
