export const EVENT_TIME_ZONE = 'America/Sao_Paulo'

export function formatWhatsApp(value: string): string {
  return value.replace(/\D/g, '').slice(0, 11)
}

export function formatWhatsAppDisplay(value: string): string {
  const numbers = value.replace(/\D/g, '').slice(0, 11)
  if (numbers.length <= 2) return numbers
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
  if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
}

export function isValidBrazilianWhatsApp(value: string): boolean {
  const numbers = value.replace(/\D/g, '')
  return numbers.length === 10 || numbers.length === 11
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: EVENT_TIME_ZONE,
  })
}

export function formatDateLong(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: EVENT_TIME_ZONE,
  })
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: EVENT_TIME_ZONE,
  })
}

function getDatePartsInEventTimeZone(date: Date) {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: EVENT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const get = (type: string) => parts.find((part) => part.type === type)?.value || '00'

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
  }
}

export function toDateTimeLocalInputValue(date: string): string {
  if (!date) return ''
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return ''
  const parts = getDatePartsInEventTimeZone(parsed)
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}

export function fromDateTimeLocalInputValue(value: string): string {
  if (!value) return ''
  // Brazil has no daylight saving time currently, so -03:00 is the correct offset for Brasília.
  return new Date(`${value}:00-03:00`).toISOString()
}

export function openWhatsApp(phone: string, message: string) {
  const cleaned = phone.replace(/\D/g, '')
  if (!cleaned) return
  const phoneWithCountry = cleaned.startsWith('55') ? cleaned : `55${cleaned}`
  const encodedMessage = encodeURIComponent(message)
  window.open(`https://wa.me/${phoneWithCountry}?text=${encodedMessage}`, '_blank')
}
