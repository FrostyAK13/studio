'use server';

import {
  getDigitPatternAssistantInsight,
  type DigitPatternAssistantInsightOutput,
} from '@/ai/flows/digit-pattern-assistant-insight';

export async function getAnalysis(
  lastDigitTicks: number[]
): Promise<DigitPatternAssistantInsightOutput> {
  if (!lastDigitTicks || lastDigitTicks.length === 0) {
    throw new Error('No digit ticks provided for analysis.');
  }

  try {
    const result = await getDigitPatternAssistantInsight({ lastDigitTicks });
    return result;
  } catch (error) {
    console.error('Error getting AI insight:', error);
    throw new Error('Failed to get analysis from AI assistant.');
  }
}
