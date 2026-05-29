import { ErrandStatus, PaymentStatus } from '../../shared/types';

export interface Errand {
  id: string;
  customer_id: string;
  rider_id?: string;
  category: ErrandCategory;
  description: string;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  distance_km: number;
  status: ErrandStatus;
  fare_estimate: number;
  fare_final?: number;
  payment_status: PaymentStatus;
  payment_reference?: string;
  item_value?: number;
  item_description?: string;
  recipient_name?: string;
  recipient_phone?: string;
  proof_of_delivery_url?: string;
  rating_by_customer?: number;
  rating_by_rider?: number;
  cancellation_reason?: string;
  scheduled_at?: string;
  accepted_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export type ErrandCategory =
  | 'shopping'
  | 'food_delivery'
  | 'document_delivery'
  | 'parcel_delivery'
  | 'pharmacy'
  | 'bill_payment'
  | 'laundry'
  | 'other';

export interface ErrandRequest {
  category: ErrandCategory;
  description: string;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  item_value?: number;
  item_description?: string;
  recipient_name?: string;
  recipient_phone?: string;
  scheduled_at?: string;
}
