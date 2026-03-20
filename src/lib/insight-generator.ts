'use client';

export type ProtocolStrategy = 'Rise/Fall' | 'Even/Odd' | 'Matches/Differs' | 'Over/Under';

export type ProtocolInsight = {
  strategy: ProtocolStrategy;
  direction: string; // E.g., 'RISE', 'FALL', 'OVER 4', 'UNDER 5', 'EVEN', 'ODD'
  confidence: number;
  reasoning: string;
  summary: string;
};

export type MultiProtocolOutput = {
  globalSummary: string;
  protocols: ProtocolInsight[];
};

/**
 * Generates comprehensive market insights across all trading protocols.
 */
export function generateInsight(ticks: number[], prices: number[]): MultiProtocolOutput {
  const analysisWindow = ticks?.length || 0;
  const priceWindow = prices?.length || 0;
  
  if (analysisWindow < 50 || priceWindow < 50) {
    throw new Error("Data sequence unstable. Minimum 50 ticks required for multi-protocol analysis.");
  }

  const protocolInsights: ProtocolInsight[] = [];

  // 1. Rise/Fall Evaluation
  let riseCount = 0;
  let fallCount = 0;
  for (let i = 0; i < prices.length - 1; i++) {
    if (prices[i] > prices[i+1]) riseCount++;
    else if (prices[i] < prices[i+1]) fallCount++;
  }
  const totalRF = (riseCount + fallCount) || 1;
  const risePerc = (riseCount / totalRF) * 100;
  const fallPerc = (fallCount / totalRF) * 100;
  
  protocolInsights.push({
    strategy: 'Rise/Fall',
    direction: risePerc >= fallPerc ? 'RISE' : 'FALL',
    confidence: Math.max(risePerc, fallPerc),
    summary: `${risePerc >= fallPerc ? 'Bullish' : 'Bearish'} momentum vectoring.`,
    reasoning: `Market sentiment shows a ${Math.max(risePerc, fallPerc).toFixed(1)}% weight towards ${risePerc >= fallPerc ? 'upward' : 'downward'} price action in the current window.`
  });

  // 2. Even/Odd Evaluation
  const evenCount = ticks.filter(d => d % 2 === 0).length;
  const evenPercentage = (evenCount / analysisWindow) * 100;
  const oddPercentage = 100 - evenPercentage;
  
  protocolInsights.push({
    strategy: 'Even/Odd',
    direction: evenPercentage >= oddPercentage ? 'EVEN' : 'ODD',
    confidence: Math.max(evenPercentage, oddPercentage),
    summary: `${evenPercentage >= oddPercentage ? 'Even' : 'Odd'} digit repetition flow.`,
    reasoning: `Statistical deviation for ${evenPercentage >= oddPercentage ? 'Even' : 'Odd'} digits is ${Math.abs(evenPercentage - 50).toFixed(1)}% away from equilibrium.`
  });

  // 3. Over/Under Evaluation
  const overCount = ticks.filter(d => d > 4).length;
  const underCount = ticks.filter(d => d < 5).length;
  const overPerc = (overCount / analysisWindow) * 100;
  const underPerc = (underCount / analysisWindow) * 100;
  
  protocolInsights.push({
    strategy: 'Over/Under',
    direction: overPerc >= underPerc ? 'OVER 4' : 'UNDER 5',
    confidence: Math.max(overPerc, underPerc),
    summary: `${overPerc >= underPerc ? 'Upper' : 'Lower'} barrier range saturation.`,
    reasoning: `The market is currently clustering in the ${overPerc >= underPerc ? 'high (5-9)' : 'low (0-4)'} digit range with ${Math.max(overPerc, underPerc).toFixed(1)}% consistency.`
  });

  // 4. Matches/Differs Evaluation (Hottest Digit)
  const counts = Array(10).fill(0);
  ticks.forEach(digit => { counts[digit]++; });
  const digitPercentages = counts.map(c => (c / analysisWindow) * 100);
  const hottestDigit = digitPercentages.reduce((maxIndex, p, i, arr) => p > arr[maxIndex] ? i : maxIndex, 0);
  const hottestPerc = digitPercentages[hottestDigit];
  
  protocolInsights.push({
    strategy: 'Matches/Differs',
    direction: `MATCH ${hottestDigit}`,
    confidence: Math.min(95, hottestPerc * 5),
    summary: `Digit ${hottestDigit} volumetric heat peak.`,
    reasoning: `Digit ${hottestDigit} is significantly overheated at ${hottestPerc.toFixed(1)}% frequency. Patterns suggest continued repetition for Match protocols.`
  });

  return {
    globalSummary: "Multi-protocol analysis indicates localized volatility deviations across all strategy gates.",
    protocols: protocolInsights
  };
}
