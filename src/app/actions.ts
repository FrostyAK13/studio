'use server';

import { getDigitPatternInsight, type DigitPatternInsightInput } from "@/ai/flows/digit-pattern-assistant-insight";

export async function getAIPrediction(input: DigitPatternInsightInput) {
    return await getDigitPatternInsight(input);
}
