'use server';
/**
 * @fileOverview This flow implements the AI-driven smart matching tool for u-bike, 
 * intelligently matching users with the most suitable available rider based on various factors.
 *
 * - smartRiderMatcher - A function that handles the smart rider matching process.
 * - SmartRiderMatcherInput - The input type for the smartRiderMatcher function.
 * - SmartRiderMatcherOutput - The return type for the smartRiderMatcher function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SmartRiderMatcherInputSchema = z.object({
  userLocation: z.string().describe('The current pickup location of the user (e.g., an address or coordinates).'),
  destination: z.string().describe('The desired destination for the ride (e.g., an address or coordinates).'),
  desiredRideType: z.enum(['Normal', 'Electric']).describe('The type of bike the user prefers (Normal or Electric).'),
  availableRiders: z.array(
    z.object({
      id: z.string().describe('Unique identifier for the rider.'),
      name: z.string().describe('The name of the rider.'),
      rating: z.number().min(0).max(5).describe('The rider\'s average rating.'),
      bikeType: z.enum(['Normal', 'Electric']).describe('The type of bike the rider uses.'),
      currentLocation: z.string().describe('The current location of the rider.'),
      estimatedTimeToUser: z.string().describe('Estimated time for the rider to reach the user (e.g., "5 minutes").'),
      estimatedTravelTime: z.string().describe('Estimated travel time from user to destination with this rider (e.g., "20 minutes").'),
      historicalCompletionRate: z.number().min(0).max(100).optional().describe('The rider\'s historical ride completion rate in percentage.'),
    })
  ).describe('A list of currently available riders with their details.'),
  trafficConditions: z.string().describe('Description of real-time traffic conditions affecting routes.'),
});
export type SmartRiderMatcherInput = z.infer<typeof SmartRiderMatcherInputSchema>;

const SmartRiderMatcherOutputSchema = z.object({
  riderId: z.string().describe('The unique identifier of the matched rider.'),
  riderName: z.string().describe('The name of the matched rider.'),
  riderRating: z.number().describe('The average rating of the matched rider.'),
  bikeType: z.enum(['Normal', 'Electric']).describe('The bike type of the matched rider.'),
  estimatedFare: z.string().describe('The estimated fare for the ride (e.g., "KES 250").'),
  estimatedPickupTime: z.string().describe('Estimated time until the matched rider arrives for pickup.'),
  matchedReason: z.string().describe('A brief explanation of why this rider was selected.'),
});
export type SmartRiderMatcherOutput = z.infer<typeof SmartRiderMatcherOutputSchema>;

export async function smartRiderMatcher(input: SmartRiderMatcherInput): Promise<SmartRiderMatcherOutput> {
  return smartRiderMatcherFlow(input);
}

const smartRiderMatcherPrompt = ai.definePrompt({
  name: 'smartRiderMatcherPrompt',
  input: { schema: SmartRiderMatcherInputSchema },
  output: { schema: SmartRiderMatcherOutputSchema },
  prompt: `You are an intelligent rider matching system for the u-bike ride-hailing platform. 
Your goal is to select the most suitable available rider for a user based on the provided criteria.

Consider the following factors in your decision-making:
- Proximity to the user (shorter estimatedTimeToUser is better)
- Desired bike type (must match user's desiredRideType)
- Rider rating (higher is better)
- Historical completion rate (higher is better, if available)
- Real-time traffic conditions (choose routes/riders less impacted)

User Details:
- Pickup Location: {{{userLocation}}}
- Destination: {{{destination}}}
- Desired Bike Type: {{{desiredRideType}}}

Real-time Traffic Conditions: {{{trafficConditions}}}

Available Riders:
{{#each availableRiders}}
- Rider ID: {{{id}}}
  Name: {{{name}}}
  Rating: {{{rating}}}
  Bike Type: {{{bikeType}}}
  Current Location: {{{currentLocation}}}
  Estimated Time to User: {{{estimatedTimeToUser}}}
  Estimated Travel Time to Destination: {{{estimatedTravelTime}}}
  Historical Completion Rate: {{#if historicalCompletionRate}}{{{historicalCompletionRate}}}%{{else}}N/A{{/if}}
{{/each}}

Based on these details, choose the single best rider. 
Provide the chosen rider's details and a brief explanation for your choice, including estimated fare and pickup time.

Remember to strictly adhere to the desiredRideType. If no rider matches the desiredRideType, explain that no suitable rider was found.

Example Output for a suitable match:
{
  "riderId": "R123",
  "riderName": "John Doe",
  "riderRating": 4.9,
  "bikeType": "Normal",
  "estimatedFare": "KES 250",
  "estimatedPickupTime": "5 minutes",
  "matchedReason": "John Doe was selected due to his high rating, proximity (5 mins), and matching bike type. Traffic conditions are favorable on his route."
}

Example Output for no suitable match:
{
  "riderId": null,
  "riderName": null,
  "riderRating": null,
  "bikeType": null,
  "estimatedFare": null,
  "estimatedPickupTime": null,
  "matchedReason": "No available riders could be found matching the 'Electric' bike type within a reasonable distance at this time."
}`,
});

const smartRiderMatcherFlow = ai.defineFlow(
  {
    name: 'smartRiderMatcherFlow',
    inputSchema: SmartRiderMatcherInputSchema,
    outputSchema: SmartRiderMatcherOutputSchema,
  },
  async (input) => {
    const { output } = await smartRiderMatcherPrompt(input);
    return output!;
  }
);
