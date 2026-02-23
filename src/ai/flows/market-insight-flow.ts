'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { syntheticIndices } from '@/lib/mock-data';

const MarketInsightInputSchema = z.object({
  ticks: z.array(z.number()).describe('The last 100 digits from the market tick stream.'),
  marketId: z.string().describe('The ID of the market being analyzed, e.g., "R_100".'),
});

const MarketInsightOutputSchema = z.object({
  summary: z.string().describe("A brief, one-sentence summary of the current market's character."),
  recommendedStrategy: z
    .enum(['Even/Odd', 'Matches/Differs', 'Over/Under', 'None'])
    .describe("The recommended trading strategy to use right now. 'None' if the market is too unpredictable."),
  reasoning: z.string().describe('A concise explanation for why the strategy was recommended, highlighting the key patterns observed.'),
});

export type MarketInsightInput = z.infer<typeof MarketInsightInputSchema>;
export type MarketInsightOutput = z.infer<typeof MarketInsightOutputSchema>;


const marketInsightPrompt = ai.definePrompt({
  name: 'marketInsightPrompt',
  input: { schema: MarketInsightInputSchema },
  output: { schema: MarketInsightOutputSchema },
  model: 'googleai/gemini-1.5-flash',
  prompt: `
    You are an expert trading analyst specializing in synthetic indices tick data from binary options brokers. Your task is to analyze a series of last digits from a market and provide a concise insight into its current behavior, recommending a strategy.

    The user is analyzing the '{{{marketName}}}' market.

    Based on the last 100 ticks provided, analyze the following patterns:
    1.  **Even/Odd Distribution:** Is there a heavy bias towards even or odd numbers (e.g., >60% dominance)?
    2.  **Digit Frequency:** Are any specific digits (0-9) appearing far more or less often than the statistical average of 10%?
    3.  **Streaks & Runs:** Are there long consecutive runs of the same outcome (e.g., 5+ Evens in a row, 4+ occurrences of digits 0-2)?
    4.  **Alternation:** Is the market rapidly switching between outcomes without forming clear trends?

    Based on your analysis, provide a brief 'summary' of the current market character.

    Then, determine which of the three trading strategies would be most suitable right now: 'Even/Odd', 'Matches/Differs', or 'Over/Under'. If the market is too random or unpredictable, recommend 'None'.

    Finally, provide a 'reasoning' for your recommendation, explaining which market patterns support your choice.

    The tick data is: {{{json ticks}}}
    `,
});


export async function getMarketInsight(input: MarketInsightInput): Promise<MarketInsightOutput> {
    const marketName = syntheticIndices.find(m => m.id === input.marketId)?.name || input.marketId;
    
    // Ensure we only send the last 100 ticks to the model
    const recentTicks = input.ticks.slice(0, 100);

    const {output} = await marketInsightPrompt({ ...input, ticks: recentTicks, marketName });
    if (!output) {
        throw new Error("The AI failed to generate an insight.");
    }
    return output;
}
