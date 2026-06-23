import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Gift, Users, CheckSquare, Package, Smartphone, CreditCard, ShoppingBag } from 'lucide-react'
import { formatDateLong } from '../../utils/formatters'
import type { SiteSettings } from '../../types/database'

interface Stats {
  totalGifts: number
  availableGifts: number
  fullyReservedGifts: number
  totalReservations: number
  pixReservations: number
  bringGiftReservations: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    setLoading(true)
    try {
      const [giftsRes, reservationsRes, settingsRes] = await Promise.all([
        supabase.from('gifts').select('id, available_quantity, desired_quantity, is_active'),
        supabase.from('gift_reservations').select('id, guest_whatsapp, reservation_type, status'),
        supabase.from('site_settings').select('*').limit(1).maybeSingle(),
      ])

      type GiftRow = { id: string; available_quantity: number; desired_quantity: number; is_active: boolean }
      type ResvRow = { id: string; guest_whatsapp: string; reservation_type: string; status: string }

      const gifts = (giftsRes.data || []) as GiftRow[]
      const reservations = ((reservationsRes.data || []) as ResvRow[]).filter((r) => r.status !== 'cancelled')

      const totalGifts = gifts.filter((g) => g.is_active).length
      const availableGifts = gifts.filter((g) => g.is_active && g.available_quantity > 0).length
      const fullyReservedGifts = gifts.filter((g) => g.is_active && g.available_quantity === 0).length
      const totalReservations = reservations.length
      const pixReservations = reservations.filter((r) => r.reservation_type === 'pix').length
      const bringGiftReservations = reservations.filter((r) => r.reservation_type === 'bring_gift').length

      setStats({
        totalGifts,
        availableGifts,
        fullyReservedGifts,
        totalReservations,
        pixReservations,
        bringGiftReservations,
      })
      setSettings((settingsRes.data as SiteSettings | null) || null)
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const cards = stats
    ? [
        { label: 'Total de presentes', value: stats.totalGifts, icon: Gift, color: '#c9b48a' },
        { label: 'Disponíveis', value: stats.availableGifts, icon: Package, color: '#86efac' },
        { label: 'Totalmente reservados', value: stats.fullyReservedGifts, icon: CheckSquare, color: '#fca5a5' },
        { label: 'Total de reservas', value: stats.totalReservations, icon: ShoppingBag, color: '#c9b48a' },
        { label: 'Reservas anônimas', value: stats.totalReservations, icon: Smartphone, color: '#93c5fd' },
        { label: 'Reservas via Pix', value: stats.pixReservations, icon: CreditCard, color: '#d8b4fe' },
        { label: 'Levam presente no dia', value: stats.bringGiftReservations, icon: Users, color: '#fdba74' },
      ]
    : []

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2
          style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '2rem',
            fontWeight: 400,
            color: '#e8e4dc',
          }}
        >
          Dashboard
        </h2>
        <p
          style={{
            fontFamily: 'Jost, sans-serif',
            fontSize: '0.85rem',
            color: 'rgba(232,228,220,0.4)',
            marginTop: '0.25rem',
          }}
        >
          Visão geral do {settings?.event_name || 'Chá de Casa Nova'}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="glass-card rounded-lg p-5"
              style={{ height: '110px', opacity: 0.5 }}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className="glass-card rounded-lg p-5 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <p
                  style={{
                    fontFamily: 'Jost, sans-serif',
                    fontSize: '0.72rem',
                    color: 'rgba(232,228,220,0.4)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    lineHeight: 1.4,
                  }}
                >
                  {card.label}
                </p>
                <card.icon size={16} style={{ color: card.color, opacity: 0.7 }} />
              </div>
              <p
                style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: '2.5rem',
                  fontWeight: 300,
                  color: card.color,
                  lineHeight: 1,
                }}
              >
                {card.value}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className="glass-card rounded-lg p-6"
          style={{ border: '1px solid rgba(201,180,138,0.1)' }}
        >
          <h3
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '1.2rem',
              color: '#c9b48a',
              marginBottom: '0.75rem',
            }}
          >
            📅 Evento
          </h3>
          <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.85rem', color: 'rgba(232,228,220,0.6)', lineHeight: 1.7 }}>
            <strong style={{ color: '#e8e4dc' }}>Data:</strong> {settings?.event_date ? formatDateLong(settings.event_date) : '18 de julho de 2026'}<br />
            <strong style={{ color: '#e8e4dc' }}>Horário:</strong> {settings?.event_time_text || 'A partir das 17h'}<br />
            <strong style={{ color: '#e8e4dc' }}>Endereço:</strong> Enviar pelo WhatsApp
          </p>
        </div>

        <div
          className="glass-card rounded-lg p-6"
          style={{ border: '1px solid rgba(201,180,138,0.1)' }}
        >
          <h3
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '1.2rem',
              color: '#c9b48a',
              marginBottom: '0.75rem',
            }}
          >
            💡 Dica
          </h3>
          <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.85rem', color: 'rgba(232,228,220,0.6)', lineHeight: 1.7 }}>
            Use o menu lateral para gerenciar presentes, categorias, configurações do site e ver a lista de convidados para envio do endereço.
          </p>
        </div>
      </div>
    </div>
  )
}
