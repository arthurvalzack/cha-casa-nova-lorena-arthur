import { useState, useEffect } from 'react'

interface CountdownTimerProps {
  targetDate: string
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function calculateTimeLeft(targetDate: string): TimeLeft {
  // Target: 2026-07-18 17:00:00 Brasília (UTC-3)
  const target = new Date(targetDate)
  const now = new Date()
  const diff = target.getTime() - now.getTime()

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return { days, hours, minutes, seconds }
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft(targetDate))

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate))
    }, 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  const units = [
    { label: 'Dias', value: timeLeft.days },
    { label: 'Horas', value: timeLeft.hours },
    { label: 'Min', value: timeLeft.minutes },
    { label: 'Seg', value: timeLeft.seconds },
  ]

  const isOver = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0

  if (isOver) {
    return (
      <div className="text-center">
        <p
          style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '1.5rem',
            color: '#c9b48a',
            fontStyle: 'italic',
          }}
        >
          O grande dia chegou! ✨
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p
        style={{
          fontFamily: 'Jost, sans-serif',
          fontSize: '0.65rem',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: 'rgba(232,228,220,0.4)',
        }}
      >
        Contagem regressiva
      </p>
      <div className="flex items-start gap-3 sm:gap-4">
        {units.map((unit, index) => (
          <div key={unit.label} className="flex items-start gap-3 sm:gap-4">
            <div className="countdown-unit">
              <div
                style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: 'clamp(2rem, 6vw, 3rem)',
                  fontWeight: 300,
                  color: '#e8e4dc',
                  lineHeight: 1,
                }}
              >
                {String(unit.value).padStart(2, '0')}
              </div>
              <div
                style={{
                  fontFamily: 'Jost, sans-serif',
                  fontSize: '0.6rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'rgba(232,228,220,0.4)',
                  marginTop: '0.4rem',
                }}
              >
                {unit.label}
              </div>
            </div>
            {index < units.length - 1 && (
              <span
                style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: '2rem',
                  color: 'rgba(201,180,138,0.3)',
                  lineHeight: 1,
                  marginTop: '1.25rem',
                }}
              >
                :
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
