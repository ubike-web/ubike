import { type SmartRiderMatcherInput } from '@/ai/flows/smart-rider-matcher-flow';

export type RideType = 'Normal' | 'Electric';
export type RiderServiceType = 'PassengerRides' | 'Errands' | 'Both';

export const BASE_FARE = 100;
export const KM_RATE = 50;
export const ELECTRIC_SURCHARGE = 1.2;
export const ERRAND_BASE = 150;

export function calculateFare(distance: number, type: RideType): string {
  const base = BASE_FARE + (distance * KM_RATE);
  const total = type === 'Electric' ? base * ELECTRIC_SURCHARGE : base;
  return `KES ${Math.round(total)}`;
}

export function calculateErrandFare(distance: number, size: string): string {
  const sizeMultiplier = size === 'Large' ? 1.5 : size === 'Medium' ? 1.2 : 1;
  const total = (ERRAND_BASE + (distance * KM_RATE)) * sizeMultiplier;
  return `KES ${Math.round(total)}`;
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
  },
  {
    id: 'R004',
    name: 'Mercy Auma',
    rating: 4.9,
    bikeType: 'Electric' as const,
    currentLocation: 'CBD, Nairobi',
    estimatedTimeToUser: '5 minutes',
    estimatedTravelTime: '20 minutes',
    historicalCompletionRate: 99,
    imageUrl: 'https://picsum.photos/seed/rider4/400/300',
    services: 'Both' as RiderServiceType
  }
];

export const MOCK_REQUESTS = [
  {
    id: 'REQ001',
    pickup: 'Town Center, Nairobi',
    destination: 'Westlands Stage',
    distance: '2.3 km away',
    price: 'KES 250',
    type: 'Electric' as const,
    category: 'Ride'
  },
  {
    id: 'REQ002',
    pickup: 'Kilimani Shopping Mall',
    destination: 'CBD - Uhuru Park',
    distance: '4.1 km away',
    price: 'KES 400',
    type: 'Normal' as const,
    category: 'Errand',
    description: 'Documents delivery'
  }
];

export const MOCK_TRAFFIC = "Moderate traffic on Uhuru Highway, clear skies.";
