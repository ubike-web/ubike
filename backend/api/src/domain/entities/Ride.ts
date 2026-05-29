import { RideStatus, PaymentStatus } from '../../shared/types';

export interface Ride {
  id: string;
  customer_id: string;
  rider_id?: string;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  distance_km: number;
  duration_minutes?: number;
  status: RideStatus;
  fare_estimate: number;
  fare_final?: number;
  fare_customer_approved?: boolean;
  payment_status: PaymentStatus;
  payment_reference?: string;
  vehicle_type: 'standard' | 'electric';
  surge_multiplier: number;
  rating_by_customer?: number;
  rating_by_rider?: number;
  cancellation_reason?: string;
  sos_triggered: boolean;
  scheduled_at?: string;
  accepted_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface RideRequest {
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  vehicle_type: 'standard' | 'electric';
  scheduled_at?: string;
}

export interface FareNegotiation {
  id: string;
  ride_id: string;
  proposed_fare: number;
  proposed_by: 'customer' | 'rider';
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}
