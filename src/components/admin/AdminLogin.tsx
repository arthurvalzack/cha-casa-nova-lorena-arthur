import { useState } from 'react'
import { Lock, Eye, EyeOff } from 'lucide-react'

interface AdminLoginProps {
  onLogin: (password: string) => boolean
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(false)

    setTimeout(() => {
      const success = onLogin(password)
      if (!success) {
        setError(true)
        setPassword('')
      }
      setLoading(false)
    }, 300)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: 'radial-gradient(ellipse at center top, #1a1510 0%, #0b0b0f 60%)',
      }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{
              background: 'rgba(201,180,138,0.08)',
              border: '1px solid rgba(201,180,138,0.2)',
            }}
          >
            <Lock size={22} style={{ color: '#c9b48a' }} />
          </div>
          <h1
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '2rem',
              fontWeight: 300,
              color: '#e8e4dc',
            }}
          >
            Lorena & Arthur
          </h1>
          <p
            style={{
              fontFamily: 'Jost, sans-serif',
              fontSize: '0.7rem',
              color: 'rgba(232,228,220,0.35)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginTop: '0.4rem',
            }}
          >
            Painel administrativo
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="glass-card rounded-lg p-8 flex flex-col gap-5"
        >
          <div className="flex flex-col gap-2">
            <label
              style={{
                fontFamily: 'Jost, sans-serif',
                fontSize: '0.75rem',
                color: 'rgba(232,228,220,0.45)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Senha de acesso
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false) }}
                placeholder="••••••••"
                className="input-field pr-10"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'rgba(232,228,220,0.3)' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <p
                style={{
                  fontFamily: 'Jost, sans-serif',
                  fontSize: '0.8rem',
                  color: '#fca5a5',
                }}
              >
                Senha incorreta. Tente novamente.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="btn-primary w-full"
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>

        <p
          className="text-center mt-6"
          style={{
            fontFamily: 'Jost, sans-serif',
            fontSize: '0.75rem',
            color: 'rgba(232,228,220,0.2)',
          }}
        >
          Acesso restrito ao casal
        </p>
      </div>
    </div>
  )
}
