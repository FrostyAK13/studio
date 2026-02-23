'use client';

export type InsightOutput = {
  summary: string;
  recommendedStrategy: 'Even/Odd' | 'Matches/Differs' | 'Over/Under' | 'None';
  reasoning: string;
};

export function generateInsight(ticks: number[]): InsightOutput {
  if (ticks.length < 50) {
    throw new Error("Not enough data to generate an insight.");
  }

  // 1. Even/Odd Analysis
  const evenCount = ticks.filter(d => d % 2 === 0).length;
  const evenPercentage = (evenCount / ticks.length) * 100;
  const oddPercentage = 100 - evenPercentage;

  // 2. Digit Frequency Analysis
  const counts = Array(10).fill(0);
  ticks.forEach(digit => { counts[digit]++; });
  const digitPercentages = counts.map(c => (c / ticks.length) * 100);
  const hottestDigit = digitPercentages.reduce((maxIndex, p, i, arr) => p > arr[maxIndex] ? i : maxIndex, 0);
  const hottestDigitPercentage = digitPercentages[hottestDigit];

  // 3. Streak Analysis (Even/Odd)
  const outcomes = ticks.map(digit => (digit % 2 === 0 ? 'E' : 'O'));
  let longestStreak = { type: '', count: 0 };
  let currentStreak = { type: '', count: 0 };
  for (const outcome of outcomes) {
    if (currentStreak.type && outcome === currentStreak.type) {
      currentStreak.count++;
    } else {
      currentStreak = { type: outcome as 'E' | 'O', count: 1 };
    }
    if (currentStreak.count > longestStreak.count) {
      longestStreak = { ...currentStreak };
    }
  }

  // --- Decision Logic ---
  if (evenPercentage > 65 || oddPercentage > 65) {
    const dominantType = evenPercentage > 65 ? 'Even' : 'Odd';
    return {
      recommendedStrategy: 'Even/Odd',
      summary: `The market is heavily favoring ${dominantType} digits.`,
      reasoning: `With a ${Math.max(evenPercentage, oddPercentage).toFixed(1)}% dominance, an Even/Odd strategy is recommended to capitalize on the strong bias.`
    };
  }

  if (hottestDigitPercentage > 18) { // 18% is a significant deviation from 10%
    return {
      recommendedStrategy: 'Matches/Differs',
      summary: `Digit ${hottestDigit} is appearing unusually frequently.`,
      reasoning: `Digit ${hottestDigit} has appeared ${hottestDigitPercentage.toFixed(1)}% of the time. This suggests a "Matches" strategy targeting this specific digit could be effective.`
    };
  }
  
  if (longestStreak.count >= 6) {
      const streakType = longestStreak.type === 'E' ? 'Even' : 'Odd';
      const reversalType = longestStreak.type === 'E' ? 'Odd' : 'Even';
      return {
          recommendedStrategy: 'Even/Odd',
          summary: `A long streak of ${streakType} numbers was detected.`,
          reasoning: `A streak of ${longestStreak.count} consecutive ${streakType} digits occurred. This could indicate market exhaustion, making a reversal to ${reversalType} a potential strategy.`
      };
  }

  // Default/Fallback
  return {
    recommendedStrategy: 'Over/Under',
    summary: 'The market appears to be balanced without strong biases.',
    reasoning: 'No significant Even/Odd bias or digit frequency anomaly was found. An Over/Under strategy on a mid-range digit (e.g., Over 4 / Under 5) can be a stable choice in such conditions.',
  };
}
