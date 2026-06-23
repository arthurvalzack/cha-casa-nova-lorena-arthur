import { useEffect, useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { assertSupabaseConfigured, getStorageErrorMessage, STORAGE_BUCKET, supabase } from '../../lib/supabase'

interface ImageUploadProps {
  currentUrl: string | null
  bucket?: string
  folder?: string
  onUpload: (url: string) => void
  onUploadingChange?: (uploading: boolean) => void
  label?: string
}

const MAX_SIZE_MB = 5
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export default function ImageUpload({
  currentUrl,
  bucket = STORAGE_BUCKET,
  folder = 'general',
  onUpload,
  onUploadingChange,
  label = 'Imagem',
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setPreview(currentUrl)
  }, [currentUrl])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  async function handleFile(file: File) {
    setError(null)

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Formato não suportado. Use JPG, PNG ou WebP.')
      return
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Arquivo muito grande. Máximo ${MAX_SIZE_MB}MB.`)
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    // Upload to Supabase Storage
    setUploading(true)
    onUploadingChange?.(true)
    try {
      assertSupabaseConfigured()
      const ext = file.name.split('.').pop()?.toLowerCase() || file.type.split('/').pop() || 'jpg'
      const safeFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, '') || 'general'
      const baseName = file.name.replace(/\.[^.]+$/, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'imagem'
      const uniqueId = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).slice(2)
      const filePath = `${safeFolder}/${Date.now()}-${uniqueId}-${baseName}.${ext}`

      if (import.meta.env.DEV) console.info('[Storage] Iniciando upload', { bucket, filePath })

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { cacheControl: '3600', upsert: false, contentType: file.type })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
      onUpload(data.publicUrl)
    } catch (err) {
      if (import.meta.env.DEV) console.error('[Storage] Erro detalhado no upload', err)
      setError(getStorageErrorMessage(err))
      setPreview(currentUrl)
    } finally {
      setUploading(false)
      onUploadingChange?.(false)
    }
  }

  function removeImage() {
    setPreview(null)
    onUpload('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
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
        {label}
      </label>

      {preview ? (
        <div className="relative group">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="px-3 py-2 rounded text-xs flex items-center gap-2"
              style={{
                background: 'rgba(201,180,138,0.9)',
                color: '#0b0b0f',
                fontFamily: 'Jost, sans-serif',
                fontWeight: 500,
              }}
            >
              <Upload size={14} />
              Trocar
            </button>
            <button
              type="button"
              onClick={removeImage}
              className="p-2 rounded"
              style={{ background: 'rgba(220,38,38,0.8)', color: 'white' }}
            >
              <X size={14} />
            </button>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black/70 rounded-lg flex items-center justify-center">
              <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.85rem', color: '#c9b48a' }}>
                Enviando...
              </p>
            </div>
          )}
        </div>
      ) : (
        <div
          className="relative border-2 border-dashed rounded-lg p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors"
          style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.85rem', color: '#c9b48a' }}>
              Enviando...
            </p>
          ) : (
            <>
              <ImageIcon size={28} style={{ color: 'rgba(255,255,255,0.2)' }} />
              <div className="text-center">
                <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.85rem', color: 'rgba(232,228,220,0.5)' }}>
                  Clique ou arraste uma imagem
                </p>
                <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.72rem', color: 'rgba(232,228,220,0.25)' }}>
                  JPG, PNG, WebP · máx. 5MB
                </p>
              </div>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleChange}
        className="sr-only"
      />

      {error && (
        <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.78rem', color: '#fca5a5' }}>
          {error}
        </p>
      )}
    </div>
  )
}
