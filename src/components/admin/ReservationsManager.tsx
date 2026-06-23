import { useState, useEffect } from 'react'
import { Copy, Check, MessageCircle, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatDateTime, openWhatsApp } from '../../utils/formatters'
import toast from 'react-hot-toast'
import type { GiftReservation } from '../../types/database'

type Status = GiftReservation['status']
type ReservationType = GiftReservation['reservation_type']

type Reservation = Pick<GiftReservation, 'id' | 'guest_whatsapp' | 'reservation_type' | 'status' | 'created_at'>

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

function formatPhone(phone: string): string {
  const n = phone.replace(/\D/g, '')
  if (n.length <= 2) return n
  if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`
  if (n.length <= 11) return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7, 11)}`
}

const ADDRESS_MESSAGE = 'Olá! Obrigado por confirmar sua presença no Chá de Casa Nova de Lorena e Arthur. O endereço do evento será enviado aqui. Esperamos você no dia 18/07/2026 a partir das 17h. 🏡✨'

export default function ReservationsManager() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all')
  const [filterType, setFilterType] = useState<'all' | ReservationType>('all')

  useEffect(() => {
    fetchReservations()
  }, [])

  async function fetchReservations() {
    setLoading(true)
    const { data, error } = await supabase
      .from('gift_reservations')
      .select('id, guest_whatsapp, reservation_type, status, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      toast.error(error.message)
      setReservations([])
    } else {
      setReservations((data || []) as Reservation[])
    }
    setLoading(false)
  }

  async function updateStatus(reservation: Reservation, status: Status) {
    if (reservation.status === status) return

    if (reservation.status === 'cancelled' && status !== 'cancelled') {
      toast.error('Reserva cancelada não deve ser reativada. Peça para o convidado reservar novamente.')
      return
    }

    try {
      if (status === 'cancelled') {
        const confirmed = confirm('Cancelar esta reserva? A quantidade do presente será devolvida automaticamente.')
        if (!confirmed) return

        const { data, error } = await supabase.rpc('cancel_reservation', {
          p_reservation_id: reservation.id,
        })

        if (error) throw error
        const result = data as { success: boolean; error?: string }
        if (!result.success) throw new Error(result.error || 'Erro ao cancelar reserva.')
      } else {
        const { error } = await supabase
          .from('gift_reservations')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', reservation.id)
        if (error) throw error
      }

      setReservations((prev) => prev.map((r) => r.id === reservation.id ? { ...r, status } : r))
      toast.success(status === 'cancelled' ? 'Reserva cancelada e quantidade devolvida!' : 'Status atualizado!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar status.')
    }
  }

  async function removeReservation(reservation: Reservation, deleteMode: boolean) {
    const needsExtraCare = reservation.status === 'pix_received' || reservation.status === 'delivered'
    const warning = needsExtraCare
      ? '\n\nEssa reserva já foi marcada como Pix recebido/entregue. Confirme com cuidado.'
      : ''
    const confirmed = confirm(`Tem certeza que deseja remover esta reserva? A quantidade do presente será devolvida automaticamente.${warning}`)
    if (!confirmed) return

    try {
      const { data, error } = await supabase.rpc('cancel_reservation', {
        p_reservation_id: reservation.id,
        p_delete: deleteMode,
      })
      if (error) throw error
      const result = data as { success: boolean; error?: string }
      if (!result.success) throw new Error(result.error || 'Erro ao cancelar reserva.')

      if (deleteMode) {
        setReservations((previous) => previous.filter((item) => item.id !== reservation.id))
      } else {
        setReservations((previous) => previous.map((item) => item.id === reservation.id ? { ...item, status: 'cancelled' } : item))
      }
      toast.success('Reserva removida e quantidade devolvida.')
    } catch (error) {
      console.error('Erro ao cancelar/excluir reserva:', error)
      toast.error('Não foi possível remover a reserva.')
    }
  }

  function copyPhone(phone: string, id: string) {
    navigator.clipboard.writeText(phone).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
      toast.success('WhatsApp copiado!')
    })
  }

  function sendWhatsApp(phone: string) {
    openWhatsApp(phone, ADDRESS_MESSAGE)
  }

  const filtered = reservations.filter((r) => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false
    if (filterType !== 'all' && r.reservation_type !== filterType) return false
    return true
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 400, color: '#e8e4dc' }}>
          Convidados para enviar endereço
        </h2>
        <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.85rem', color: 'rgba(232,228,220,0.4)', marginTop: '0.25rem' }}>
          {reservations.filter((r) => r.status !== 'cancelled').length} reserva{reservations.filter((r) => r.status !== 'cancelled').length !== 1 ? 's' : ''} ativa{reservations.filter((r) => r.status !== 'cancelled').length !== 1 ? 's' : ''}
        </p>
      </div>

      <div
        className="rounded-lg p-4"
        style={{ background: 'rgba(201,180,138,0.06)', border: '1px solid rgba(201,180,138,0.12)' }}
      >
        <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.8rem', color: 'rgba(232,228,220,0.58)', lineHeight: 1.6 }}>
          Modo surpresa ativo: esta tela mostra WhatsApp, tipo e status, mas não mostra qual presente foi reservado. Para ver os presentes, use “Revelar surpresas”.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <label style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.65rem', color: 'rgba(232,228,220,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Status
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as Status | 'all')}
            className="input-field"
            style={{ width: 'auto', fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
          >
            <option value="all">Todos</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.65rem', color: 'rgba(232,228,220,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Tipo
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | ReservationType)}
            className="input-field"
            style={{ width: 'auto', fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
          >
            <option value="all">Todos</option>
            <option value="bring_gift">Levar no dia</option>
            <option value="pix">Pix</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(201,180,138,0.2)', borderTopColor: '#c9b48a' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', color: 'rgba(232,228,220,0.3)', fontStyle: 'italic' }}>
            Nenhum convidado encontrado.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="glass-card rounded-lg p-4"
              style={{ opacity: r.status === 'cancelled' ? 0.5 : 1 }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '1rem', color: '#e8e4dc', fontWeight: 500 }}>
                      {formatPhone(r.guest_whatsapp || '')}
                    </p>
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
                  <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.75rem', color: 'rgba(232,228,220,0.3)' }}>
                    {formatDateTime(r.created_at)}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => copyPhone(r.guest_whatsapp || '', r.id)}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-1.5"
                    title="Copiar WhatsApp"
                    style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.72rem', color: 'rgba(232,228,220,0.5)' }}
                  >
                    {copiedId === r.id ? <Check size={14} style={{ color: '#86efac' }} /> : <Copy size={14} />}
                    <span className="hidden sm:inline">Copiar</span>
                  </button>

                  <button
                    onClick={() => r.guest_whatsapp && sendWhatsApp(r.guest_whatsapp)}
                    className="p-2 rounded-lg hover:bg-green-900/20 transition-colors flex items-center gap-1.5"
                    title="Abrir WhatsApp"
                    style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.72rem', color: '#86efac' }}
                  >
                    <MessageCircle size={14} />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </button>

                  {r.status !== 'cancelled' && (
                    <>
                      <button
                        onClick={() => removeReservation(r, false)}
                        className="p-2 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-1.5"
                        title="Cancelar reserva e devolver quantidade"
                        style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.72rem', color: '#fca5a5' }}
                      >
                        <span className="hidden sm:inline">Cancelar reserva</span>
                      </button>
                      <button
                        onClick={() => removeReservation(r, true)}
                        className="p-2 rounded-lg hover:bg-red-900/20 transition-colors flex items-center gap-1.5"
                        title="Excluir teste e devolver quantidade"
                        style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.72rem', color: '#fca5a5' }}
                      >
                        <Trash2 size={14} />
                        <span className="hidden sm:inline">Excluir teste</span>
                      </button>
                    </>
                  )}

                  <select
                    value={r.status}
                    onChange={(e) => updateStatus(r, e.target.value as Status)}
                    className="input-field"
                    style={{ width: 'auto', fontSize: '0.75rem', padding: '0.4rem 0.6rem', color: STATUS_COLORS[r.status] }}
                  >
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
