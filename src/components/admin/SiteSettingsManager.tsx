import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { SiteSettings } from '../../types/database'
import ImageUpload from './ImageUpload'
import toast from 'react-hot-toast'
import { fromDateTimeLocalInputValue, toDateTimeLocalInputValue } from '../../utils/formatters'

export default function SiteSettingsManager() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    const { data } = await supabase.from('site_settings').select('*').single()
    setSettings(data)
    setLoading(false)
  }

  function handleChange(field: keyof SiteSettings, value: string) {
    if (!settings) return
    setSettings({ ...settings, [field]: value })
  }

  async function handleSave() {
    if (!settings) return
    setSaving(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('site_settings')
        .update({
          couple_name: settings.couple_name,
          event_name: settings.event_name,
          event_date: settings.event_date,
          event_time_text: settings.event_time_text,
          hero_image_url: settings.hero_image_url,
          couple_photo_url: settings.couple_photo_url,
          main_message: settings.main_message,
          pix_email: settings.pix_email,
          pix_qr_code_url: settings.pix_qr_code_url,
          thank_you_message: settings.thank_you_message,
          address_message: settings.address_message,
          theme_primary_color: settings.theme_primary_color,
          theme_secondary_color: settings.theme_secondary_color,
          updated_at: new Date().toISOString(),
        })
        .eq('id', settings.id)

      if (error) throw error
      toast.success('Configurações salvas!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(201,180,138,0.2)', borderTopColor: '#c9b48a' }} />
      </div>
    )
  }



  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 400, color: '#e8e4dc' }}>
            Configurações do site
          </h2>
          <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.85rem', color: 'rgba(232,228,220,0.4)', marginTop: '0.25rem' }}>
            Edite textos, imagens e informações do evento
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          <Save size={16} />
          {saving ? 'Salvando...' : 'Salvar tudo'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evento */}
        <div className="glass-card rounded-lg p-6 flex flex-col gap-5">
          <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', color: '#c9b48a' }}>
            Informações do evento
          </h3>

          <Field label="Nome do casal">
            <input
              type="text"
              value={settings.couple_name}
              onChange={(e) => handleChange('couple_name', e.target.value)}
              className="input-field"
            />
          </Field>

          <Field label="Nome do evento">
            <input
              type="text"
              value={settings.event_name}
              onChange={(e) => handleChange('event_name', e.target.value)}
              className="input-field"
            />
          </Field>

          <Field label="Data do evento">
            <input
              type="datetime-local"
              value={toDateTimeLocalInputValue(settings.event_date)}
              onChange={(e) => handleChange('event_date', fromDateTimeLocalInputValue(e.target.value))}
              className="input-field"
            />
          </Field>

          <Field label="Texto do horário">
            <input
              type="text"
              value={settings.event_time_text || ''}
              onChange={(e) => handleChange('event_time_text', e.target.value)}
              placeholder="A partir das 17h"
              className="input-field"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Cor principal">
              <input
                type="color"
                value={settings.theme_primary_color || '#0b0b0f'}
                onChange={(e) => handleChange('theme_primary_color', e.target.value)}
                className="input-field h-12 p-2"
              />
            </Field>

            <Field label="Cor secundária">
              <input
                type="color"
                value={settings.theme_secondary_color || '#3f3f46'}
                onChange={(e) => handleChange('theme_secondary_color', e.target.value)}
                className="input-field h-12 p-2"
              />
            </Field>
          </div>
        </div>

        {/* PIX */}
        <div className="glass-card rounded-lg p-6 flex flex-col gap-5">
          <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', color: '#c9b48a' }}>
            Informações de Pix
          </h3>

          <Field label="Chave Pix (e-mail)">
            <input
              type="email"
              value={settings.pix_email || ''}
              onChange={(e) => handleChange('pix_email', e.target.value)}
              placeholder="exemplo@email.com"
              className="input-field"
            />
          </Field>

          <ImageUpload
            currentUrl={settings.pix_qr_code_url}
            folder="qrcode"
            onUpload={(url) => handleChange('pix_qr_code_url', url)}
            label="QR Code Pix"
          />
        </div>

        {/* Mensagens */}
        <div className="glass-card rounded-lg p-6 flex flex-col gap-5 lg:col-span-2">
          <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', color: '#c9b48a' }}>
            Mensagens
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Field label="Mensagem principal">
              <textarea
                value={settings.main_message || ''}
                onChange={(e) => handleChange('main_message', e.target.value)}
                rows={5}
                className="input-field resize-none"
              />
            </Field>

            <Field label="Mensagem de agradecimento">
              <textarea
                value={settings.thank_you_message || ''}
                onChange={(e) => handleChange('thank_you_message', e.target.value)}
                rows={5}
                className="input-field resize-none"
              />
            </Field>

            <Field label="Mensagem sobre endereço">
              <textarea
                value={settings.address_message || ''}
                onChange={(e) => handleChange('address_message', e.target.value)}
                rows={3}
                className="input-field resize-none"
              />
            </Field>
          </div>
        </div>

        {/* Imagens */}
        <div className="glass-card rounded-lg p-6 flex flex-col gap-5 lg:col-span-2">
          <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', color: '#c9b48a' }}>
            Imagens
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ImageUpload
              currentUrl={settings.hero_image_url}
              folder="hero"
              onUpload={(url) => handleChange('hero_image_url', url)}
              label="Imagem de capa (hero)"
            />

            <ImageUpload
              currentUrl={settings.couple_photo_url}
              folder="couple"
              onUpload={(url) => handleChange('couple_photo_url', url)}
              label="Foto do casal"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          <Save size={16} />
          {saving ? 'Salvando...' : 'Salvar configurações'}
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label
        style={{
          fontFamily: 'Jost, sans-serif',
          fontSize: '0.72rem',
          color: 'rgba(232,228,220,0.4)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}
