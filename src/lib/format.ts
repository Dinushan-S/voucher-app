export function formatLKR(amount: number): string {
  return new Intl.NumberFormat('en-LK').format(amount);
}
