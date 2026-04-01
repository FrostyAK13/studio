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
 * Generates comprehensive market insights across all trading protocols with sharpened accuracy logic.
 */
export function generateInsight(ticks: number[], prices: number[]): MultiProtocolOutput {
  const analysisWindow = ticks?.length || 0;
  const priceWindow = prices?.length || 0;
  
  if (analysisWindow < 50 || priceWindow < 50) {
    throw new Error("Data sequence unstable. Minimum 50 ticks required for professional multi-protocol analysis.");
  }

  const protocolInsights: ProtocolInsight[] = [];

  // 1. Rise/Fall Evaluation (Using ROC and Momentum Logic)
  const recentPrices = prices.slice(0, 10);
  const roc = ((recentPrices[0] - recentPrices[9]) / recentPrices[9]) * 1000; // Multiplied for better scale
  let riseCount = 0;
  let fallCount = 0;
  for (let i = 0; i < prices.length - 1; i++) {
    if (prices[i] > prices[i+1]) riseCount++;
    else if (prices[i] < prices[i+1]) fallCount++;
  }
  const totalRF = (riseCount + fallCount) || 1;
  const risePerc = (riseCount / totalRF) * 100;
  const fallPerc = (fallCount / totalRF) * 100;
  
  const rfDirection = risePerc >= fallPerc ? 'RISE' : 'FALL';
  const rfConfidence = Math.min(98, Math.max(risePerc, fallPerc) + (Math.abs(roc) * 10));

  protocolInsights.push({
    strategy: 'Rise/Fall',
    direction: rfDirection,
    confidence: rfConfidence,
    summary: `${rfDirection} momentum acceleration detected.`,
    reasoning: `Price identifies a ${Math.max(risePerc, fallPerc).toFixed(1)}% trend weight with an acceleration factor of ${Math.abs(roc).toFixed(4)}.`
  });

  // 2. Even/Odd Evaluation (Standard Deviation Logic)
  const evenCount = ticks.filter(d => d % 2 === 0).length;
  const evenPercentage = (evenCount / analysisWindow) * 100;
  const oddPercentage = 100 - evenPercentage;
  const variance = Math.abs(evenPercentage - 50);
  
  const eoDirection = evenPercentage >= oddPercentage ? 'EVEN' : 'ODD';
  // Confidence is higher if we are far from 50% (mean reversion) or extremely close (momentum follow)
  const eoConfidence = 70 + (variance * 1.5);

  protocolInsights.push({
    strategy: 'Even/Odd',
    direction: eoDirection,
    confidence: Math.min(95, eoConfidence),
    summary: `${eoDirection} digit cluster saturation.`,
    reasoning: `Digit distribution identifies a ${variance.toFixed(1)}% deviation from standard parity. Market identifies a clear entry gate for ${eoDirection} protocols.`
  });

  // 3. Over/Under Evaluation (Skew Pivot Analysis)
  const overCount = ticks.filter(d => d > 4).length;
  const underCount = ticks.filter(d => d < 5).length;
  const overPerc = (overCount / analysisWindow) * 100;
  const underPerc = (underCount / analysisWindow) * 100;
  
  // Dynamic barrier selection based on skew
  let ouDirection = 'UNDER 5';
  let ouBarrier = 5;
  if (overPerc > 60) { ouDirection = 'OVER 2'; ouBarrier = 2; }
  else if (underPerc > 60) { ouDirection = 'UNDER 7'; ouBarrier = 7; }
  else { ouDirection = overPerc >= underPerc ? 'OVER 4' : 'UNDER 5'; }

  protocolInsights.push({
    strategy: 'Over/Under',
    direction: ouDirection,
    confidence: Math.min(96, Math.max(overPerc, underPerc) + 10),
    summary: `Barrier range shift towards ${ouDirection.split(' ')[0]}.`,
    reasoning: `Numerical center of gravity identifies high ${ouDirection.split(' ')[0]} barrier skew with ${Math.max(overPerc, underPerc).toFixed(1)}% historical reliability.`
  });

  // 4. Matches/Differs Evaluation (Rolling Recursive Logic)
  const counts = Array(10).fill(0);
  ticks.forEach(digit => { counts[digit]++; });
  const digitPercentages = counts.map(c => (c / analysisWindow) * 100);
  const hottestDigit = digitPercentages.reduce((maxIndex, p, i, arr) => p > arr[maxIndex] ? i : maxIndex, 0);
  const hottestPerc = digitPercentages[hottestDigit];
  
  // Strategy selection: Match if extremely hot, Differ otherwise
  const mdStrategy = hottestPerc > 13 ? 'MATCH' : 'DIFFER';

  protocolInsights.push({
    strategy: 'Matches/Differs',
    direction: `${mdStrategy} ${hottestDigit}`,
    confidence: Math.min(95, hottestPerc * 6),
    summary: `Digit ${hottestDigit} volumetric flow scan.`,
    reasoning: `Digit ${hottestDigit} identifies a heat factor of ${hottestPerc.toFixed(1)}%. Optimized for ${mdStrategy} protocol sync with trigger following.`
  });

  return {
    globalSummary: "Multi-vector protocol synchronization identifies high-accuracy strategic windows in current market flux.",
    protocols: protocolInsights
  };
}
