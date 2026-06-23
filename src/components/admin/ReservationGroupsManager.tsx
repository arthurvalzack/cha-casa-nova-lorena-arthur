import { useEffect, useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { formatDateTime } from '../../utils/formatters'
import type { Gift, GiftReservation } from '../../types/database'

type Status = GiftReservation['status']
type Reservation = Pick<GiftReservation, 'id' | 'gift_id' | 'reservation_group_id' | 'reservation_type' | 'status' | 'created_at'>
type ReservationGroup = { key: string; rows: Reservation[] }
const labels: Record<Status, string> = { reserved: 'Reservado', address_sent: 'Endereço enviado', pix_received: 'Pix recebido', delivered: 'Entregue', cancelled: 'Cancelado' }

export default function ReservationGroupsManager() {
  const [rows, setRows] = useState<Reservation[]>([]); const [gifts, setGifts] = useState<Gift[]>([]); const [loading, setLoading] = useState(true)
  const load = async () => {
    setLoading(true)
    const [reservationsResponse, giftsResponse] = await Promise.all([
      supabase.from('gift_reservations').select('id, gift_id, reservation_group_id, reservation_type, status, created_at').order('created_at', { ascending: false }),
      supabase.from('gifts').select('*'),
    ])
    if (reservationsResponse.error || giftsResponse.error) { console.error('Erro ao carregar reservas:', { reservationsError: reservationsResponse.error, giftsError: giftsResponse.error }); toast.error('Não foi possível carregar as reservas.'); setRows([]); setGifts([]) }
    else { setRows((reservationsResponse.data || []) as Reservation[]); setGifts((giftsResponse.data || []) as Gift[]) }
    setLoading(false)
  }
  useEffect(() => { load() }, [])
  const giftNames = useMemo(() => new Map(gifts.map((gift) => [gift.id, gift.name])), [gifts])
  const groups = useMemo<ReservationGroup[]>(() => Object.values(rows.reduce<Record<string, ReservationGroup>>((all, row) => { const key = row.reservation_group_id || row.id; (all[key] ||= { key, rows: [] }).rows.push(row); return all }, {})), [rows])
  const remove = async (row: Reservation, deleteMode: boolean) => {
    if (!confirm('Tem certeza que deseja remover esta reserva? A quantidade do presente será devolvida automaticamente.')) return
    try { const { data, error } = await supabase.rpc('cancel_reservation', { p_reservation_id: row.id, p_delete: deleteMode }); if (error) throw error; const result = data as { success: boolean; error?: string }; if (!result.success) throw new Error(result.error); setRows((current) => deleteMode ? current.filter((item) => item.id !== row.id) : current.map((item) => item.id === row.id ? { ...item, status: 'cancelled' } : item)); toast.success('Reserva removida e quantidade devolvida.') } catch (error) { console.error('Erro ao cancelar/excluir reserva:', error); toast.error('Não foi possível remover a reserva.') }
  }
  const status = async (row: Reservation, next: Status) => { if (next === 'cancelled') return remove(row, false); if (row.status === 'cancelled') return toast.error('Uma reserva cancelada não pode ser reativada.'); const { error } = await supabase.from('gift_reservations').update({ status: next, updated_at: new Date().toISOString() }).eq('id', row.id); if (error) return toast.error('Não foi possível atualizar a reserva.'); setRows((current) => current.map((item) => item.id === row.id ? { ...item, status: next } : item)); toast.success('Status atualizado.') }
  return <div className="flex flex-col gap-6"><div><h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', color: '#e8e4dc' }}>Reservas</h2><p style={{ color: 'rgba(232,228,220,.5)' }}>Presentes selecionados em cada reserva anônima.</p></div>{loading ? <p>Carregando...</p> : groups.length === 0 ? <p>Nenhuma reserva encontrada.</p> : <div className="flex flex-col gap-4">{groups.map((group) => <section key={group.key} className="glass-card rounded-lg p-5"><p className="text-xs uppercase tracking-wider" style={{ color: '#c9b48a' }}>{group.rows.length} presente{group.rows.length === 1 ? '' : 's'} selecionado{group.rows.length === 1 ? '' : 's'}</p><p className="mt-1 text-sm" style={{ color: 'rgba(232,228,220,.45)' }}>{formatDateTime(group.rows[0].created_at)} · {group.rows[0].reservation_type === 'pix' ? 'Pix' : 'Vai levar no dia'}</p><h3 className="mt-4 mb-2" style={{ color: '#e8e4dc' }}>{group.rows.length === 1 ? 'Presente' : 'Presentes selecionados'}</h3><div className="flex flex-col gap-2">{group.rows.map((row) => <div key={row.id} className="flex flex-col sm:flex-row sm:items-center gap-2 py-2" style={{ borderTop: '1px solid rgba(255,255,255,.06)' }}><div className="flex-1"><p style={{ color: '#e8e4dc' }}>{giftNames.get(row.gift_id) || 'Presente não encontrado'}</p><small style={{ color: 'rgba(232,228,220,.5)' }}>{labels[row.status]}</small></div><div className="flex gap-2"><select value={row.status} onChange={(event) => status(row, event.target.value as Status)} className="input-field" style={{ width: 'auto', fontSize: '.75rem', padding: '.4rem .6rem' }}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>{row.status !== 'cancelled' && <><button className="btn-outline" style={{ padding: '.4rem .65rem' }} onClick={() => remove(row, false)}>Cancelar</button><button className="p-2" onClick={() => remove(row, true)} title="Excluir teste"><Trash2 size={16} style={{ color: '#fca5a5' }} /></button></>}</div></div>)}</div></section>)}</div>}</div>
}
