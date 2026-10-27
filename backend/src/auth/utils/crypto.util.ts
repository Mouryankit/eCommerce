import {
  scryptSync,
  randomBytes,
  timingSafeEqual,
  createHmac,
} from 'node:crypto';
import { UnauthorizedException } from '@nestjs/common';
import type { UserRole } from '../../user/entity/user.entity.js';

export interface JwtPayload {
  sub: number;
  email: string;
  name: string;
  role: UserRole;
  exp: number;
  iat: number;
}

/**
 * OWASP scrypt password hashing
 */
export function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString('hex');
}

/**
 * Cryptographically random 16-byte salt generator
 */
export function generateSalt(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Constant-time password verification to prevent timing attacks
 */
export function verifyPassword(password: string, salt: string, hash: string): boolean {
  const inputHash = hashPassword(password, salt);
  try {
    return timingSafeEqual(
      Buffer.from(inputHash, 'hex'),
      Buffer.from(hash, 'hex'),
    );
  } catch {
    return false;
  }
}

/**
 * RFC 7519 HMAC-SHA256 JWT Signing
 */
export function signJwt(
  payload: Omit<JwtPayload, 'iat' | 'exp'>,
  jwtSecret: string,
  expiresInSeconds: number = 7 * 24 * 3600
): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expiresInSeconds;
  const fullPayload: JwtPayload = { ...payload, iat, exp };

  const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const b64Payload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = createHmac('sha256', jwtSecret)
    .update(`${b64Header}.${b64Payload}`)
    .digest('base64url');

  return `${b64Header}.${b64Payload}.${signature}`;
}

/**
 * RFC 7519 HMAC-SHA256 JWT Verification
 */
export function verifyJwt(token: string, jwtSecret: string): JwtPayload {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new UnauthorizedException('Malformed authentication token');
  }

  const [b64Header, b64Payload, signature] = parts;
  const expectedSignature = createHmac('sha256', jwtSecret)
    .update(`${b64Header}.${b64Payload}`)
    .digest('base64url');

  let isValid = false;
  try {
    isValid = timingSafeEqual(
      Buffer.from(signature, 'utf8'),
      Buffer.from(expectedSignature, 'utf8'),
    );
  } catch {
    isValid = false;
  }

  if (!isValid) {
    throw new UnauthorizedException('Invalid token signature');
  }

  const payload: JwtPayload = JSON.parse(
    Buffer.from(b64Payload, 'base64url').toString('utf8'),
  );

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new UnauthorizedException('Authentication token has expired');
  }

  return payload;
}
