import type { GiftCategory } from '../../types/database'

interface CategoryFilterProps {
  categories: GiftCategory[]
  selected: string | null
  onSelect: (id: string | null) => void
}

export default function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  if (categories.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      <button
        onClick={() => onSelect(null)}
        className={`category-pill ${selected === null ? 'active' : ''}`}
      >
        Todos
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`category-pill ${selected === cat.id ? 'active' : ''}`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}
