import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Eye, EyeOff, Save, X, Download } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Gift, GiftCategory } from '../../types/database'
import ImageUpload from './ImageUpload'
import toast from 'react-hot-toast'
import { formatCurrency } from '../../utils/formatters'
import { defaultGiftCategories, defaultGifts } from '../../data/defaultGifts'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

type GiftWithCat = Gift & { gift_categories: GiftCategory | null }

const emptyForm = {
  name: '',
  description: '',
  category_id: '',
  image_url: '',
  desired_quantity: 1,
  available_quantity: 1,
  suggested_pix_value: '',
  sort_order: 0,
  is_active: true,
}

export default function GiftManager() {
  const [gifts, setGifts] = useState<GiftWithCat[]>([])
  const [categories, setCategories] = useState<GiftCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const [giftsRes, catRes] = await Promise.all([
      db.from('gifts').select('*').order('sort_order').order('name'),
      db.from('gift_categories').select('*').eq('is_active', true).order('sort_order'),
    ])
    const activeCategories = catRes.data || []
    const categoryById = new Map(activeCategories.map((category: GiftCategory) => [category.id, category]))
    setGifts((giftsRes.data || []).map((gift: Gift) => ({
      ...gift,
      gift_categories: gift.category_id ? categoryById.get(gift.category_id) || null : null,
    })))
    setCategories(activeCategories)
    setLoading(false)
  }

  function openCreate() {
    setForm(emptyForm)
    setEditingId(null)
    setUploadingImage(false)
    setShowForm(true)
  }

  function openEdit(gift: GiftWithCat) {
    setForm({
      name: gift.name,
      description: gift.description || '',
      category_id: gift.category_id || '',
      image_url: gift.image_url || '',
      desired_quantity: gift.desired_quantity,
      available_quantity: gift.available_quantity,
      suggested_pix_value: gift.suggested_pix_value ? String(gift.suggested_pix_value) : '',
      sort_order: gift.sort_order,
      is_active: gift.is_active,
    })
    setEditingId(gift.id)
    setUploadingImage(false)
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('Nome é obrigatório.')
      return
    }

    const desired = Number(form.desired_quantity)
    const available = Number(form.available_quantity)
    const pixValue = form.suggested_pix_value ? Number(form.suggested_pix_value) : null

    if (!Number.isInteger(desired) || desired < 0) {
      toast.error('Quantidade desejada precisa ser um número inteiro maior ou igual a 0.')
      return
    }

    if (!Number.isInteger(available) || available < 0) {
      toast.error('Quantidade disponível precisa ser um número inteiro maior ou igual a 0.')
      return
    }

    if (pixValue !== null && (!Number.isFinite(pixValue) || pixValue < 0)) {
      toast.error('Valor Pix precisa ser 0 ou maior.')
      return
    }

    if (available > desired) {
      toast.error('Quantidade disponível não pode ser maior que a desejada.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        category_id: form.category_id || null,
        image_url: form.image_url || null,
        desired_quantity: desired,
        available_quantity: available,
        suggested_pix_value: pixValue,
        sort_order: Number(form.sort_order),
        is_active: form.is_active,
        updated_at: new Date().toISOString(),
      }

      if (editingId) {
        const { error } = await db.from('gifts').update(payload).eq('id', editingId)
        if (error) throw error
        toast.success('Presente atualizado!')
      } else {
        const { error } = await db.from('gifts').insert(payload)
        if (error) throw error
        toast.success('Presente criado!')
      }

      setShowForm(false)
      fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(gift: GiftWithCat) {
    await db.from('gifts').update({ is_active: !gift.is_active }).eq('id', gift.id)
    fetchData()
  }

  async function handleDelete(gift: GiftWithCat) {
    if (!confirm(`Excluir "${gift.name}"? Esta ação não pode ser desfeita.`)) return
    const { error } = await db.from('gifts').delete().eq('id', gift.id)
    if (error) {
      toast.error('Erro ao excluir. O presente pode ter reservas.')
    } else {
      toast.success('Presente excluído!')
      fetchData()
    }
  }

  function slugify(value: string) {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  async function importDefaultGifts() {
    if (!confirm('Deseja importar a lista padrão de presentes? Os presentes já existentes serão ignorados.')) return

    setImporting(true)
    try {
      const { data: existingCategories, error: categoriesError } = await db.from('gift_categories').select('id, name, slug')
      if (categoriesError) throw categoriesError

      const categoryBySlug = new Map((existingCategories || []).map((category: { id: string; slug: string }) => [category.slug, category.id]))
      const missingCategories = defaultGiftCategories.filter((name) => !categoryBySlug.has(slugify(name)))
      if (missingCategories.length > 0) {
        const { error } = await db.from('gift_categories').insert(missingCategories.map((name, index) => ({
          name,
          slug: slugify(name),
          sort_order: index + 1,
          is_active: true,
        })))
        if (error) throw error
      }

      const { data: importedCategories, error: importedCategoriesError } = await db.from('gift_categories').select('id, slug')
      if (importedCategoriesError) throw importedCategoriesError
      const categoryIds = new Map((importedCategories || []).map((category: { id: string; slug: string }) => [category.slug, category.id]))

      const { data: existingGifts, error: giftsError } = await db.from('gifts').select('slug, name')
      if (giftsError) throw giftsError
      const existingSlugs = new Set((existingGifts || []).flatMap((gift: { slug: string | null; name: string }) => [gift.slug, slugify(gift.name)]).filter(Boolean))
      const giftsToInsert = defaultGifts.filter((gift) => !existingSlugs.has(gift.slug)).map(({ category, ...gift }) => ({
        ...gift,
        category_id: categoryIds.get(slugify(category)) || null,
      }))

      if (giftsToInsert.length > 0) {
        const { error } = await db.from('gifts').insert(giftsToInsert)
        if (error) throw error
      }

      toast.success(`${giftsToInsert.length} presentes adicionados; ${defaultGifts.length - giftsToInsert.length} já existiam; ${missingCategories.length} categorias criadas.`)
      fetchData()
    } catch (err) {
      console.error('Erro ao importar lista padrão de presentes:', err)
      toast.error(err instanceof Error ? `Não foi possível importar: ${err.message}` : 'Não foi possível importar a lista padrão.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 400, color: '#e8e4dc' }}>
            Gerenciar presentes
          </h2>
          <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.85rem', color: 'rgba(232,228,220,0.4)', marginTop: '0.25rem' }}>
            {gifts.length} presente{gifts.length !== 1 ? 's' : ''} cadastrado{gifts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={importDefaultGifts} disabled={importing} className="btn-outline flex items-center gap-2">
            <Download size={16} />
            {importing ? 'Importando...' : 'Importar lista padrão'}
          </button>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            Novo presente
          </button>
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 modal-overlay">
          <div
            className="w-full sm:max-w-2xl glass-card rounded-t-2xl sm:rounded-lg overflow-hidden animate-fade-in-scale"
            style={{ maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}
          >
            <div
              className="flex items-center justify-between px-6 py-5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', color: '#e8e4dc' }}>
                {editingId ? 'Editar presente' : 'Novo presente'}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white/5 rounded-lg">
                <X size={20} style={{ color: 'rgba(232,228,220,0.4)' }} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <F label="Nome *">
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="input-field"
                      placeholder="Ex: Coberta de casal"
                    />
                  </F>
                </div>

                <div className="sm:col-span-2">
                  <F label="Descrição">
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="input-field resize-none"
                      rows={3}
                      placeholder="Descrição opcional..."
                    />
                  </F>
                </div>

                <F label="Categoria">
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Sem categoria</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </F>

                <F label="Valor Pix sugerido (R$)">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.suggested_pix_value}
                    onChange={(e) => setForm({ ...form, suggested_pix_value: e.target.value })}
                    className="input-field"
                    placeholder="0,00"
                  />
                </F>

                <F label="Quantidade desejada">
                  <input
                    type="number"
                    min="1"
                    value={form.desired_quantity}
                    onChange={(e) => setForm({ ...form, desired_quantity: Number(e.target.value) })}
                    className="input-field"
                  />
                </F>

                <F label="Quantidade disponível">
                  <input
                    type="number"
                    min="0"
                    value={form.available_quantity}
                    onChange={(e) => setForm({ ...form, available_quantity: Number(e.target.value) })}
                    className="input-field"
                  />
                </F>

                <F label="Ordem">
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                    className="input-field"
                  />
                </F>

                <F label="Status">
                  <select
                    value={form.is_active ? 'true' : 'false'}
                    onChange={(e) => setForm({ ...form, is_active: e.target.value === 'true' })}
                    className="input-field"
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </F>

                <div className="sm:col-span-2">
                  <ImageUpload
                    currentUrl={form.image_url || null}
                    folder="gifts"
                    onUpload={(url) => setForm({ ...form, image_url: url })}
                    onUploadingChange={setUploadingImage}
                    label="Imagem do presente"
                  />
                </div>
              </div>
            </div>

            <div
              className="flex items-center justify-end gap-3 px-6 py-4"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
              <button
                onClick={() => setShowForm(false)}
                className="btn-outline"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || uploadingImage}
                className="btn-primary flex items-center gap-2"
              >
                <Save size={16} />
                {uploadingImage ? 'Aguardando imagem...' : saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gift list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(201,180,138,0.2)', borderTopColor: '#c9b48a' }} />
        </div>
      ) : gifts.length === 0 ? (
        <div className="text-center py-20">
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', color: 'rgba(232,228,220,0.3)', fontStyle: 'italic' }}>
            Nenhum presente cadastrado ainda.
          </p>
          <button onClick={openCreate} className="btn-primary mt-4 flex items-center gap-2 mx-auto">
            <Plus size={16} />
            Criar primeiro presente
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {gifts.map((gift) => (
            <div
              key={gift.id}
              className="glass-card rounded-lg p-4 flex items-center gap-4"
              style={{ opacity: gift.is_active ? 1 : 0.5 }}
            >
              {/* Image */}
              <div
                className="w-14 h-14 rounded-lg flex-shrink-0 overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                {gift.image_url ? (
                  <img src={gift.image_url} alt={gift.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg">🎁</div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: '#e8e4dc', fontWeight: 500 }}>
                    {gift.name}
                  </p>
                  {gift.gift_categories && (
                    <span className="badge-available" style={{ fontSize: '0.6rem' }}>{gift.gift_categories.name}</span>
                  )}
                  {!gift.is_active && (
                    <span className="badge-reserved" style={{ fontSize: '0.6rem' }}>Inativo</span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 flex-wrap">
                  <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.78rem', color: gift.available_quantity === 0 ? '#fca5a5' : '#c9b48a' }}>
                    {gift.available_quantity}/{gift.desired_quantity} disponível
                  </p>
                  {gift.suggested_pix_value && (
                    <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.78rem', color: 'rgba(232,228,220,0.4)' }}>
                      Pix: {formatCurrency(gift.suggested_pix_value)}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleToggle(gift)}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                  title={gift.is_active ? 'Desativar' : 'Ativar'}
                >
                  {gift.is_active
                    ? <Eye size={16} style={{ color: '#c9b48a' }} />
                    : <EyeOff size={16} style={{ color: 'rgba(232,228,220,0.3)' }} />
                  }
                </button>
                <button
                  onClick={() => openEdit(gift)}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                  title="Editar"
                >
                  <Edit2 size={16} style={{ color: 'rgba(232,228,220,0.5)' }} />
                </button>
                <button
                  onClick={() => handleDelete(gift)}
                  className="p-2 rounded-lg hover:bg-red-900/20 transition-colors"
                  title="Excluir"
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

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.72rem', color: 'rgba(232,228,220,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {label}
      </label>
      {children}
    </div>
  )
}
