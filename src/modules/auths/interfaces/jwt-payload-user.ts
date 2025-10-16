export interface JwtPayloadUser {
  sub: number; // JWT standard field
  id: number; // Alias for sub
  phoneNumber?: string;
  role: string; // Role name from JWT
  roleCode?: string; // Role code from JWT
  status?: string;
  deviceId?: string;
  sessionId?: number;
}
