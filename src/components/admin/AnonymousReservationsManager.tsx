import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { formatDateTime } from '../../utils/formatters'
import type { GiftReservation } from '../../types/database'

type Status = GiftReservation['status']
type Reservation = Pick<GiftReservation, 'id' | 'reservation_type' | 'status' | 'created_at'>
const labels: Record<Status, string> = { reserved: 'Reservado', address_sent: 'Endereço enviado', pix_received: 'Pix recebido', delivered: 'Entregue', cancelled: 'Cancelado' }

export default function AnonymousReservationsManager() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Status | 'all'>('all')
  const loadReservations = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('gift_reservations').select('id, reservation_type, status, created_at').order('created_at', { ascending: false })
    if (error) { console.error('Erro ao carregar reservas:', error); toast.error('Não foi possível carregar as reservas.'); setReservations([]) } else setReservations((data || []) as Reservation[])
    setLoading(false)
  }
  useEffect(() => { loadReservations() }, [])

  const removeReservation = async (reservation: Reservation, deleteMode: boolean) => {
    const careful = reservation.status === 'pix_received' || reservation.status === 'delivered'
    if (!confirm(`Tem certeza que deseja remover esta reserva? A quantidade do presente será devolvida automaticamente.${careful ? '\n\nEssa reserva já foi marcada como Pix recebido/entregue. Confirme com cuidado.' : ''}`)) return
    try {
      const { data, error } = await supabase.rpc('cancel_reservation', { p_reservation_id: reservation.id, p_delete: deleteMode })
      if (error) throw error
      const result = data as { success: boolean; error?: string }
      if (!result.success) throw new Error(result.error || 'Erro ao remover reserva.')
      setReservations((current) => deleteMode ? current.filter((item) => item.id !== reservation.id) : current.map((item) => item.id === reservation.id ? { ...item, status: 'cancelled' } : item))
      toast.success('Reserva removida e quantidade devolvida.')
    } catch (error) { console.error('Erro ao cancelar/excluir reserva:', error); toast.error('Não foi possível remover a reserva.') }
  }

  const updateStatus = async (reservation: Reservation, status: Status) => {
    if (status === 'cancelled') return removeReservation(reservation, false)
    if (reservation.status === 'cancelled') return toast.error('Uma reserva cancelada não pode ser reativada.')
    const { error } = await supabase.from('gift_reservations').update({ status, updated_at: new Date().toISOString() }).eq('id', reservation.id)
    if (error) { toast.error('Não foi possível atualizar a reserva.'); return }
    setReservations((current) => current.map((item) => item.id === reservation.id ? { ...item, status } : item))
    toast.success('Status atualizado.')
  }

  const filtered = filter === 'all' ? reservations : reservations.filter((reservation) => reservation.status === filter)
  return <div className="flex flex-col gap-6">
    <div><h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', color: '#e8e4dc' }}>Reservas anônimas</h2><p style={{ color: 'rgba(232,228,220,.4)', fontSize: '.85rem' }}>{reservations.filter((item) => item.status !== 'cancelled').length} reserva(s) ativa(s)</p></div>
    <div><select value={filter} onChange={(event) => setFilter(event.target.value as Status | 'all')} className="input-field" style={{ width: 'auto' }}><option value="all">Todos os status</option>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
    {loading ? <div className="py-20 text-center">Carregando...</div> : filtered.length === 0 ? <div className="py-20 text-center">Nenhuma reserva encontrada.</div> : <div className="flex flex-col gap-3">{filtered.map((reservation) => <article key={reservation.id} className="glass-card rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-4" style={{ opacity: reservation.status === 'cancelled' ? .55 : 1 }}>
      <div className="flex-1"><p style={{ color: '#e8e4dc' }}>{reservation.reservation_type === 'pix' ? 'Pix' : 'Vai levar no dia'} · {labels[reservation.status]}</p><p className="text-xs mt-1" style={{ color: 'rgba(232,228,220,.4)' }}>{formatDateTime(reservation.created_at)}</p></div>
      <div className="flex items-center gap-2"><select value={reservation.status} onChange={(event) => updateStatus(reservation, event.target.value as Status)} className="input-field" style={{ width: 'auto', fontSize: '.75rem', padding: '.4rem .6rem' }}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>{reservation.status !== 'cancelled' && <><button onClick={() => removeReservation(reservation, false)} className="btn-outline" style={{ padding: '.45rem .7rem' }}>Cancelar</button><button onClick={() => removeReservation(reservation, true)} className="p-2" title="Excluir teste"><Trash2 size={16} style={{ color: '#fca5a5' }} /></button></>}</div>
    </article>)}</div>}
  </div>
}
