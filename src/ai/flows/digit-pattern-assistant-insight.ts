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
  patternsIdentified: z
    .array(z.string())
    .describe(
      'List of recurring digit patterns identified (e.g., "alternating odd/even", "streaks of 7s").'
    ),
  anomaliesDetected: z
    .array(z.string())
    .describe(
      'List of unusual or unexpected digit occurrences (e.g., "a sudden cluster of 0s after a period of high numbers").'
    ),
  insights: z
    .string()
    .describe('A comprehensive summary of potential trading insights derived from the digit analysis.'),
  recommendations: z
    .string()
    .optional()
    .describe(
      'Optional: General trading recommendations or suggestions based on the identified patterns and anomalies.'
    ),
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
  input: { schema: DigitPatternAssistantInsightInputSchema },
  output: { schema: DigitPatternAssistantInsightOutputSchema },
  prompt: `You are an AI-powered assistant specializing in analyzing real-time last digit ticks of synthetic indices.
Your goal is to identify recurring patterns and anomalies in the provided sequence of last digits, and then provide potential trading insights.

Analyze the following sequence of the last digits (0-9) from recent synthetic index ticks:
Digits: {{{JSON.stringify lastDigitTicks}}}

Based on this data:
1.  Identify any recurring patterns.
2.  Detect any significant anomalies or unusual occurrences.
3.  Provide clear, actionable insights for a trader.
4.  Optionally, suggest general trading recommendations based on your findings.

Ensure your output strictly adheres to the specified JSON schema for 'DigitPatternAssistantInsightOutput'.`,
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
