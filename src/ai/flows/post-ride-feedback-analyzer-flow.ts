'use server';
/**
 * @fileOverview This file implements a Genkit flow for analyzing post-ride feedback.
 * It performs sentiment analysis and identifies key themes from user comments.
 *
 * - analyzePostRideFeedback - A function that triggers the post-ride feedback analysis process.
 * - PostRideFeedbackAnalyzerInput - The input type for the analyzePostRideFeedback function.
 * - PostRideFeedbackAnalyzerOutput - The return type for the analyzePostRideFeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PostRideFeedbackAnalyzerInputSchema = z.object({
  comment: z
    .string()
    .describe('The user-submitted comment about their ride.'),
});
export type PostRideFeedbackAnalyzerInput = z.infer<
  typeof PostRideFeedbackAnalyzerInputSchema
>;

const PostRideFeedbackAnalyzerOutputSchema = z.object({
  sentiment: z
    .enum(['positive', 'negative', 'neutral'])
    .describe('The overall sentiment of the comment.'),
  themes: z
    .array(z.string())
    .describe('A list of key themes or issues identified in the comment.'),
  summary: z
    .string()
    .describe('A concise summary of the comment, highlighting its main points.'),
});
export type PostRideFeedbackAnalyzerOutput = z.infer<
  typeof PostRideFeedbackAnalyzerOutputSchema
>;

export async function analyzePostRideFeedback(
  input: PostRideFeedbackAnalyzerInput
): Promise<PostRideFeedbackAnalyzerOutput> {
  return postRideFeedbackAnalyzerFlow(input);
}

const analyzePostRideFeedbackPrompt = ai.definePrompt({
  name: 'analyzePostRideFeedbackPrompt',
  input: {schema: PostRideFeedbackAnalyzerInputSchema},
  output: {schema: PostRideFeedbackAnalyzerOutputSchema},
  prompt: `You are an AI assistant specialized in analyzing user feedback for a ride-hailing platform.

Analyze the following user comment about a ride. Your task is to:
1. Determine the overall sentiment (positive, negative, or neutral).
2. Identify and list key themes or recurring issues present in the comment.
3. Provide a concise summary of the comment, capturing its main points.

User Comment: {{{comment}}}`,
});

const postRideFeedbackAnalyzerFlow = ai.defineFlow(
  {
    name: 'postRideFeedbackAnalyzerFlow',
    inputSchema: PostRideFeedbackAnalyzerInputSchema,
    outputSchema: PostRideFeedbackAnalyzerOutputSchema,
  },
  async (input) => {
    const {output} = await analyzePostRideFeedbackPrompt(input);
    if (!output) {
      throw new Error('Failed to analyze post-ride feedback: No output from prompt.');
    }
    return output;
  }
);
