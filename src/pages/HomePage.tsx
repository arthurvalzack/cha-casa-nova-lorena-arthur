import { useRef, useState } from 'react'
import { Toaster } from 'react-hot-toast'
import type { GiftWithCategory } from '../types/database'
import { isSupabaseConfigured, SUPABASE_CONFIGURATION_ERROR } from '../lib/supabase'
import { useSiteSettings } from '../hooks/useSiteSettings'
import { useGifts } from '../hooks/useGifts'
import LightHero from '../components/public/LightHero'
import LightGiftGrid from '../components/public/LightGiftGrid'
import CountdownTimer from '../components/public/CountdownTimer'
import GiftCartBar from '../components/public/GiftCartBar'
import GiftCartDrawer from '../components/public/GiftCartDrawer'

export default function HomePage() {
  const giftsRef = useRef<HTMLElement>(null)
  const { settings, loading: settingsLoading } = useSiteSettings()
  const { gifts, categories, loading: giftsLoading, error: giftsError, refetch } = useGifts()
  const [cart, setCart] = useState<GiftWithCategory[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const scrollToGifts = () => giftsRef.current?.scrollIntoView({ behavior: 'smooth' })

  if (settingsLoading) return <div className="public-page public-loading">Carregando lista de presentes...</div>
  if (!settings) return null

  return (
    <div className="public-page min-h-screen">
      <Toaster position="top-center" toastOptions={{ style: { background: '#fff', color: '#1f1f1f', border: '1px solid #e5e0d8' } }} />
      <LightHero settings={settings} onScrollToGifts={scrollToGifts} />
      <section className="public-countdown px-4 py-6"><CountdownTimer targetDate={settings.event_date} /></section>
      <section id="lista-presentes" ref={giftsRef} className="public-gifts px-4 pt-8 pb-14 sm:px-6 sm:pt-10">
        <div className="mx-auto max-w-[1100px]">
          <header className="public-gifts-heading">
            <h2>Lista de presentes</h2>
            <p>{settings.main_message || 'Escolha um presente da nossa lista e reserve com carinho. O endereço será enviado posteriormente pelo WhatsApp.'}</p>
          </header>
          {!isSupabaseConfigured && <p className="public-feedback public-feedback-error">{SUPABASE_CONFIGURATION_ERROR}</p>}
          {giftsError && <p className="public-feedback public-feedback-error">Não foi possível carregar a lista de presentes. Tente atualizar a página.</p>}
          <LightGiftGrid gifts={gifts} categories={categories} loading={giftsLoading} cartIds={new Set(cart.map((item) => item.id))} onToggleCart={(gift) => setCart((items) => items.some((item) => item.id === gift.id) ? items.filter((item) => item.id !== gift.id) : [...items, gift])} />
        </div>
      </section>
      <footer className="public-footer"><strong>{settings.couple_name}</strong><span>{settings.event_name}</span></footer>
      <GiftCartBar count={cart.length} onOpen={() => setCartOpen(true)} />
      {cartOpen && <GiftCartDrawer items={cart} settings={settings} onRemove={(id) => setCart((items) => items.filter((item) => item.id !== id))} onClose={() => setCartOpen(false)} onChooseMore={() => { setCartOpen(false); document.getElementById('lista-presentes')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }} onComplete={() => { setCart([]); refetch() }} />}
    </div>
  )
}
