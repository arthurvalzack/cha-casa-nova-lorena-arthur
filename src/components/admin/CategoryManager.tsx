import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Eye, EyeOff, Save, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { GiftCategory } from '../../types/database'
import toast from 'react-hot-toast'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export default function CategoryManager() {
  const [categories, setCategories] = useState<GiftCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formOrder, setFormOrder] = useState(0)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    setLoading(true)
    const { data } = await db.from('gift_categories').select('*').order('sort_order').order('name')
    setCategories(data || [])
    setLoading(false)
  }

  function openCreate() {
    setFormName('')
    setFormOrder(categories.length)
    setEditingId(null)
    setShowForm(true)
  }

  function openEdit(cat: GiftCategory) {
    setFormName(cat.name)
    setFormOrder(cat.sort_order)
    setEditingId(cat.id)
    setShowForm(true)
  }

  async function handleSave() {
    if (!formName.trim()) {
      toast.error('Nome é obrigatório.')
      return
    }

    const slug = formName
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    setSaving(true)
    try {
      if (editingId) {
        const { error } = await db
          .from('gift_categories')
          .update({ name: formName.trim(), slug, sort_order: formOrder, updated_at: new Date().toISOString() })
          .eq('id', editingId)
        if (error) throw error
        toast.success('Categoria atualizada!')
      } else {
        const { error } = await db
          .from('gift_categories')
          .insert({ name: formName.trim(), slug, sort_order: formOrder })
        if (error) throw error
        toast.success('Categoria criada!')
      }
      setShowForm(false)
      fetchCategories()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(cat: GiftCategory) {
    await db.from('gift_categories').update({ is_active: !cat.is_active }).eq('id', cat.id)
    fetchCategories()
  }

  async function handleDelete(cat: GiftCategory) {
    if (!confirm(`Excluir categoria "${cat.name}"?`)) return
    const { error } = await db.from('gift_categories').delete().eq('id', cat.id)
    if (error) {
      toast.error('Erro ao excluir. A categoria pode ter presentes vinculados.')
    } else {
      toast.success('Categoria excluída!')
      fetchCategories()
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 400, color: '#e8e4dc' }}>
            Categorias
          </h2>
          <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.85rem', color: 'rgba(232,228,220,0.4)', marginTop: '0.25rem' }}>
            {categories.length} categoria{categories.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          Nova categoria
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
          <div className="w-full max-w-sm glass-card rounded-lg overflow-hidden animate-fade-in-scale">
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: '#e8e4dc' }}>
                {editingId ? 'Editar categoria' : 'Nova categoria'}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white/5 rounded-lg">
                <X size={20} style={{ color: 'rgba(232,228,220,0.4)' }} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.72rem', color: 'rgba(232,228,220,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Nome *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="input-field"
                  placeholder="Ex: Cozinha"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-2">
                <label style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.72rem', color: 'rgba(232,228,220,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Ordem
                </label>
                <input
                  type="number"
                  value={formOrder}
                  onChange={(e) => setFormOrder(Number(e.target.value))}
                  className="input-field"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="btn-outline">
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
                  <Save size={16} />
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(201,180,138,0.2)', borderTopColor: '#c9b48a' }} />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="glass-card rounded-lg px-5 py-4 flex items-center justify-between gap-4"
              style={{ opacity: cat.is_active ? 1 : 0.5 }}
            >
              <div className="flex items-center gap-3">
                <span style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.7rem', color: 'rgba(232,228,220,0.25)' }}>
                  #{cat.sort_order}
                </span>
                <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.95rem', color: '#e8e4dc' }}>
                  {cat.name}
                </p>
                {!cat.is_active && (
                  <span className="badge-reserved" style={{ fontSize: '0.6rem' }}>Inativa</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggle(cat)}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  {cat.is_active
                    ? <Eye size={16} style={{ color: '#c9b48a' }} />
                    : <EyeOff size={16} style={{ color: 'rgba(232,228,220,0.3)' }} />
                  }
                </button>
                <button
                  onClick={() => openEdit(cat)}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <Edit2 size={16} style={{ color: 'rgba(232,228,220,0.5)' }} />
                </button>
                <button
                  onClick={() => handleDelete(cat)}
                  className="p-2 rounded-lg hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 size={16} style={{ color: 'rgba(248,113,113,0.5)' }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
