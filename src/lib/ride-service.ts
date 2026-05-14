import { type SmartRiderMatcherOutput } from '@/ai/flows/smart-rider-matcher-flow';

export type RideType = 'Normal' | 'Electric';
export type RiderServiceType = 'PassengerRides' | 'Errands' | 'Both';

export const BASE_FARE = 100;
export const KM_RATE = 50;
export const ELECTRIC_SURCHARGE = 1.2;
export const ERRAND_BASE = 150;

// Adjustment & Commission Constants
export const MIN_ADJUSTMENT_PCT = 20;
export const MAX_ADJUSTMENT_PCT = 30;
export const STANDARD_COMMISSION_PCT = 0.20;
export const ADJUSTED_COMMISSION_PCT = 0.25;

export const ADJUSTMENT_REASONS = [
  "Bad road",
  "Rainy weather",
  "Heavy traffic",
  "Long distance",
  "Remote area",
  "Night ride",
  "Steep terrain",
  "Waiting time",
  "Other reason"
];

export function calculateFare(distance: number, type: RideType): number {
  const base = BASE_FARE + (distance * KM_RATE);
  const total = type === 'Electric' ? base * ELECTRIC_SURCHARGE : base;
  return Math.round(total);
}

export function formatFare(amount: number): string {
  return `KES ${amount}`;
}

export function calculateCommission(fare: number, isAdjusted: boolean): number {
  const rate = isAdjusted ? ADJUSTED_COMMISSION_PCT : STANDARD_COMMISSION_PCT;
  return Math.round(fare * rate);
}

/**
 * Generates a Google Maps navigation URL for a given address or coordinates.
 */
export function getGoogleMapsUrl(query: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}&travelmode=two-wheeler`;
}

export const MOCK_RIDERS = [
  {
    id: 'R001',
    name: 'Samuel Kipchoge',
    rating: 4.9,
    bikeType: 'Normal' as const,
    currentLocation: 'Upper Hill, Nairobi',
    estimatedTimeToUser: '4 minutes',
    estimatedTravelTime: '15 minutes',
    historicalCompletionRate: 98,
    imageUrl: 'https://picsum.photos/seed/rider1/400/300',
    services: 'Both' as RiderServiceType
  },
  {
    id: 'R002',
    name: 'Faith Wanjiku',
    rating: 4.8,
    bikeType: 'Electric' as const,
    currentLocation: 'Westlands, Nairobi',
    estimatedTimeToUser: '6 minutes',
    estimatedTravelTime: '18 minutes',
    historicalCompletionRate: 95,
    imageUrl: 'https://picsum.photos/seed/rider2/400/300',
    services: 'PassengerRides' as RiderServiceType
  },
  {
    id: 'R003',
    name: 'David Otieno',
    rating: 4.7,
    bikeType: 'Normal' as const,
    currentLocation: 'Kilimani, Nairobi',
    estimatedTimeToUser: '3 minutes',
    estimatedTravelTime: '12 minutes',
    historicalCompletionRate: 92,
    imageUrl: 'https://picsum.photos/seed/rider3/400/300',
    services: 'Errands' as RiderServiceType
  }
];

export const MOCK_REQUESTS = [
  {
    id: 'REQ001',
    pickup: 'Town Center, Nairobi',
    destination: 'Westlands Stage',
    distance: '2.3 km',
    price: 250,
    type: 'Electric' as const,
    category: 'Ride'
  },
  {
    id: 'REQ002',
    pickup: 'Kilimani Shopping Mall',
    destination: 'CBD - Uhuru Park',
    distance: '4.1 km',
    price: 400,
    type: 'Normal' as const,
    category: 'Errand'
  }
];

export const MOCK_TRAFFIC = "Moderate traffic on Uhuru Highway, clear skies.";
