'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Session } from '@/lib/session'
import type { Moment } from '@/lib/types'

const MAX_WORDS = 350
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

function countWords(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length
}

function limitWords(text: string, max: number): string {
  const words = text.split(/(\s+)/)
  let count = 0
  let result = ''
  for (const token of words) {
    if (/\S/.test(token)) {
      if (count >= max) break
      count++
    }
    result += token
  }
  return result
}

function randomUsername() {
  const digits = Math.floor(1000 + Math.random() * 9000)
  return `kinduser_${digits}`
}

export default function PostModal({
  session,
  externalTrigger = 0,
  onAuthRequired,
  editMoment,
  onEditDone,
}: {
  session: Session | null
  externalTrigger?: number
  onAuthRequired?: () => void
  editMoment?: Moment | null
  onEditDone?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [kindness, setKindness] = useState('')
  const [feeling, setFeeling] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // image state
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [imageError, setImageError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // open from external trigger (nudge card etc.)
  useEffect(() => {
    if (externalTrigger > 0) setOpen(true)
  }, [externalTrigger])

  // open in edit mode when editMoment is set
  useEffect(() => {
    if (!editMoment) return
    setKindness(editMoment.kindness)
    setFeeling(editMoment.feeling)
    setLocation(editMoment.location ?? '')
    setExistingImageUrl(editMoment.image_url ?? null)
    setImageFile(null)
    setImagePreview(null)
    setRemoveImage(false)
    setImageError('')
    setError('')
    setOpen(true)
  }, [editMoment])

  function closeModal() {
    if (loading) return
    setOpen(false)
    setKindness('')
    setFeeling('')
    setLocation('')
    setError('')
    setImageFile(null)
    setImagePreview(null)
    setExistingImageUrl(null)
    setRemoveImage(false)
    setImageError('')
    if (editMoment) onEditDone?.()
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError('image is too large, please use a file under 5mb')
      e.target.value = ''
      return
    }
    setImageError('')
    setImageFile(file)
    setRemoveImage(false)
    const url = URL.createObjectURL(file)
    setImagePreview(url)
  }

  function clearImage() {
    setImageFile(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
    setRemoveImage(true)
    setImageError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function uploadImage(file: File): Promise<string | null> {
    const supabase = createClient()
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('moment-images').upload(path, file, { upsert: false })
    if (error) return null
    const { data } = supabase.storage.from('moment-images').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!kindness.trim() || !feeling.trim()) return
    setLoading(true)
    setError('')

    const supabase = createClient()

    // resolve image_url
    let finalImageUrl: string | null | undefined = undefined
    if (imageFile) {
      const uploaded = await uploadImage(imageFile)
      if (!uploaded) {
        setError('image upload failed. try again.')
        setLoading(false)
        return
      }
      finalImageUrl = uploaded
    } else if (removeImage) {
      finalImageUrl = null
    } else if (editMoment) {
      finalImageUrl = existingImageUrl // keep existing
    }

    if (editMoment) {
      const update: Record<string, unknown> = {
        kindness: kindness.trim(),
        feeling: feeling.trim(),
        location: location.trim() || null,
      }
      if (finalImageUrl !== undefined) update.image_url = finalImageUrl
      const { error: err } = await supabase.from('moments').update(update).eq('id', editMoment.id)
      if (err) {
        console.error('update error:', err)
        setError('something went wrong. try again.')
        setLoading(false)
        return
      }
    } else {
      const insert: Record<string, unknown> = {
        kindness: kindness.trim(),
        feeling: feeling.trim(),
        posted_by: randomUsername(),
        location: location.trim() || null,
        user_id: session?.id ?? null,
      }
      if (finalImageUrl !== undefined) insert.image_url = finalImageUrl
      const { error: err } = await supabase.from('moments').insert(insert)
      if (err) {
        console.error('insert error:', err)
        setError('something went wrong. try again.')
        setLoading(false)
        return
      }
    }

    setLoading(false)
    closeModal()
    router.refresh()
  }

  const isEditing = !!editMoment
  const labelCls = 'block text-[11px] font-semibold text-[var(--ink-faint)] uppercase tracking-[0.08em] mb-2.5'
  const fieldCls =
    'w-full border border-[var(--line)] rounded-2xl px-4 py-3.5 text-[var(--ink)] bg-[#fffdf9] placeholder:text-[var(--ink-faint)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]/40 transition text-[15px] leading-relaxed'

  // preview to show: new file takes priority over existing
  const shownPreview = imagePreview ?? (removeImage ? null : existingImageUrl)

  return (
    <>
      {/* floating button — hidden when modal is open in edit mode */}
      {!isEditing && (
        <button
          onClick={() => { if (!session) { onAuthRequired?.(); return } setOpen(true) }}
          className="press fixed bottom-20 right-6 z-30 text-white font-semibold text-sm px-6 py-4 rounded-full flex items-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #cf7152, #b85a3e)',
            boxShadow: '0 8px 24px -6px rgba(184, 90, 62, 0.55), 0 2px 6px rgba(0,0,0,0.08)',
          }}
        >
          <span className="text-base leading-none">✦</span>
          share a moment
        </button>
      )}

      {open && (
        <div
          className="backdrop-in fixed inset-0 z-40 bg-[#2c2620]/35 backdrop-blur-md flex items-center justify-center px-4 py-8 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div
            className="sheet-in bg-[#fffdf9] rounded-[28px] w-full max-w-lg p-7 my-auto"
            style={{ boxShadow: '0 30px 80px -20px rgba(60,45,30,0.4), 0 8px 24px rgba(60,45,30,0.12)' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl text-[var(--ink)]">
                {isEditing ? 'edit moment' : 'share a moment'}
              </h2>
              <button
                onClick={closeModal}
                className="press text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f3ece2]"
                aria-label="close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div>
                <label className={labelCls}>what act of kindness did someone show you?</label>
                <textarea
                  value={kindness}
                  onChange={(e) => setKindness(limitWords(e.target.value, MAX_WORDS))}
                  rows={3}
                  placeholder="a stranger held the door open even though i was far away..."
                  required
                  className={`${fieldCls} resize-none font-serif`}
                />
                {(() => {
                  const wc = countWords(kindness)
                  return (
                    <p className="text-right text-[11px] mt-1.5" style={{ color: wc >= MAX_WORDS ? 'var(--accent)' : 'rgba(168,156,143,0.7)' }}>
                      {wc} / {MAX_WORDS}
                    </p>
                  )
                })()}
              </div>

              <div>
                <label className={labelCls}>how did it make you feel?</label>
                <textarea
                  value={feeling}
                  onChange={(e) => setFeeling(limitWords(e.target.value, MAX_WORDS))}
                  rows={3}
                  placeholder="like i wasn't invisible. like i mattered for just a moment..."
                  required
                  className={`${fieldCls} resize-none font-serif italic`}
                />
                {(() => {
                  const wc = countWords(feeling)
                  return (
                    <p className="text-right text-[11px] mt-1.5" style={{ color: wc >= MAX_WORDS ? 'var(--accent)' : 'rgba(168,156,143,0.7)' }}>
                      {wc} / {MAX_WORDS}
                    </p>
                  )
                })()}
              </div>

              <div>
                <label className={labelCls}>where from? (optional)</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  maxLength={100}
                  placeholder="your city or town"
                  className={fieldCls}
                />
              </div>

              {/* image upload */}
              <div>
                <label className={labelCls}>add a photo (optional)</label>
                {shownPreview ? (
                  <div className="relative rounded-2xl overflow-hidden">
                    <img
                      src={shownPreview}
                      alt="preview"
                      className="w-full object-cover rounded-2xl"
                      style={{ maxHeight: '220px' }}
                    />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute top-2 right-2 bg-[#2c2620]/60 text-white text-xs px-3 py-1.5 rounded-full hover:bg-[#2c2620]/80 transition-colors"
                    >
                      remove
                    </button>
                  </div>
                ) : (
                  <label
                    className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[var(--line)] rounded-2xl px-4 py-7 cursor-pointer hover:border-[var(--accent)]/40 transition-colors"
                    htmlFor="image-upload"
                  >
                    <span className="text-2xl text-[var(--ink-faint)]">↑</span>
                    <span className="text-[13px] text-[var(--ink-faint)]">tap to choose a photo</span>
                    <span className="text-[11px] text-[var(--ink-faint)]/60">jpg, png or webp · max 5mb</span>
                  </label>
                )}
                <input
                  id="image-upload"
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={handleImageChange}
                />
                {imageError && <p className="text-[var(--accent)] text-[13px] mt-2">{imageError}</p>}
              </div>

              {error && <p className="text-[var(--accent)] text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading || !kindness.trim() || !feeling.trim()}
                className="press text-white font-semibold py-3.5 rounded-2xl transition-all text-[15px] disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #cf7152, #b85a3e)' }}
              >
                {loading
                  ? (isEditing ? 'saving…' : 'posting...')
                  : (isEditing ? 'save changes' : 'post your moment')}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
