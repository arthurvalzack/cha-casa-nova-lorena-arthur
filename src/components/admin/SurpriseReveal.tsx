import { useState } from 'react'
import { Eye, EyeOff, AlertTriangle, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatDateTime, formatCurrency } from '../../utils/formatters'
import toast from 'react-hot-toast'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

const REVEAL_CODE = 'REVELAR SURPRESAS'

type Status = 'reserved' | 'address_sent' | 'pix_received' | 'delivered' | 'cancelled'

const STATUS_LABELS: Record<Status, string> = {
  reserved: 'Reservado',
  address_sent: 'Endereço enviado',
  pix_received: 'Pix recebido',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
}

const STATUS_COLORS: Record<Status, string> = {
  reserved: '#c9b48a',
  address_sent: '#93c5fd',
  pix_received: '#86efac',
  delivered: '#d8b4fe',
  cancelled: '#fca5a5',
}

type Reservation = {
  id: string
  gift_id: string
  guest_whatsapp: string
  reservation_type: 'bring_gift' | 'pix'
  status: Status
  created_at: string
  gifts: { id: string; name: string; suggested_pix_value: number | null; image_url: string | null } | null
}

function formatPhone(phone: string): string {
  const n = phone.replace(/\D/g, '')
  if (n.length <= 2) return n
  if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`
  if (n.length <= 11) return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7, 11)}`
}

export default function SurpriseReveal() {
  const [revealed, setRevealed] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(false)
  const [showPhones, setShowPhones] = useState<Record<string, boolean>>({})

  async function handleReveal() {
    if (code !== REVEAL_CODE) {
      setError(true)
      return
    }
    setError(false)
    setLoading(true)
    setRevealed(true)

    const { data } = await db
      .from('gift_reservations')
      .select('*, gifts(id, name, suggested_pix_value, image_url)')
      .order('created_at', { ascending: false })

    setReservations(data || [])
    setLoading(false)
  }

  function togglePhone(id: string) {
    setShowPhones((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  async function removeReservation(reservation: Reservation) {
    const needsExtraCare = reservation.status === 'pix_received' || reservation.status === 'delivered'
    const warning = needsExtraCare
      ? '\n\nEssa reserva já foi marcada como Pix recebido/entregue. Confirme com cuidado.'
      : ''
    if (!confirm(`Tem certeza que deseja remover esta reserva? A quantidade do presente será devolvida automaticamente.${warning}`)) return

    try {
      const { data, error } = await supabase.rpc('cancel_reservation', {
        p_reservation_id: reservation.id,
        p_delete: true,
      })
      if (error) throw error
      const result = data as { success: boolean; error?: string }
      if (!result.success) throw new Error(result.error || 'Erro ao remover reserva.')
      setReservations((previous) => previous.filter((item) => item.id !== reservation.id))
      toast.success('Reserva removida e quantidade devolvida.')
    } catch (error) {
      console.error('Erro ao cancelar/excluir reserva:', error)
      toast.error('Não foi possível remover a reserva.')
    }
  }

  if (!revealed) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 400, color: '#e8e4dc' }}>
            Revelar surpresas
          </h2>
          <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.85rem', color: 'rgba(232,228,220,0.4)', marginTop: '0.25rem' }}>
            Área restrita com detalhes dos presentes reservados
          </p>
        </div>

        <div
          className="glass-card rounded-lg p-8 max-w-lg mx-auto w-full"
          style={{ border: '1px solid rgba(220,38,38,0.15)' }}
        >
          {/* Warning */}
          <div
            className="flex items-start gap-3 p-4 rounded-lg mb-6"
            style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.15)' }}
          >
            <AlertTriangle size={18} style={{ color: '#fca5a5', flexShrink: 0, marginTop: '1px' }} />
            <div>
              <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.875rem', color: '#fca5a5', fontWeight: 500, marginBottom: '0.3rem' }}>
                Atenção: Área de surpresas
              </p>
              <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.8rem', color: 'rgba(248,113,113,0.7)', lineHeight: 1.6 }}>
                Essa área mostra quais presentes foram reservados e pode estragar a surpresa. Certifique-se de que deseja ver essas informações.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.72rem', color: 'rgba(232,228,220,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Digite o código de acesso
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(false) }}
                placeholder="REVELAR SURPRESAS"
                className="input-field text-center tracking-widest"
                style={{ textTransform: 'uppercase' }}
                onKeyDown={(e) => e.key === 'Enter' && handleReveal()}
              />
              {error && (
                <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.8rem', color: '#fca5a5' }}>
                  Código incorreto. Digite: REVELAR SURPRESAS
                </p>
              )}
            </div>

            <button
              onClick={handleReveal}
              className="btn-primary w-full"
              style={{ background: 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)', color: '#fca5a5' }}
            >
              🔓 Revelar surpresas
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 400, color: '#e8e4dc' }}>
            Surpresas reveladas
          </h2>
          <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.85rem', color: '#fca5a5', marginTop: '0.25rem' }}>
            ⚠️ {reservations.filter((r) => r.status !== 'cancelled').length} reserva{reservations.filter((r) => r.status !== 'cancelled').length !== 1 ? 's' : ''} ativa{reservations.filter((r) => r.status !== 'cancelled').length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setRevealed(false)}
          className="btn-outline"
          style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#fca5a5' }}
        >
          Ocultar
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(201,180,138,0.2)', borderTopColor: '#c9b48a' }} />
        </div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-20">
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', color: 'rgba(232,228,220,0.3)', fontStyle: 'italic' }}>
            Nenhuma reserva ainda.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reservations.map((r) => (
            <div
              key={r.id}
              className="glass-card rounded-lg p-4 flex gap-4"
              style={{
                opacity: r.status === 'cancelled' ? 0.5 : 1,
                border: '1px solid rgba(220,38,38,0.08)',
              }}
            >
              {/* Gift image */}
              {r.gifts?.image_url && (
                <div
                  className="w-14 h-14 rounded-lg flex-shrink-0 overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  <img src={r.gifts.image_url} alt={r.gifts?.name || ''} className="w-full h-full object-cover" />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {/* Phone with toggle */}
                  <button
                    onClick={() => togglePhone(r.id)}
                    className="anonymous-whatsapp-hidden flex items-center gap-1.5"
                    style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.9rem', color: '#e8e4dc', fontWeight: 500 }}
                  >
                    {showPhones[r.id] ? (
                      <>
                        <EyeOff size={14} style={{ color: 'rgba(232,228,220,0.4)' }} />
                        {formatPhone(r.guest_whatsapp)}
                      </>
                    ) : (
                      <>
                        <Eye size={14} style={{ color: 'rgba(232,228,220,0.4)' }} />
                        {'•'.repeat(8)}
                      </>
                    )}
                  </button>

                  <span
                    style={{
                      background: `${STATUS_COLORS[r.status]}15`,
                      color: STATUS_COLORS[r.status],
                      border: `1px solid ${STATUS_COLORS[r.status]}30`,
                      fontFamily: 'Jost, sans-serif',
                      fontSize: '0.62rem',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '2px',
                    }}
                  >
                    {STATUS_LABELS[r.status]}
                  </span>
                  <span
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      color: 'rgba(232,228,220,0.5)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      fontFamily: 'Jost, sans-serif',
                      fontSize: '0.62rem',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '2px',
                    }}
                  >
                    {r.reservation_type === 'pix' ? '💸 Pix' : '🎁 Levar no dia'}
                  </span>
                </div>

                {/* Gift info */}
                <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.9rem', color: '#c9b48a' }}>
                  🎁 {r.gifts?.name || 'Presente removido'}
                  {r.gifts?.suggested_pix_value ? ` · ${formatCurrency(r.gifts.suggested_pix_value)}` : ''}
                </p>

                <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.72rem', color: 'rgba(232,228,220,0.3)', marginTop: '0.25rem' }}>
                  {formatDateTime(r.created_at)}
                </p>
              </div>
              {r.status !== 'cancelled' && (
                <button
                  onClick={() => removeReservation(r)}
                  className="p-2 rounded-lg hover:bg-red-900/20 transition-colors self-start"
                  title="Excluir teste e devolver quantidade"
                  style={{ color: '#fca5a5' }}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
