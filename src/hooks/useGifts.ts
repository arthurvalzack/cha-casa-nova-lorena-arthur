import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { GiftWithCategory, GiftCategory } from '../types/database'

export function useGifts() {
  const [gifts, setGifts] = useState<GiftWithCategory[]>([])
  const [categories, setCategories] = useState<GiftCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      const [giftsRes, categoriesRes] = await Promise.all([
        supabase
          .from('gifts')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .order('name', { ascending: true }),
        supabase
          .from('gift_categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .order('name', { ascending: true })
      ])

      if (giftsRes.error || categoriesRes.error) {
        console.error('Erro ao carregar presentes:', {
          giftsError: giftsRes.error,
          categoriesError: categoriesRes.error,
        })
        throw giftsRes.error || categoriesRes.error
      }

      const activeCategories = categoriesRes.data || []
      const categoryById = new Map(activeCategories.map((category) => [category.id, category]))
      const giftsWithCategories: GiftWithCategory[] = (giftsRes.data || []).map((gift) => ({
        ...gift,
        gift_categories: gift.category_id ? categoryById.get(gift.category_id) || null : null,
      }))
      setGifts(giftsWithCategories)
      setCategories(activeCategories)
    } catch (err) {
      console.error('Erro ao carregar presentes:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar presentes')
    } finally {
      setLoading(false)
    }
  }

  return { gifts, categories, loading, error, refetch: fetchData }
}
