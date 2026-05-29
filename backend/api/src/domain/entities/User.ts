import { UserRole } from '../../shared/types';

export interface User {
  id: string;
  email?: string;
  phone?: string;
  password_hash?: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  referral_code: string;
  referred_by?: string;
  wallet_balance: number;
  loyalty_points: number;
  created_at: string;
  updated_at: string;
}

export interface RiderProfile {
  id: string;
  user_id: string;
  rider_type: 'passenger' | 'errands';
  vehicle_type: 'standard' | 'electric';
  plate_number: string;
  is_available: boolean;
  is_kyc_verified: boolean;
  current_lat?: number;
  current_lng?: number;
  rating: number;
  total_rides: number;
  earnings_total: number;
  earnings_pending: number;
}

export interface CustomerProfile {
  id: string;
  user_id: string;
  home_address?: string;
  work_address?: string;
  home_lat?: number;
  home_lng?: number;
  work_lat?: number;
  work_lng?: number;
  emergency_contact?: string;
  preferred_payment?: string;
}
