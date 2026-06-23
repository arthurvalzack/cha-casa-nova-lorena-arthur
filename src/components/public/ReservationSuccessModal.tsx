import { useState } from 'react'
import { X, CheckCircle, Copy, Check } from 'lucide-react'
import type { GiftWithCategory, SiteSettings } from '../../types/database'
import { formatCurrency } from '../../utils/formatters'

interface ReservationSuccessModalProps {
  gift: GiftWithCategory
  settings: SiteSettings
  reservationType: 'bring_gift' | 'pix'
  whatsapp: string
  onClose: () => void
}

function formatWhatsAppDisplay(phone: string): string {
  const n = phone.replace(/\D/g, '')
  if (n.length <= 2) return n
  if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`
  if (n.length <= 11) return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7, 11)}`
}

export default function ReservationSuccessModal({
  gift,
  settings,
  reservationType,
  whatsapp,
  onClose,
}: ReservationSuccessModalProps) {
  const [copied, setCopied] = useState(false)

  function copyPixKey() {
    if (settings.pix_email) {
      navigator.clipboard.writeText(settings.pix_email).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
      })
    }
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
          <div className="flex items-center gap-3">
            <CheckCircle size={22} style={{ color: '#c9b48a' }} />
            <h2
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '1.4rem',
                fontWeight: 400,
                color: '#e8e4dc',
              }}
            >
              Presente reservado!
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: 'rgba(232,228,220,0.4)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-6 flex flex-col gap-6">
          {/* Success message */}
          <div className="text-center py-2">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(201,180,138,0.1)', border: '1px solid rgba(201,180,138,0.2)' }}
            >
              <span style={{ fontSize: '1.8rem' }}>🎉</span>
            </div>
            <h3
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '1.6rem',
                fontWeight: 400,
                color: '#e8e4dc',
                lineHeight: 1.2,
                marginBottom: '0.75rem',
              }}
            >
              Presente reservado com sucesso!
            </h3>
            <p
              style={{
                fontFamily: 'Jost, sans-serif',
                fontSize: '0.875rem',
                color: 'rgba(232,228,220,0.55)',
                lineHeight: 1.7,
              }}
            >
              {reservationType === 'bring_gift'
                ? 'Obrigado por fazer parte desse momento especial. Seu presente foi reservado e o endereço será enviado posteriormente pelo WhatsApp.'
                : 'Obrigado por fazer parte desse momento especial. Você pode fazer o Pix usando a chave abaixo.'}
            </p>
          </div>

          {/* WhatsApp */}
          <div
            className="p-4 rounded-lg flex items-center justify-between gap-3"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div>
              <p
                style={{
                  fontFamily: 'Jost, sans-serif',
                  fontSize: '0.65rem',
                  color: 'rgba(232,228,220,0.35)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: '0.2rem',
                }}
              >
                Seu WhatsApp
              </p>
              <p
                style={{
                  fontFamily: 'Jost, sans-serif',
                  fontSize: '0.95rem',
                  color: '#e8e4dc',
                }}
              >
                {formatWhatsAppDisplay(whatsapp)}
              </p>
            </div>
            <span style={{ fontSize: '1.2rem' }}>📱</span>
          </div>

          {/* PIX INFO - only show if pix */}
          {reservationType === 'pix' && (
            <div className="flex flex-col gap-4">
              <div
                className="p-4 rounded-lg"
                style={{
                  background: 'rgba(201,180,138,0.06)',
                  border: '1px solid rgba(201,180,138,0.15)',
                }}
              >
                <p
                  style={{
                    fontFamily: 'Jost, sans-serif',
                    fontSize: '0.65rem',
                    color: 'rgba(232,228,220,0.45)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    marginBottom: '0.5rem',
                  }}
                >
                  Chave Pix (e-mail)
                </p>
                <div className="flex items-center justify-between gap-3">
                  <p
                    style={{
                      fontFamily: 'Jost, sans-serif',
                      fontSize: '0.95rem',
                      color: '#c9b48a',
                      wordBreak: 'break-all',
                    }}
                  >
                    {settings.pix_email || '[Chave Pix não configurada]'}
                  </p>
                  {settings.pix_email && (
                    <button
                      onClick={copyPixKey}
                      className="flex-shrink-0 p-2 rounded transition-colors"
                      style={{
                        background: 'rgba(201,180,138,0.1)',
                        color: '#c9b48a',
                      }}
                      title="Copiar chave Pix"
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  )}
                </div>
              </div>

              {copied && (
                <p
                  style={{
                    fontFamily: 'Jost, sans-serif',
                    fontSize: '0.8rem',
                    color: '#c9b48a',
                    textAlign: 'center',
                  }}
                >
                  ✓ Chave copiada!
                </p>
              )}

              {gift.suggested_pix_value && gift.suggested_pix_value > 0 && (
                <div
                  className="p-4 rounded-lg flex items-center justify-between"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <p
                    style={{
                      fontFamily: 'Jost, sans-serif',
                      fontSize: '0.8rem',
                      color: 'rgba(232,228,220,0.5)',
                    }}
                  >
                    Valor sugerido para este presente
                  </p>
                  <p
                    style={{
                      fontFamily: 'Cormorant Garamond, serif',
                      fontSize: '1.3rem',
                      fontWeight: 500,
                      color: '#c9b48a',
                    }}
                  >
                    {formatCurrency(gift.suggested_pix_value)}
                  </p>
                </div>
              )}

              {/* QR Code */}
              {settings.pix_qr_code_url && (
                <div className="flex flex-col items-center gap-3">
                  <p
                    style={{
                      fontFamily: 'Jost, sans-serif',
                      fontSize: '0.75rem',
                      color: 'rgba(232,228,220,0.4)',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    QR Code Pix
                  </p>
                  <div
                    className="p-3 rounded-lg"
                    style={{ background: 'white' }}
                  >
                    <img
                      src={settings.pix_qr_code_url}
                      alt="QR Code Pix"
                      className="w-40 h-40 object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Thank you message */}
          <div
            className="text-center py-2"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '1.1rem',
                fontStyle: 'italic',
                color: 'rgba(232,228,220,0.5)',
              }}
            >
              {settings.thank_you_message || 'Obrigado por fazer parte desse momento tão especial para nós.'}
            </p>
            <p
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '1rem',
                color: '#c9b48a',
                marginTop: '0.5rem',
              }}
            >
              — Lorena & Arthur
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="btn-outline w-full"
          >
            Voltar para a lista
          </button>
        </div>
      </div>
    </div>
  )
}
