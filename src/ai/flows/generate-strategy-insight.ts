'use server';
/**
 * @fileOverview Provides an AI-powered flow to generate trading strategy insights.
 *
 * This file defines a Genkit flow that uses a generative AI model to analyze
 * a series of market ticks and recommend a trading strategy.
 *
 * - generateStrategyInsight - An exported function to invoke the AI flow.
 * - InsightInput - The Zod schema for the flow's input.
 * - InsightOutput - The Zod schema for the flow's output.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

// Define the Zod schema for the input, which includes the market name and the tick data.
const InsightInputSchema = z.object({
  marketName: z.string().describe('The name of the synthetic market being analyzed.'),
  ticks: z.array(z.number()).describe('An array of the last 50 last-digit ticks, with the most recent tick first.'),
});
export type InsightInput = z.infer<typeof InsightInputSchema>;

// Define the Zod schema for the structured output we expect from the AI.
const InsightOutputSchema = z.object({
  summary: z.string().describe('A concise, one-sentence summary of the current market condition.'),
  recommendedStrategy: z
    .enum(['Even/Odd', 'Matches/Differs', 'Over/Under', 'None'])
    .describe('The single best trading strategy to use based on the analysis. Can be "None" if no clear strategy emerges.'),
  reasoning: z.string().describe('A clear, step-by-step explanation for why the recommended strategy was chosen, citing patterns in the data.'),
});
export type InsightOutput = z.infer<typeof InsightOutputSchema>;

// Define the Genkit prompt that will be sent to the AI model.
const insightPrompt = ai.definePrompt({
  name: 'strategyInsightPrompt',
  input: {schema: InsightInputSchema},
  output: {schema: InsightOutputSchema},
  prompt: `You are an expert trading analyst specializing in synthetic indices. Your task is to analyze the last 50 single-digit ticks from the '{{marketName}}' market and recommend a trading strategy.

The ticks are provided chronologically (oldest to newest). Here is the data:
{{ticks}}

Analyze the data for the following patterns:
1.  **Even/Odd Bias:** Is there a strong dominance of even or odd numbers (e.g., >65%)?
2.  **Digit Frequency:** Is any single digit appearing with unusually high frequency (e.g., >18%)?
3.  **Streaks:** Are there any long consecutive streaks of a particular pattern (e.g., 6 or more even numbers in a row)?

Based on your analysis, provide a concise summary, recommend a single strategy ('Even/Odd', 'Matches/Differs', 'Over/Under', or 'None'), and give a clear reasoning for your choice.`,
});

// Define the Genkit flow that orchestrates the AI call.
const generateInsightFlow = ai.defineFlow(
  {
    name: 'generateInsightFlow',
    inputSchema: InsightInputSchema,
    outputSchema: InsightOutputSchema,
  },
  async (input) => {
    // The prompt expects ticks in chronological order, but our app provides them newest first.
    const chronologicalTicks = [...input.ticks].reverse();

    const {output} = await insightPrompt({
      ...input,
      ticks: chronologicalTicks,
    });
    
    if (!output) {
        throw new Error("The AI model did not return a valid output.");
    }

    return output;
  }
);

// Export a simple async function to be called from the client-side component.
export async function generateStrategyInsight(input: InsightInput): Promise<InsightOutput> {
  return generateInsightFlow(input);
}
