export function sessionExpiry(): number {
  return (Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000;
}
