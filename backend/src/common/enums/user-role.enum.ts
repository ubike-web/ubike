export enum UserRole {
  CUSTOMER = 'customer',
  TRANSPORT_RIDER = 'transport_rider',
  ERRANDS_RIDER = 'errands_rider',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
  SUPPORT = 'support',
}

export enum RideStatus {
  PENDING = 'pending',
  SEARCHING = 'searching',
  ACCEPTED = 'accepted',
  RIDER_ARRIVING = 'rider_arriving',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum ErrandStatus {
  PENDING = 'pending',
  SEARCHING = 'searching',
  ACCEPTED = 'accepted',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum TransactionType {
  RIDE_PAYMENT = 'ride_payment',
  ERRAND_PAYMENT = 'errand_payment',
  WALLET_FUNDING = 'wallet_funding',
  RIDER_PAYOUT = 'rider_payout',
  REFUND = 'refund',
  COMMISSION = 'commission',
  WITHDRAWAL = 'withdrawal',
}

export enum TransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum RiderServiceType {
  TRANSPORT = 'transport',
  ERRANDS = 'errands',
}

export enum VehicleType {
  NORMAL_BIKE = 'normal_bike',
  ELECTRIC_BIKE = 'electric_bike',
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}
