import type { SiteSettings } from '../../types/database'

interface LightHeroProps { settings: SiteSettings; onScrollToGifts: () => void }

export default function LightHero({ settings, onScrollToGifts }: LightHeroProps) {
  const date = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' }).format(new Date(settings.event_date))
  return (
    <section className="public-hero">
      {settings.hero_image_url && <img src={settings.hero_image_url} alt="Capa do evento" className="public-hero-image" />}
      <div className="public-hero-overlay" />
      <div className="public-hero-content">
        <p>{settings.event_name || 'Chá de Casa Nova'}</p>
        <h1>{settings.couple_name}</h1>
        <time dateTime={settings.event_date}>{date}</time>
        <button type="button" onClick={onScrollToGifts}>Ver presentes</button>
      </div>
    </section>
  )
}
