import { type SmartRiderMatcherInput } from '@/ai/flows/smart-rider-matcher-flow';

export type RideType = 'Normal' | 'Electric';

export const BASE_FARE = 100;
export const KM_RATE = 50;
export const ELECTRIC_SURCHARGE = 1.2;

export function calculateFare(distance: number, type: RideType): string {
  const base = BASE_FARE + (distance * KM_RATE);
  const total = type === 'Electric' ? base * ELECTRIC_SURCHARGE : base;
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
  }
];

export const MOCK_TRAFFIC = "Moderate traffic on Uhuru Highway, clear skies.";
