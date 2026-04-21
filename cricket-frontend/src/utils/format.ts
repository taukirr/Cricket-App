export function formatOversFromBalls(legalBalls: number): string {
  const completedOvers = Math.floor(legalBalls / 6);
  const balls = legalBalls % 6;

  return `${completedOvers}.${balls}`;
}

export function formatBowlingOvers(legalBalls: number): string {
  return formatOversFromBalls(legalBalls);
}

export function calculateRunRate(totalRuns: number, legalBalls: number): number {
  if (legalBalls === 0) {
    return 0;
  }

  return Number(((totalRuns / legalBalls) * 6).toFixed(2));
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}
