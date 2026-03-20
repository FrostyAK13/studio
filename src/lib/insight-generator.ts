'use client';

export type InsightOutput = {
  summary: string;
  recommendedStrategy: 'Rise/Fall' | 'Even/Odd' | 'Matches/Differs' | 'Over/Under' | 'None';
  direction: string; // E.g., 'RISE', 'FALL', 'OVER 4', 'UNDER 5', 'EVEN', 'ODD'
  confidence: number;
  reasoning: string;
};

/**
 * Generates market insights based on a multi-protocol analysis window.
 * Evaluates Rise/Fall, Over/Under, Even/Odd, and Matches/Differs.
 */
export function generateInsight(ticks: number[], prices: number[]): InsightOutput {
  const analysisWindow = ticks.length;
  
  if (analysisWindow < 50) {
    throw new Error("Data sequence unstable. Minimum 50 ticks required for multi-protocol analysis.");
  }

  // 1. Rise/Fall Analysis
  let riseCount = 0;
  let fallCount = 0;
  for (let i = 0; i < prices.length - 1; i++) {
    if (prices[i] > prices[i+1]) riseCount++;
    else if (prices[i] < prices[i+1]) fallCount++;
  }
  const totalRF = (riseCount + fallCount) || 1;
  const risePerc = (riseCount / totalRF) * 100;
  const fallPerc = (fallCount / totalRF) * 100;

  // 2. Even/Odd Analysis
  const evenCount = ticks.filter(d => d % 2 === 0).length;
  const evenPercentage = (evenCount / analysisWindow) * 100;
  const oddPercentage = 100 - evenPercentage;

  // 3. Digit Frequency (Matches/Differs)
  const counts = Array(10).fill(0);
  ticks.forEach(digit => { counts[digit]++; });
  const digitPercentages = counts.map(c => (c / analysisWindow) * 100);
  const hottestDigit = digitPercentages.reduce((maxIndex, p, i, arr) => p > arr[maxIndex] ? i : maxIndex, 0);
  const hottestPerc = digitPercentages[hottestDigit];

  // 4. Over/Under Analysis (Pivot 4.5)
  const overCount = ticks.filter(d => d > 4).length;
  const underCount = ticks.filter(d => d < 5).length;
  const overPerc = (overCount / analysisWindow) * 100;
  const underPerc = (underCount / analysisWindow) * 100;

  // --- Decision Matrix ---
  
  // A. Priority: High Probability Deviations (>60% or extreme digit heat)
  
  // Check Digit Heat (Matches/Differs)
  if (hottestPerc > 14.5) {
    return {
      recommendedStrategy: 'Matches/Differs',
      direction: `MATCH ${hottestDigit}`,
      confidence: Math.min(95, hottestPerc * 6),
      summary: `Extreme Volumetric Heat detected on Digit ${hottestDigit}.`,
      reasoning: `Digit ${hottestDigit} is appearing at ${hottestPerc.toFixed(1)}%—a massive ${ (hottestPerc - 10).toFixed(1) }% deviation from mathematical norms. The logic gate favors a repetition pattern.`
    };
  }

  // Check Rise/Fall Momentum
  if (risePerc > 58 || fallPerc > 58) {
    const dir = risePerc > 58 ? 'RISE' : 'FALL';
    return {
      recommendedStrategy: 'Rise/Fall',
      direction: dir,
      confidence: Math.max(risePerc, fallPerc),
      summary: `High-Velocity ${dir} momentum sequence identified.`,
      reasoning: `The market vector shows a strong ${dir} bias in the last ${analysisWindow} ticks. Price action is consistently breaking pivot points in this direction.`
    };
  }

  // Check Over/Under Skew
  if (overPerc > 57 || underPerc > 57) {
    const dir = overPerc > 57 ? 'OVER 4' : 'UNDER 5';
    return {
      recommendedStrategy: 'Over/Under',
      direction: dir,
      confidence: Math.max(overPerc, underPerc),
      summary: `Barrier Symmetry is heavily skewed towards ${dir}.`,
      reasoning: `Digit distribution is currently localized in the ${overPerc > 57 ? 'High' : 'Low'} range. Standard variance suggests a continued flow into ${dir} zones.`
    };
  }

  // Check Even/Odd Skew
  if (evenPercentage > 56 || oddPercentage > 56) {
    const dir = evenPercentage > 56 ? 'EVEN' : 'ODD';
    return {
      recommendedStrategy: 'Even/Odd',
      direction: dir,
      confidence: Math.max(evenPercentage, oddPercentage),
      summary: `Alternating sequence bias towards ${dir} digits.`,
      reasoning: `Statistical flow shows an over-representation of ${dir} digits. Trading with the ${dir} flow provides the highest safety margin for the current sequence.`
    };
  }

  // Default: Balanced/Stable Recommendation
  return {
    recommendedStrategy: 'Rise/Fall',
    direction: risePerc >= fallPerc ? 'RISE' : 'FALL',
    confidence: 52,
    summary: 'Market in high-stability balanced phase.',
    reasoning: 'Distribution is within normal variance. Momentum vectoring suggests following the slight bullish/bearish lean of the price history.',
  };
}
