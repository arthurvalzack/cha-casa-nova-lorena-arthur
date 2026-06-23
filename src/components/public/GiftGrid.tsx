import { useState } from 'react'
import type { GiftWithCategory, GiftCategory } from '../../types/database'
import GiftCard from './GiftCard'
import CategoryFilter from './CategoryFilter'
import { Gift } from 'lucide-react'

interface GiftGridProps {
  gifts: GiftWithCategory[]
  categories: GiftCategory[]
  loading: boolean
  onReserve: (gift: GiftWithCategory) => void
}

export default function GiftGrid({ gifts, categories, loading, onReserve }: GiftGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filtered = selectedCategory
    ? gifts.filter((g) => g.category_id === selectedCategory)
    : gifts

  return (
    <div className="flex flex-col gap-8">
      {/* Category filter */}
      {categories.length > 0 && (
        <CategoryFilter
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="glass-card rounded-lg overflow-hidden"
              style={{ height: '420px' }}
            >
              <div
                className="w-full h-48"
                style={{
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s infinite',
                }}
              />
              <div className="p-4 space-y-3">
                <div className="h-5 rounded" style={{ background: 'rgba(255,255,255,0.04)', width: '60%' }} />
                <div className="h-3 rounded" style={{ background: 'rgba(255,255,255,0.03)', width: '80%' }} />
                <div className="h-3 rounded" style={{ background: 'rgba(255,255,255,0.03)', width: '65%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Gift size={48} style={{ color: 'rgba(255,255,255,0.1)' }} />
          <p
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '1.5rem',
              color: 'rgba(232,228,220,0.3)',
              fontStyle: 'italic',
            }}
          >
            {selectedCategory ? 'Nenhum presente nessa categoria' : 'A lista de presentes será divulgada em breve'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((gift) => (
            <GiftCard
              key={gift.id}
              gift={gift}
              onReserve={onReserve}
            />
          ))}
        </div>
      )}
    </div>
  )
}
