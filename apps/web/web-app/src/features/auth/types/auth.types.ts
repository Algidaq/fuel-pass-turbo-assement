export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  roles: string[];
  permissions?: string[];
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: 'Bearer';
  user: AuthUser;
};

export type CurrentUserResponse = {
  user: AuthUser;
};
