import { compare, hash } from 'bcryptjs'

export async function hashPassword(password: string): Promise<string> {
  return await hash(password, 10)
}

export async function verifyPassword(password: string, hashStr: string): Promise<boolean> {
  return await compare(password, hashStr)
}

export function generateToken(): string {
  return crypto.randomUUID()
}

export function getCookieOptions(expiresAt: number) {
  return {
    path: '/',
    secure: true,
    httpOnly: true,
    sameSite: 'Lax' as const,
    expires: new Date(expiresAt * 1000)
  }
}