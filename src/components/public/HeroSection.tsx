import type { SiteSettings } from '../../types/database'
import CountdownTimer from './CountdownTimer'

interface HeroSectionProps {
  settings: SiteSettings
  onScrollToGifts: () => void
}

export default function HeroSection({ settings, onScrollToGifts }: HeroSectionProps) {
  const eventDate = new Date(settings.event_date)
  const day = eventDate.toLocaleDateString('pt-BR', { day: 'numeric', timeZone: 'America/Sao_Paulo' })
  const month = eventDate.toLocaleDateString('pt-BR', { month: 'long', timeZone: 'America/Sao_Paulo' })
  const year = eventDate.toLocaleDateString('pt-BR', { year: 'numeric', timeZone: 'America/Sao_Paulo' })

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        {settings.hero_image_url ? (
          <img
            src={settings.hero_image_url}
            alt="Capa do evento"
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: 'radial-gradient(ellipse at 50% 20%, #2a1f1a 0%, #1a1510 25%, #0d0d12 55%, #0b0b0f 100%)',
            }}
          />
        )}
        <div className="hero-gradient absolute inset-0" />
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(201,180,138,0.04) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Decorative lines */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-px h-32 opacity-20"
          style={{ background: 'linear-gradient(to bottom, transparent, #c9b48a, transparent)' }}
        />
        <div
          className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-px h-32 opacity-20"
          style={{ background: 'linear-gradient(to bottom, transparent, #c9b48a, transparent)' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 py-20 max-w-3xl mx-auto w-full">
        {/* Event label */}
        <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <span
            className="inline-block text-xs tracking-[0.3em] uppercase font-light mb-1"
            style={{ color: 'rgba(201,180,138,0.7)', fontFamily: 'Jost, sans-serif' }}
          >
            Você está convidado para o
          </span>
        </div>

        {/* Event name */}
        <h2
          className="text-gold-gradient mb-4 animate-fade-in"
          style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
            fontWeight: 300,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            animationDelay: '0.2s',
          }}
        >
          {settings.event_name}
        </h2>

        {/* Couple name */}
        <h1
          className="animate-fade-in"
          style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 'clamp(3.5rem, 10vw, 7rem)',
            fontWeight: 300,
            color: '#e8e4dc',
            lineHeight: 1,
            letterSpacing: '-0.01em',
            animationDelay: '0.3s',
          }}
        >
          {settings.couple_name}
        </h1>

        {/* Ornamental divider */}
        <div
          className="flex items-center gap-4 my-8 w-full max-w-xs animate-fade-in"
          style={{ animationDelay: '0.4s' }}
        >
          <div
            className="flex-1 h-px"
            style={{ background: 'linear-gradient(to right, transparent, rgba(201,180,138,0.4))' }}
          />
          <span style={{ color: '#c9b48a', fontSize: '1.2rem' }}>◇</span>
          <div
            className="flex-1 h-px"
            style={{ background: 'linear-gradient(to left, transparent, rgba(201,180,138,0.4))' }}
          />
        </div>

        {/* Date and time */}
        <div
          className="animate-fade-in"
          style={{ animationDelay: '0.5s' }}
        >
          <p
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 'clamp(1.2rem, 3vw, 1.6rem)',
              fontWeight: 300,
              color: '#e8e4dc',
              letterSpacing: '0.05em',
            }}
          >
            {day} de {month} de {year}
          </p>
          <p
            style={{
              fontFamily: 'Jost, sans-serif',
              fontSize: '0.8rem',
              color: 'rgba(232,228,220,0.5)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginTop: '0.4rem',
            }}
          >
            {settings.event_time_text}
          </p>
        </div>

        {/* Tagline */}
        <p
          className="animate-fade-in mt-8 max-w-sm"
          style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
            fontStyle: 'italic',
            color: 'rgba(232,228,220,0.55)',
            lineHeight: 1.6,
            animationDelay: '0.6s',
          }}
        >
          "Um novo lar, um novo capítulo, um novo começo."
        </p>

        {/* CTA Button */}
        <div
          className="mt-10 animate-fade-in"
          style={{ animationDelay: '0.7s' }}
        >
          <button
            onClick={onScrollToGifts}
            className="btn-primary"
          >
            Escolher presente
          </button>
        </div>

        {/* Countdown */}
        <div
          className="mt-14 w-full animate-fade-in"
          style={{ animationDelay: '0.8s' }}
        >
          <CountdownTimer targetDate={settings.event_date} />
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-fade-in"
        style={{ animationDelay: '1s' }}
      >
        <button
          onClick={onScrollToGifts}
          className="flex flex-col items-center gap-2 opacity-40 hover:opacity-70 transition-opacity"
        >
          <span
            style={{
              fontFamily: 'Jost, sans-serif',
              fontSize: '0.65rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#e8e4dc',
            }}
          >
            Ver lista
          </span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="animate-bounce">
            <path d="M5 8l5 5 5-5" stroke="#e8e4dc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </section>
  )
}
