'use server';
/**
 * @fileOverview A trading assistant that provides insights on digit patterns.
 *
 * - getDigitPatternInsight - A function that provides analysis and prediction on digit patterns.
 * - DigitPatternInsightInput - The input type for the getDigitPatternInsight function.
 * - DigitPatternInsightOutput - The return type for the getDigitPatternInsight function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';

const DigitPatternInsightInputSchema = z.object({
  market: z.string().describe('The synthetic index market name.'),
  ticks: z.array(z.number()).describe('The last 100 last digits of the price ticks.'),
});
export type DigitPatternInsightInput = z.infer<typeof DigitPatternInsightInputSchema>;

const DigitPatternInsightOutputSchema = z.object({
    outcome: z.enum(['OVER', 'UNDER']).describe("The predicted outcome, either 'OVER' or 'UNDER'."),
    digit: z.number().describe('The digit to base the prediction on (e.g., predict OVER 2 or UNDER 7).'),
    reasoning: z.string().describe('A brief explanation for the prediction.'),
});
export type DigitPatternInsightOutput = z.infer<typeof DigitPatternInsightOutputSchema>;

export async function getDigitPatternInsight(input: DigitPatternInsightInput): Promise<DigitPatternInsightOutput> {
  return digitPatternAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'digitPatternAssistantPrompt',
  model: googleAI.model('gemini-1.5-flash-latest'),
  input: {schema: DigitPatternInsightInputSchema},
  output: {schema: DigitPatternInsightOutputSchema},
  prompt: `You are an expert trading analyst for Deriv.com synthetic indices. Your task is to analyze patterns in the last digit of market ticks and provide a prediction.

Analyze the last 100 ticks for the market: {{{market}}}.

The ticks are: {{{ticks}}}.

Based on your analysis of trends, streaks, and frequencies, predict whether the next tick is likely to be 'OVER' a low digit (like 2 or 3) or 'UNDER' a high digit (like 7 or 8).

Provide your prediction and a brief reasoning based on the data.`,
});

const digitPatternAssistantFlow = ai.defineFlow(
  {
    name: 'digitPatternAssistantFlow',
    inputSchema: DigitPatternInsightInputSchema,
    outputSchema: DigitPatternInsightOutputSchema,
  },
  async input => {
    // Ensure we only send the last 100 ticks to the model
    const recentTicks = input.ticks.slice(0, 100);
    const {output} = await prompt({ ...input, ticks: recentTicks });
    return output!;
  }
);
