import { useRef, useState } from 'react'
import { Toaster } from 'react-hot-toast'
import type { GiftWithCategory } from '../types/database'
import { useSiteSettings } from '../hooks/useSiteSettings'
import { useGifts } from '../hooks/useGifts'
import HeroSection from '../components/public/HeroSection'
import GiftGrid from '../components/public/GiftGrid'
import ReservationModal from '../components/public/ReservationModal'

export default function PublicPage() {
  const giftsRef = useRef<HTMLElement>(null)
  const { settings, loading: settingsLoading } = useSiteSettings()
  const { gifts, categories, loading: giftsLoading, refetch } = useGifts()
  const [selectedGift, setSelectedGift] = useState<GiftWithCategory | null>(null)

  function scrollToGifts() {
    giftsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  if (settingsLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#0b0b0f' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{
              borderColor: 'rgba(201,180,138,0.2)',
              borderTopColor: '#c9b48a',
            }}
          />
          <p
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '1.2rem',
              color: 'rgba(232,228,220,0.4)',
              fontStyle: 'italic',
            }}
          >
            Carregando...
          </p>
        </div>
      </div>
    )
  }

  if (!settings) return null

  return (
    <div className="min-h-screen" style={{ background: '#0b0b0f' }}>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1a1a22',
            color: '#e8e4dc',
            border: '1px solid rgba(255,255,255,0.08)',
            fontFamily: 'Jost, sans-serif',
            fontSize: '0.875rem',
          },
        }}
      />

      {/* Hero */}
      <HeroSection settings={settings} onScrollToGifts={scrollToGifts} />

      {/* Main message */}
      <section
        className="py-24 px-6"
        style={{
          background: 'linear-gradient(180deg, #0b0b0f 0%, #0f0f16 50%, #0b0b0f 100%)',
        }}
      >
        <div className="max-w-2xl mx-auto text-center">
          {/* Ornament */}
          <div className="flex items-center gap-4 mb-10">
            <div
              className="flex-1 h-px"
              style={{ background: 'linear-gradient(to right, transparent, rgba(201,180,138,0.25))' }}
            />
            <span style={{ color: 'rgba(201,180,138,0.5)', fontSize: '1rem' }}>◇</span>
            <div
              className="flex-1 h-px"
              style={{ background: 'linear-gradient(to left, transparent, rgba(201,180,138,0.25))' }}
            />
          </div>

          <p
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 'clamp(1.1rem, 3vw, 1.5rem)',
              fontWeight: 300,
              color: 'rgba(232,228,220,0.75)',
              lineHeight: 1.85,
              fontStyle: 'italic',
            }}
          >
            {settings.main_message}
          </p>

          <div className="flex items-center gap-4 mt-10">
            <div
              className="flex-1 h-px"
              style={{ background: 'linear-gradient(to right, transparent, rgba(201,180,138,0.25))' }}
            />
            <span style={{ color: 'rgba(201,180,138,0.5)', fontSize: '1rem' }}>◇</span>
            <div
              className="flex-1 h-px"
              style={{ background: 'linear-gradient(to left, transparent, rgba(201,180,138,0.25))' }}
            />
          </div>
        </div>
      </section>

      {/* Gifts section */}
      <section ref={giftsRef} className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-14">
            <p
              style={{
                fontFamily: 'Jost, sans-serif',
                fontSize: '0.7rem',
                color: '#c9b48a',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                marginBottom: '1rem',
              }}
            >
              Lista de presentes
            </p>
            <h2 className="section-title">
              Escolha com carinho
            </h2>
            <p
              style={{
                fontFamily: 'Jost, sans-serif',
                fontSize: '0.9rem',
                color: 'rgba(232,228,220,0.4)',
                marginTop: '1rem',
                lineHeight: 1.7,
              }}
            >
              Selecione um presente e informe seu WhatsApp para reservar.
              <br />
              {settings.address_message}
            </p>
          </div>

          <GiftGrid
            gifts={gifts}
            categories={categories}
            loading={giftsLoading}
            onReserve={setSelectedGift}
          />
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-12 px-6 text-center"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <p
          style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '1.4rem',
            fontWeight: 300,
            color: 'rgba(232,228,220,0.4)',
            fontStyle: 'italic',
          }}
        >
          {settings.couple_name}
        </p>
        <p
          style={{
            fontFamily: 'Jost, sans-serif',
            fontSize: '0.7rem',
            color: 'rgba(232,228,220,0.2)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginTop: '0.5rem',
          }}
        >
          {settings.event_name} · 2026
        </p>
      </footer>

      {/* Reservation modal */}
      {selectedGift && (
        <ReservationModal
          gift={selectedGift}
          settings={settings}
          onClose={() => setSelectedGift(null)}
          onSuccess={() => {
            setSelectedGift(null)
            refetch()
          }}
        />
      )}
    </div>
  )
}
