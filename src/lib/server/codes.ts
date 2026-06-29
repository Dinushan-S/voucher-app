import { randomInt, createHmac } from 'node:crypto';
import { QR_SECRET } from '$env/static/private';

// Safe alphabet — excludes lookalikes 0 O 1 I L for clean manual transcription.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

function node(): string {
  const block = () =>
    Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
  return `${block()}-${block()}`;
}

// 5000 -> "5K", 15000 -> "15K", 750 -> "750"
export function prefix(amount: number): string {
  return amount >= 1000 && amount % 1000 === 0 ? `${amount / 1000}K` : String(amount);
}

export function makeCode(amount: number): string {
  return `${prefix(amount)}-${node()}`;
}

// Signed token embedded in the QR. Lets the scanner reject forged QRs
// before any DB lookup. Format: <code>.<hmac-16hex>
export function signToken(code: string): string {
  const sig = createHmac('sha256', QR_SECRET).update(code).digest('hex').slice(0, 16);
  return `${code}.${sig}`;
}

export function verifyToken(token: string): string | null {
  const i = token.lastIndexOf('.');
  if (i < 0) return null;
  const code = token.slice(0, i);
  const sig = token.slice(i + 1);
  const expected = createHmac('sha256', QR_SECRET).update(code).digest('hex').slice(0, 16);
  // constant-time-ish compare
  if (sig.length !== expected.length) return null;
  let diff = 0;
  for (let k = 0; k < sig.length; k++) diff |= sig.charCodeAt(k) ^ expected.charCodeAt(k);
  return diff === 0 ? code : null;
}
