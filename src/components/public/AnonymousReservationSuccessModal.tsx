import { useState } from 'react'
import { Check, CheckCircle, Copy, X } from 'lucide-react'
import type { GiftWithCategory, SiteSettings } from '../../types/database'
import { formatCurrency } from '../../utils/formatters'

interface Props { gift: GiftWithCategory; settings: SiteSettings; reservationType: 'bring_gift' | 'pix'; onClose: () => void }

export default function AnonymousReservationSuccessModal({ gift, settings, reservationType, onClose }: Props) {
  const [copied, setCopied] = useState(false)
  const copyPix = async () => {
    if (!settings.pix_email) return
    await navigator.clipboard.writeText(settings.pix_email)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 modal-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
    <div className="w-full sm:max-w-lg animate-fade-in-scale glass-card rounded-t-2xl sm:rounded-lg overflow-hidden" style={{ maxHeight: '95vh' }}>
      <header className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3"><CheckCircle size={22} style={{ color: '#c9b48a' }} /><h2 className="font-serif text-2xl" style={{ color: '#e8e4dc' }}>Presente reservado!</h2></div>
        <button onClick={onClose} className="p-2"><X size={20} /></button>
      </header>
      <div className="p-6 flex flex-col gap-5 text-center">
        <h3 className="font-serif text-2xl" style={{ color: '#e8e4dc' }}>Presente reservado com sucesso!</h3>
        <p style={{ color: 'rgba(232,228,220,0.6)' }}>{reservationType === 'pix' ? 'Obrigado por fazer parte desse momento especial. Você pode fazer o Pix usando a chave abaixo.' : 'Obrigado por fazer parte desse momento especial. Sua reserva foi confirmada.'}</p>
        {reservationType === 'pix' && <div className="flex flex-col gap-4 text-left">
          <div className="p-4 rounded-lg" style={{ background: 'rgba(201,180,138,0.08)' }}>
            <p className="text-xs uppercase tracking-wider" style={{ color: 'rgba(232,228,220,0.5)' }}>Chave Pix</p>
            <div className="flex items-center gap-3 mt-2"><p className="flex-1 break-all" style={{ color: '#c9b48a' }}>{settings.pix_email || 'Chave Pix não configurada'}</p>{settings.pix_email && <button onClick={copyPix} className="p-2"><>{copied ? <Check size={18} /> : <Copy size={18} />}</></button>}</div>
          </div>
          {gift.suggested_pix_value !== null && gift.suggested_pix_value > 0 && <p style={{ color: 'rgba(232,228,220,0.7)' }}>Valor sugerido: <strong style={{ color: '#c9b48a' }}>{formatCurrency(gift.suggested_pix_value)}</strong></p>}
          {settings.pix_qr_code_url && <div className="flex flex-col items-center gap-2"><p className="text-xs uppercase tracking-wider" style={{ color: 'rgba(232,228,220,0.5)' }}>QR Code Pix</p><div className="bg-white p-3 rounded-lg"><img src={settings.pix_qr_code_url} alt="QR Code Pix" className="w-40 h-40 object-contain" /></div></div>}
        </div>}
        <button onClick={onClose} className="btn-outline w-full">Voltar para a lista</button>
      </div>
    </div>
  </div>
}
