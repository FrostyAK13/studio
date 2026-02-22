'use server';
/**
 * @fileOverview An AI-powered assistant for analyzing real-time last digit ticks of synthetic indices.
 *
 * - getDigitPatternAssistantInsight - A function that analyzes last digit ticks for patterns and anomalies.
 * - DigitPatternAssistantInsightInput - The input type for the getDigitPatternAssistantInsight function.
 * - DigitPatternAssistantInsightOutput - The return type for the getDigitPatternAssistantInsight function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DigitPatternAssistantInsightInputSchema = z.object({
  lastDigitTicks: z
    .array(z.number().min(0).max(9))
    .describe('An array of the last digits (0-9) from recent synthetic index ticks.'),
});
export type DigitPatternAssistantInsightInput = z.infer<
  typeof DigitPatternAssistantInsightInputSchema
>;

const DigitPatternAssistantInsightOutputSchema = z.object({
  evenOdd: z.object({
    prediction: z.enum(['Even', 'Odd']).describe('The most likely prediction for the next digit being Even or Odd.'),
    confidence: z.number().min(0).max(1).describe('Confidence score for the Even/Odd prediction (0 to 1).'),
    analysis: z.string().describe('Brief analysis for the Even/Odd prediction.'),
  }),
  overUnder: z.object({
    prediction: z.enum(['Over 3', 'Under 6']).describe("The most likely prediction for the next digit being 'Over 3' (4-9) or 'Under 6' (0-5)."),
    confidence: z.number().min(0).max(1).describe('Confidence score for the Over/Under prediction (0 to 1).'),
    analysis: z.string().describe('Brief analysis for the Over/Under prediction.'),
  }),
  matches: z.object({
    prediction: z.number().min(0).max(9).describe('The digit that is most likely to appear next.'),
    confidence: z.number().min(0).max(1).describe('Confidence score for the digit match prediction (0 to 1).'),
    analysis: z.string().describe('Brief analysis for the digit match prediction.'),
  }),
  generalInsights: z
    .string()
    .describe('A general summary of insights from the digit analysis.'),
});
export type DigitPatternAssistantInsightOutput = z.infer<
  typeof DigitPatternAssistantInsightOutputSchema
>;

export async function getDigitPatternAssistantInsight(
  input: DigitPatternAssistantInsightInput
): Promise<DigitPatternAssistantInsightOutput> {
  return digitPatternAssistantInsightFlow(input);
}

const digitPatternAssistantPrompt = ai.definePrompt({
  name: 'digitPatternAssistantPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: DigitPatternAssistantInsightInputSchema },
  output: { schema: DigitPatternAssistantInsightOutputSchema },
  prompt: `You are an AI-powered assistant specializing in analyzing real-time last digit ticks of synthetic indices for trading. Your goal is to provide simple, clear predictions for three specific markets: Even/Odd, Over/Under, and Matches. Remember that 0 is a valid digit and should be included in your analysis like any other digit; for example, it is an even number.

Analyze the following sequence of the last digits (0-9) from recent synthetic index ticks:
Digits: {{lastDigitTicks}}

Based on this data, provide predictions for the following markets:
1.  **Even/Odd**: Predict if the next digit will be Even (0, 2, 4, 6, 8) or Odd (1, 3, 5, 7, 9).
2.  **Over/Under**: Predict if the next digit will be 'Over 3' (digits 4, 5, 6, 7, 8, 9) or 'Under 6' (digits 0, 1, 2, 3, 4, 5). Provide the single most likely prediction between these two.
3.  **Matches**: Predict which single digit (0-9) is most likely to appear next.

For each prediction, provide a confidence score (from 0.0 to 1.0) and a brief, simple analysis explaining your reasoning. Also provide a general insight summary.

Ensure your output strictly adheres to the specified JSON schema for 'DigitPatternAssistantInsightOutput'. Keep the analysis simple and direct.`,
});

const digitPatternAssistantInsightFlow = ai.defineFlow(
  {
    name: 'digitPatternAssistantInsightFlow',
    inputSchema: DigitPatternAssistantInsightInputSchema,
    outputSchema: DigitPatternAssistantInsightOutputSchema,
  },
  async (input) => {
    const { output } = await digitPatternAssistantPrompt(input);
    return output!;
  }
);
