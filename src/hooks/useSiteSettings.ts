import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { SiteSettings } from '../types/database'

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .maybeSingle()

      if (error) throw error
      if (!data) throw new Error('Configurações iniciais não encontradas. Execute o SQL do Supabase.')
      setSettings(data)
    } catch (err) {
      console.error('Erro ao carregar configurações do site:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar configurações')
      // Use defaults if no settings found
      setSettings({
        id: '',
        couple_name: 'Lorena & Arthur',
        event_name: 'Chá de Casa Nova',
        event_date: '2026-07-18T20:00:00.000Z',
        event_time_text: 'A partir das 17h',
        hero_image_url: null,
        couple_photo_url: null,
        main_message: 'Estamos começando uma nova fase das nossas vidas e será muito especial ter você fazendo parte desse momento. Escolha um presente da nossa lista e reserve com carinho. O endereço será enviado posteriormente pelo WhatsApp.',
        pix_email: null,
        pix_qr_code_url: null,
        thank_you_message: 'Obrigado por fazer parte desse momento tão especial para nós.',
        address_message: 'O endereço será enviado posteriormente pelo WhatsApp.',
        theme_primary_color: '#0b0b0f',
        theme_secondary_color: '#3f3f46',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }

  return { settings, loading, error, refetch: fetchSettings }
}
