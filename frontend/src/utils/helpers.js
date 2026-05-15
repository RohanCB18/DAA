/**
 * QuantArb — Utility Functions
 * Formatting, color scales, and data transformation helpers.
 */

/**
 * Map a variance value to a color between green (stable) and red (volatile).
 * Uses HSL interpolation: 120° (green) → 0° (red)
 */
export function varianceToColor(variance, minVar = 0, maxVar = 0.005) {
  const clamped = Math.max(minVar, Math.min(maxVar, variance));
  const ratio = (clamped - minVar) / (maxVar - minVar || 1);
  const hue = 120 - ratio * 120; // 120=green → 0=red
  return `hsl(${hue}, 85%, 55%)`;
}

/**
 * Format exchange rate to appropriate decimal places.
 * JPY pairs use 2 decimals, others use 4-5.
 */
export function formatRate(rate, fromCurrency, toCurrency) {
  if (!rate && rate !== 0) return '—';
  const pair = `${fromCurrency}${toCurrency}`;
  if (pair.includes('JPY')) {
    return rate >= 1 ? rate.toFixed(2) : rate.toFixed(5);
  }
  return rate.toFixed(4);
}

/**
 * Format USD amount with commas and dollar sign.
 */
export function formatCurrency(amount) {
  return `$${amount.toLocaleString('en-US')}`;
}

/**
 * Convert a cycle path array to a readable string.
 * ["USD", "EUR", "GBP", "USD"] → "USD → EUR → GBP → USD"
 */
export function cycleToString(path) {
  return path.join(' → ');
}

/**
 * Get a unique color for allocation segments by index.
 */
const SEGMENT_COLORS = [
  '#00e5ff', // cyan
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#f43f5e', // rose
  '#06b6d4', // teal
  '#ec4899', // pink
  '#84cc16', // lime
];

export function getSegmentColor(index) {
  return SEGMENT_COLORS[index % SEGMENT_COLORS.length];
}

/**
 * Normalize viability scores for bar display.
 * Returns 0-100 percentage relative to the maximum score.
 */
export function normalizeViability(score, maxScore) {
  if (!maxScore || maxScore <= 0) return 0;
  return Math.min(100, (score / maxScore) * 100);
}

/**
 * Generate positions for nodes arranged in a regular polygon.
 */
export function polygonPositions(count, centerX, centerY, radius) {
  const positions = [];
  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2; // start from top
    positions.push({
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    });
  }
  return positions;
}

/**
 * Check if two cycle paths represent the same cycle (rotation-invariant).
 */
export function areCyclesEqual(pathA, pathB) {
  if (!pathA || !pathB) return false;
  const coreA = pathA.slice(0, -1);
  const coreB = pathB.slice(0, -1);
  if (coreA.length !== coreB.length) return false;
  const key = coreA.join(',');
  for (let i = 0; i < coreB.length; i++) {
    const rotated = [...coreB.slice(i), ...coreB.slice(0, i)].join(',');
    if (rotated === key) return true;
  }
  return false;
}
