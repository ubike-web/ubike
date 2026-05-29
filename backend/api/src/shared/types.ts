export type UserRole = 'customer' | 'passenger_rider' | 'errands_rider' | 'admin' | 'super_admin' | 'support';
export type RideStatus = 'requested' | 'accepted' | 'rider_arrived' | 'in_progress' | 'completed' | 'cancelled' | 'fare_negotiation';
export type ErrandStatus = 'requested' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'escrowed' | 'released' | 'refunded' | 'failed';
export type VehicleType = 'standard' | 'electric';
export type RiderType = 'passenger' | 'errands';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: PaginationMeta | Record<string, unknown>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface JwtPayload {
  sub: string;
  role: UserRole;
  email?: string;
  phone?: string;
  iat?: number;
  exp?: number;
}

export interface FareEstimate {
  distanceKm: number;
  durationMinutes: number;
  baseFare: number;
  distanceFare: number;
  surgeFare: number;
  totalFare: number;
  currency: string;
}
