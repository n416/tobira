export interface Env {
  DB: D1Database
  RESEND_API_KEY?: string
}

export interface User {
  id: string
  email: string
  password_hash: string
  group_id: string | null
  created_at: number
  updated_at: number
}

export interface App {
  id: string
  name: string
  base_url: string
  status: string // 'active' | 'inactive'
  created_at: number
}

export interface Session {
  id: string
  user_id: string
  expires_at: number
}

export interface Permission {
  id: number
  user_id?: string
  group_id?: string
  app_id: string
  valid_from: number
  valid_to: number
  created_at: number
}

export interface Group {
  id: string
  name: string
  created_at: number
}

export interface AuthCode {
  code: string
  user_id: string
  app_id: string
  expires_at: number
  used_at?: number
}
