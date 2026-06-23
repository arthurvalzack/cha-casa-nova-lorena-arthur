import { useEffect, useState } from 'react'
import { Gift } from 'lucide-react'
import type { GiftWithCategory, GiftCategory } from '../../types/database'
import CategoryFilter from './CategoryFilter'
import LightGiftCard from './LightGiftCard'

interface LightGiftGridProps { gifts: GiftWithCategory[]; categories: GiftCategory[]; loading: boolean; cartIds: Set<string>; onToggleCart: (gift: GiftWithCategory) => void }

export default function LightGiftGrid({ gifts, categories, loading, cartIds, onToggleCart }: LightGiftGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(4)
  const filtered = (selectedCategory ? gifts.filter((gift) => gift.category_id === selectedCategory) : gifts)
    .slice()
    .sort((a, b) => Number(b.available_quantity > 0) - Number(a.available_quantity > 0) || a.sort_order - b.sort_order || a.name.localeCompare(b.name, 'pt-BR'))
  useEffect(() => setVisibleCount(4), [selectedCategory])
  if (loading) return <div className="public-grid">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="public-card-skeleton" />)}</div>
  return (
    <div className="flex flex-col gap-5">
      {categories.length > 0 && <CategoryFilter categories={categories} selected={selectedCategory} onSelect={setSelectedCategory} />}
      {filtered.length === 0 ? <div className="public-empty"><Gift size={32} /><p>{selectedCategory ? 'Nenhum presente nesta categoria.' : 'A lista de presentes será divulgada em breve.'}</p></div> : <>
        <div className="public-grid">{filtered.slice(0, visibleCount).map((gift) => <LightGiftCard key={gift.id} gift={gift} inCart={cartIds.has(gift.id)} onToggleCart={onToggleCart} />)}</div>
        {visibleCount < filtered.length && <button type="button" className="public-more-button" onClick={() => setVisibleCount((count) => count + 4)}>Ver mais</button>}
      </>}
    </div>
  )
}
