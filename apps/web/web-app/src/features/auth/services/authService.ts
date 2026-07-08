import { httpClient } from '../../../services/httpClient';
import type { AuthUser, CurrentUserResponse, LoginRequest, LoginResponse } from '../types/auth.types';

type BackendAuthUser = {
  id: string;
  email: string;
  fullName?: string;
  name?: string;
  roles?: string[];
  permissions?: string[];
};

type BackendLoginResponse = {
  access_token?: string;
  accessToken?: string;
  refresh_token?: string;
  refreshToken?: string;
  expires_in?: number;
  expiresIn?: number;
  token_type?: 'Bearer';
  tokenType?: 'Bearer';
  user: BackendAuthUser;
};

type BackendCurrentUserResponse = {
  user: BackendAuthUser;
};

const mapAuthUser = (user: BackendAuthUser): AuthUser => ({
  id: user.id,
  email: user.email,
  name: user.name ?? user.fullName,
  roles: user.roles ?? [],
  permissions: user.permissions ?? [],
});

const mapLoginResponse = (response: BackendLoginResponse): LoginResponse => ({
  accessToken: response.accessToken ?? response.access_token ?? '',
  refreshToken: response.refreshToken ?? response.refresh_token,
  expiresIn: response.expiresIn ?? response.expires_in,
  tokenType: response.tokenType ?? response.token_type,
  user: mapAuthUser(response.user),
});

export const authService = {
  async login(request: LoginRequest): Promise<LoginResponse> {
    const response = await httpClient<BackendLoginResponse>('/auth-service/api/v1/auth/login', {
      method: 'POST',
      body: request,
    });
    const session = mapLoginResponse(response);

    if (!session.accessToken) {
      throw {
        status: 500,
        message: 'Login succeeded but no access token was returned.',
        details: response,
      };
    }

    return session;
  },

  async getCurrentUser(): Promise<CurrentUserResponse> {
    const response = await httpClient<BackendCurrentUserResponse>('/auth-service/api/v1/auth/me');

    return {
      user: mapAuthUser(response.user),
    };
  },

  async logout(refreshToken?: string): Promise<void> {
    await httpClient<unknown>('/auth-service/api/v1/auth/logout', {
      method: 'POST',
      body: { refreshToken },
    });
  },
};
