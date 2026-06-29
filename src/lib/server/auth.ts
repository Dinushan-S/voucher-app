import { SignJWT, jwtVerify } from 'jose';
import { SESSION_SECRET } from '$env/static/private';
import type { Cookies } from '@sveltejs/kit';

const SECRET = new TextEncoder().encode(SESSION_SECRET);
const COOKIE = 'mf_session';
const MAX_AGE = 60 * 60 * 12; // 12 hours

export async function issueSession(cookies: Cookies): Promise<void> {
  const token = await new SignJWT({ role: 'operator' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(SECRET);
  cookies.set(COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    maxAge: MAX_AGE
  });
}

export function clearSession(cookies: Cookies): void {
  cookies.delete(COOKIE, { path: '/' });
}

export async function isAuthed(cookies: Cookies): Promise<boolean> {
  const token = cookies.get(COOKIE);
  if (!token) return false;
  try {
    await jwtVerify(token, SECRET);
    return true;
  } catch {
    return false;
  }
}
