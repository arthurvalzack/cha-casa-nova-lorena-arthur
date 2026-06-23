import { Package } from 'lucide-react'
import type { GiftWithCategory } from '../../types/database'
import { formatCurrency } from '../../utils/formatters'

interface GiftCardProps {
  gift: GiftWithCategory
  onReserve: (gift: GiftWithCategory) => void
}

export default function GiftCard({ gift, onReserve }: GiftCardProps) {
  const isAvailable = gift.available_quantity > 0

  return (
    <div
      className={`glass-card rounded-lg overflow-hidden flex flex-col transition-all duration-300 ${
        isAvailable ? 'glass-card-hover' : 'opacity-60'
      }`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-900">
        {gift.image_url ? (
          <img
            src={gift.image_url}
            alt={gift.name}
            className={`w-full h-full object-cover transition-transform duration-500 ${
              isAvailable ? 'hover:scale-105' : 'grayscale'
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package
              size={48}
              style={{ color: 'rgba(255,255,255,0.1)' }}
            />
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          {isAvailable ? (
            <span className="badge-available">Disponível</span>
          ) : (
            <span className="badge-reserved">Já reservado</span>
          )}
        </div>

        {/* Category badge */}
        {gift.gift_categories && (
          <div className="absolute top-3 right-3">
            <span
              style={{
                background: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(4px)',
                color: 'rgba(232,228,220,0.7)',
                fontFamily: 'Jost, sans-serif',
                fontSize: '0.6rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '0.2rem 0.5rem',
                borderRadius: '2px',
              }}
            >
              {gift.gift_categories.name}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div className="flex-1">
          <h3
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '1.3rem',
              fontWeight: 500,
              color: '#e8e4dc',
              lineHeight: 1.2,
              marginBottom: '0.4rem',
            }}
          >
            {gift.name}
          </h3>

          {gift.description && (
            <p
              style={{
                fontFamily: 'Jost, sans-serif',
                fontSize: '0.8rem',
                color: 'rgba(232,228,220,0.5)',
                lineHeight: 1.6,
              }}
            >
              {gift.description}
            </p>
          )}
        </div>

        {/* Stats */}
        <div
          className="flex items-center justify-between pt-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div>
            <p
              style={{
                fontFamily: 'Jost, sans-serif',
                fontSize: '0.65rem',
                color: 'rgba(232,228,220,0.35)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Disponível
            </p>
            <p
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '1.3rem',
                color: isAvailable ? '#c9b48a' : '#666',
                fontWeight: 500,
                lineHeight: 1,
              }}
            >
              {gift.available_quantity}
              <span
                style={{
                  fontSize: '0.85rem',
                  color: 'rgba(232,228,220,0.3)',
                  fontWeight: 400,
                }}
              >
                /{gift.desired_quantity}
              </span>
            </p>
          </div>

          {gift.suggested_pix_value && gift.suggested_pix_value > 0 && (
            <div className="text-right">
              <p
                style={{
                  fontFamily: 'Jost, sans-serif',
                  fontSize: '0.65rem',
                  color: 'rgba(232,228,220,0.35)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                Pix sugerido
              </p>
              <p
                style={{
                  fontFamily: 'Jost, sans-serif',
                  fontSize: '0.9rem',
                  color: 'rgba(232,228,220,0.6)',
                  fontWeight: 400,
                }}
              >
                {formatCurrency(gift.suggested_pix_value)}
              </p>
            </div>
          )}
        </div>

        {/* Button */}
        <button
          onClick={() => isAvailable && onReserve(gift)}
          disabled={!isAvailable}
          className={isAvailable ? 'btn-primary w-full text-center' : 'btn-outline w-full text-center opacity-40 cursor-not-allowed'}
          style={{ marginTop: '0.5rem' }}
        >
          {isAvailable ? 'Reservar presente' : 'Já reservado'}
        </button>
      </div>
    </div>
  )
}
