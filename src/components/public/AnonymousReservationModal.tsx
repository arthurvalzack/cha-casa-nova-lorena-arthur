import { useState } from 'react'
import { Package, X } from 'lucide-react'
import type { GiftWithCategory, SiteSettings } from '../../types/database'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../utils/formatters'
import AnonymousReservationSuccessModal from './AnonymousReservationSuccessModal'

interface Props { gift: GiftWithCategory; settings: SiteSettings; onClose: () => void; onSuccess: () => void }
type ReservationType = 'bring_gift' | 'pix'

export default function AnonymousReservationModal({ gift, settings, onClose, onSuccess }: Props) {
  const [reservationType, setReservationType] = useState<ReservationType | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(null)
    if (!reservationType) { setError('Escolha como deseja presentear.'); return }
    setLoading(true)
    try {
      const { data, error: rpcError } = await supabase.rpc('reserve_gift', { p_gift_id: gift.id, p_guest_whatsapp: null, p_reservation_type: reservationType })
      if (rpcError) throw rpcError
      const result = data as { success: boolean; error?: string }
      if (!result.success) throw new Error(result.error || 'Erro ao reservar presente.')
      setSuccess(true)
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Erro ao reservar presente.'
      setError(/esgotado|disponível|estoque/i.test(message) ? 'Esse presente acabou de ser reservado por outro convidado. Escolha outro presente.' : message)
    } finally { setLoading(false) }
  }

  if (success && reservationType) return <AnonymousReservationSuccessModal gift={gift} settings={settings} reservationType={reservationType} onClose={() => { onSuccess(); onClose() }} />
  return <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 modal-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
    <div className="w-full sm:max-w-lg animate-fade-in-scale glass-card rounded-t-2xl sm:rounded-lg overflow-hidden" style={{ maxHeight: '95vh' }}>
      <header className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}><h2 className="font-serif text-2xl" style={{ color: '#e8e4dc' }}>Reservar presente</h2><button onClick={onClose} className="p-2"><X size={20} /></button></header>
      <div className="p-6">
        <div className="flex gap-4 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'rgba(255,255,255,0.04)' }}>{gift.image_url ? <img src={gift.image_url} alt={gift.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package size={28} /></div>}</div>
          <div><p className="text-xs uppercase tracking-wider" style={{ color: 'rgba(232,228,220,0.45)' }}>{gift.gift_categories?.name || 'Sem categoria'}</p><h3 className="font-serif text-xl" style={{ color: '#e8e4dc' }}>{gift.name}</h3><p className="text-sm mt-1" style={{ color: '#c9b48a' }}>{gift.available_quantity} disponível{gift.available_quantity !== 1 ? 'is' : ''}{gift.suggested_pix_value !== null && gift.suggested_pix_value > 0 ? ` · ${formatCurrency(gift.suggested_pix_value)}` : ''}</p></div>
        </div>
        <form onSubmit={submit} className="pt-5 flex flex-col gap-4"><p className="text-sm" style={{ color: 'rgba(232,228,220,0.62)' }}>Escolha como deseja presentear Lorena & Arthur.</p>
          <label className={`radio-option ${reservationType === 'bring_gift' ? 'selected' : ''}`}><input className="sr-only" type="radio" name="type" checked={reservationType === 'bring_gift'} onChange={() => setReservationType('bring_gift')} /><div><p style={{ color: '#e8e4dc' }}>Vou levar o presente no dia</p><small style={{ color: 'rgba(232,228,220,0.45)' }}>Entregarei pessoalmente no evento.</small></div></label>
          <label className={`radio-option ${reservationType === 'pix' ? 'selected' : ''}`}><input className="sr-only" type="radio" name="type" checked={reservationType === 'pix'} onChange={() => setReservationType('pix')} /><div><p style={{ color: '#e8e4dc' }}>Prefiro mandar Pix</p><small style={{ color: 'rgba(232,228,220,0.45)' }}>Reservo o presente e faço o Pix depois.</small></div></label>
          {error && <p className="text-sm" style={{ color: '#fca5a5' }}>{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Reservando...' : 'Confirmar reserva'}</button>
        </form>
      </div>
    </div>
  </div>
}
