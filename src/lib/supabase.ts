import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

const PLACEHOLDER_VALUES = ['placeholder', 'your_', 'seu_', 'sua_', 'changeme']

function isValidSupabaseUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname.endsWith('.supabase.co')
  } catch {
    return false
  }
}

function isPlaceholder(value: string) {
  const normalized = value.trim().toLowerCase()
  return !normalized || PLACEHOLDER_VALUES.some((placeholder) => normalized.includes(placeholder))
}

export const SUPABASE_CONFIGURATION_ERROR =
  'Supabase não configurado. Confira VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env e reinicie o npm run dev.'
export const STORAGE_BUCKET = 'wedding-gifts'
export const isSupabaseConfigured = isValidSupabaseUrl(supabaseUrl) && !isPlaceholder(supabaseAnonKey)

export function assertSupabaseConfigured() {
  if (!isSupabaseConfigured) throw new Error(SUPABASE_CONFIGURATION_ERROR)
}

export function getStorageErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '')
  if (/failed to fetch|networkerror|network request failed/i.test(message)) {
    return 'Não foi possível conectar ao Supabase Storage. Confira se VITE_SUPABASE_URL está correto, se o projeto Supabase está ativo e se o bucket wedding-gifts existe.'
  }
  if (/bucket.*not found|not found.*bucket/i.test(message)) {
    return 'O bucket wedding-gifts não existe. Execute supabase/schema.sql no SQL Editor do Supabase.'
  }
  if (/row-level security|policy|not authorized|unauthorized/i.test(message)) {
    return 'O Supabase bloqueou o upload pela policy do Storage. Execute novamente as policies do bucket wedding-gifts em supabase/schema.sql.'
  }
  return message || 'Não foi possível enviar a imagem. Tente novamente.'
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
)
