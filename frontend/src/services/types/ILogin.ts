export interface LoginRequest {
  Username: string;
  Password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expireAt: string;
}