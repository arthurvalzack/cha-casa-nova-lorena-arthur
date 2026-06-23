import { useState } from 'react'
import { Package } from 'lucide-react'
import type { GiftWithCategory } from '../../types/database'
import { formatCurrency } from '../../utils/formatters'

interface LightGiftCardProps { gift: GiftWithCategory; inCart: boolean; onToggleCart: (gift: GiftWithCategory) => void }

export default function LightGiftCard({ gift, inCart, onToggleCart }: LightGiftCardProps) {
  const available = gift.available_quantity > 0
  const [imageFailed, setImageFailed] = useState(false)
  return <article className={`public-gift-card ${available ? '' : 'is-reserved'}`}>
    <div className="public-gift-image">{gift.image_url && !imageFailed ? <img src={gift.image_url} alt={gift.name} onError={() => setImageFailed(true)} /> : <div className="public-gift-fallback"><Package size={30} /><small>{gift.gift_categories?.name || gift.name}</small></div>}{!available && <span>Já reservado</span>}</div>
    <div className="public-gift-content">
      <p className="public-gift-category">{gift.gift_categories?.name || 'Sem categoria'}</p>
      <h3 title={gift.name}>{gift.name}</h3>
      {gift.suggested_pix_value !== null && gift.suggested_pix_value > 0 && <p className="public-gift-price">{formatCurrency(gift.suggested_pix_value)}</p>}
      {availableQuantityLabel(gift.available_quantity, available) && <p className="public-gift-stock">{availableQuantityLabel(gift.available_quantity, available)}</p>}
      <button type="button" disabled={!available} onClick={() => onToggleCart(gift)} className={inCart ? 'is-selected' : ''}>{available ? (inCart ? 'Selecionado' : 'Presentear') : 'Já reservado'}</button>
    </div>
  </article>
}

function availableQuantityLabel(quantity: number, available: boolean) {
  if (!available) return 'Esgotado'
  return quantity > 1 ? `${quantity} disponíveis` : null
}
