import { useState } from 'react'
import { X, Phone, Package } from 'lucide-react'
import type { GiftWithCategory, SiteSettings } from '../../types/database'
import { supabase } from '../../lib/supabase'
import { formatWhatsApp, formatWhatsAppDisplay, formatCurrency, isValidBrazilianWhatsApp } from '../../utils/formatters'
import ReservationSuccessModal from './ReservationSuccessModal'

interface ReservationModalProps {
  gift: GiftWithCategory
  settings: SiteSettings
  onClose: () => void
  onSuccess: () => void
}

type ReservationType = 'bring_gift' | 'pix'

export default function ReservationModal({ gift, settings, onClose, onSuccess }: ReservationModalProps) {
  const [whatsapp, setWhatsapp] = useState('')
  const [whatsappDisplay, setWhatsappDisplay] = useState('')
  const [reservationType, setReservationType] = useState<ReservationType | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [reservationResult, setReservationResult] = useState<{
    reservationType: ReservationType
    whatsapp: string
  } | null>(null)

  function handleWhatsAppChange(value: string) {
    const cleaned = formatWhatsApp(value)
    if (cleaned.length <= 11) {
      setWhatsapp(cleaned)
      setWhatsappDisplay(formatWhatsAppDisplay(cleaned))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!isValidBrazilianWhatsApp(whatsapp)) {
      setError('Informe um WhatsApp válido com DDD.')
      return
    }

    if (!reservationType) {
      setError('Escolha como prefere presentear.')
      return
    }

    setLoading(true)

    try {
      const { data, error: rpcError } = await supabase.rpc('reserve_gift', {
        p_gift_id: gift.id,
        p_guest_whatsapp: whatsapp,
        p_reservation_type: reservationType,
      })

      if (rpcError) {
        throw new Error(rpcError.message)
      }

      const result = data as { success: boolean; error?: string }

      if (!result.success) {
        throw new Error(result.error || 'Erro ao reservar presente.')
      }

      setReservationResult({
        reservationType,
        whatsapp,
      })
      setShowSuccess(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao reservar presente.'
      if (message.toLowerCase().includes('esgotado') || message.toLowerCase().includes('disponível') || message.toLowerCase().includes('estoque') || message.toLowerCase().includes('sold out')) {
        setError('Esse presente acabou de ser reservado por outro convidado. Escolha outro presente da lista.')
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  if (showSuccess && reservationResult) {
    return (
      <ReservationSuccessModal
        gift={gift}
        settings={settings}
        reservationType={reservationResult.reservationType}
        whatsapp={reservationResult.whatsapp}
        onClose={() => {
          onSuccess()
          onClose()
        }}
      />
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full sm:max-w-lg animate-fade-in-scale glass-card rounded-t-2xl sm:rounded-lg overflow-hidden"
        style={{ maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '1.5rem',
              fontWeight: 400,
              color: '#e8e4dc',
            }}
          >
            Reservar presente
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: 'rgba(232,228,220,0.4)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {/* Gift info */}
          <div className="flex gap-4 p-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div
              className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              {gift.image_url ? (
                <img src={gift.image_url} alt={gift.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package size={28} style={{ color: 'rgba(255,255,255,0.15)' }} />
                </div>
              )}
            </div>
            <div>
              <p
                style={{
                  fontFamily: 'Jost, sans-serif',
                  fontSize: '0.65rem',
                  color: 'rgba(232,228,220,0.35)',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  marginBottom: '0.3rem',
                }}
              >
                {gift.gift_categories?.name || 'Presente'}
              </p>
              <h3
                style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: '1.3rem',
                  fontWeight: 500,
                  color: '#e8e4dc',
                  lineHeight: 1.2,
                }}
              >
                {gift.name}
              </h3>
              <p
                style={{
                  fontFamily: 'Jost, sans-serif',
                  fontSize: '0.8rem',
                  color: '#c9b48a',
                  marginTop: '0.3rem',
                }}
              >
                {gift.available_quantity} disponível{gift.available_quantity !== 1 ? 'is' : ''}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
            {/* WhatsApp field */}
            <div className="flex flex-col gap-2">
              <label
                style={{
                  fontFamily: 'Jost, sans-serif',
                  fontSize: '0.75rem',
                  color: 'rgba(232,228,220,0.5)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                Seu WhatsApp <span style={{ color: '#c9b48a' }}>*</span>
              </label>
              <div className="relative">
                <Phone
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'rgba(232,228,220,0.3)' }}
                />
                <input
                  type="tel"
                  value={whatsappDisplay}
                  onChange={(e) => handleWhatsAppChange(e.target.value)}
                  placeholder="(61) 99999-9999"
                  className="input-field"
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
              </div>
              <p
                style={{
                  fontFamily: 'Jost, sans-serif',
                  fontSize: '0.72rem',
                  color: 'rgba(232,228,220,0.3)',
                }}
              >
                O endereço do evento será enviado pelo WhatsApp após a reserva.
              </p>
            </div>

            {/* Reservation type */}
            <div className="flex flex-col gap-2">
              <label
                style={{
                  fontFamily: 'Jost, sans-serif',
                  fontSize: '0.75rem',
                  color: 'rgba(232,228,220,0.5)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                Como prefere presentear? <span style={{ color: '#c9b48a' }}>*</span>
              </label>
              <div className="flex flex-col gap-3">
                <label
                  className={`radio-option cursor-pointer ${reservationType === 'bring_gift' ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="reservationType"
                    value="bring_gift"
                    checked={reservationType === 'bring_gift'}
                    onChange={() => setReservationType('bring_gift')}
                    className="sr-only"
                  />
                  <div
                    className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                    style={{
                      borderColor: reservationType === 'bring_gift' ? '#c9b48a' : 'rgba(255,255,255,0.2)',
                    }}
                  >
                    {reservationType === 'bring_gift' && (
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: '#c9b48a' }}
                      />
                    )}
                  </div>
                  <div>
                    <p
                      style={{
                        fontFamily: 'Jost, sans-serif',
                        fontSize: '0.875rem',
                        color: '#e8e4dc',
                        fontWeight: 400,
                      }}
                    >
                      🎁 Vou levar o presente no dia
                    </p>
                    <p
                      style={{
                        fontFamily: 'Jost, sans-serif',
                        fontSize: '0.75rem',
                        color: 'rgba(232,228,220,0.4)',
                      }}
                    >
                      Levo fisicamente no evento
                    </p>
                  </div>
                </label>

                <label
                  className={`radio-option cursor-pointer ${reservationType === 'pix' ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="reservationType"
                    value="pix"
                    checked={reservationType === 'pix'}
                    onChange={() => setReservationType('pix')}
                    className="sr-only"
                  />
                  <div
                    className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                    style={{
                      borderColor: reservationType === 'pix' ? '#c9b48a' : 'rgba(255,255,255,0.2)',
                    }}
                  >
                    {reservationType === 'pix' && (
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: '#c9b48a' }}
                      />
                    )}
                  </div>
                  <div>
                    <p
                      style={{
                        fontFamily: 'Jost, sans-serif',
                        fontSize: '0.875rem',
                        color: '#e8e4dc',
                        fontWeight: 400,
                      }}
                    >
                      💸 Prefiro mandar Pix
                    </p>
                    <p
                      style={{
                        fontFamily: 'Jost, sans-serif',
                        fontSize: '0.75rem',
                        color: 'rgba(232,228,220,0.4)',
                      }}
                    >
                      {gift.suggested_pix_value ? `Valor sugerido: ${formatCurrency(gift.suggested_pix_value)}` : 'Valor livre'}
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="p-4 rounded"
                style={{
                  background: 'rgba(220, 38, 38, 0.1)',
                  border: '1px solid rgba(220, 38, 38, 0.2)',
                }}
              >
                <p
                  style={{
                    fontFamily: 'Jost, sans-serif',
                    fontSize: '0.85rem',
                    color: '#fca5a5',
                  }}
                >
                  {error}
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Reservando...' : 'Confirmar reserva'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
