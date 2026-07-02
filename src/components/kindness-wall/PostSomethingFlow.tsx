'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { uploadKindnessWallImage, ACCEPTED_IMAGE_TYPES } from '@/lib/kindnessWallUpload'
import { KINDNESS_WALL_GOAL } from '@/lib/kindnessWall'

type Step = 'form' | 'confirm' | 'share'

export default function PostSomethingFlow() {
  const [step, setStep] = useState<Step>('form')

  const [actText, setActText] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  const [postId, setPostId] = useState<string | null>(null)
  const [liveCount, setLiveCount] = useState<number | null>(null)

  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notifyLoading, setNotifyLoading] = useState(false)
  const [notifyError, setNotifyError] = useState('')

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setPhoto(f)
    setPhotoPreview(URL.createObjectURL(f))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!actText.trim()) return
    setLoading(true)
    setError('')
    try {
      let image_url: string | null = null
      if (photo) image_url = await uploadKindnessWallImage(photo)

      const supabase = createClient()
      const { data, error: insertErr } = await supabase
        .from('kindness_wall_posts')
        .insert({ act_text: actText.trim(), image_url })
        .select('id')
        .single()
      if (insertErr) throw insertErr

      const { count } = await supabase
        .from('kindness_wall_posts')
        .select('id', { count: 'exact', head: true })

      setPostId((data as { id: string }).id)
      setLiveCount(count ?? null)
      setStep('confirm')
    } catch {
      setError('something went wrong. try again.')
    }
    setLoading(false)
  }

  async function handleNotify(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setNotifyLoading(true)
    setNotifyError('')
    try {
      const res = await fetch('/api/kindness-wall/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), phone: phone.trim() || null, post_id: postId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'something went wrong')
      setStep('share')
    } catch (err) {
      setNotifyError(err instanceof Error ? err.message : 'something went wrong. try again.')
    }
    setNotifyLoading(false)
  }

  if (step === 'share') {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const shareUrl = origin
    const twitterText = `i just added to the kindness wall — a million small acts of kindness, one at a time. add yours: ${shareUrl}`
    const facebookText = `the kindness wall: a million kind acts, together. see what people are doing for each other: ${shareUrl}`
    const whatsappText = `i just added to the kindness wall 🤍 add your own kind act: ${shareUrl}`
    const linkedinText = `I recently added to the kindness wall — a growing collection of small acts of kindness, one person at a time. Take a look at what people are doing for each other, and consider adding your own: ${shareUrl}`

    return (
      <div>
        <h1 className="kw-headline text-[28px] md:text-[34px] mb-4">
          you&apos;re in. now help it spread.
        </h1>
        <p className="kw-body text-[15px] mb-10 max-w-lg">
          share the wall with someone — it only takes one person to keep a chain of kindness going.
        </p>
        <div className="flex flex-col gap-3 max-w-xs">
          <a
            className="kw-btn"
            target="_blank"
            rel="noopener noreferrer"
            href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
          >
            share on whatsapp
          </a>
          <a
            className="kw-btn"
            target="_blank"
            rel="noopener noreferrer"
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(facebookText)}`}
          >
            share on facebook
          </a>
          <a
            className="kw-btn"
            target="_blank"
            rel="noopener noreferrer"
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}`}
          >
            share on twitter / x
          </a>
          <a
            className="kw-btn"
            target="_blank"
            rel="noopener noreferrer"
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
            onClick={async () => {
              try { await navigator.clipboard.writeText(linkedinText) } catch {}
            }}
          >
            share on linkedin
          </a>
        </div>
        <p className="kw-body text-[12px] mt-4 max-w-xs">
          linkedin doesn&apos;t accept pre-filled post text — we copied a suggested caption to
          your clipboard, just paste it in.
        </p>
      </div>
    )
  }

  if (step === 'confirm') {
    return (
      <div>
        <p className="kw-headline text-[26px] md:text-[32px] mb-2">
          you are number {liveCount !== null ? liveCount.toLocaleString() : '—'} out of{' '}
          {KINDNESS_WALL_GOAL.toLocaleString()} in the pay-it-forward chain.
        </p>
        <p className="kw-body text-[16px] mb-10 max-w-lg">
          that&apos;s amazing! that feeling — good, doing it and thinking about it — isn&apos;t it?
          want to feel like this every day?
        </p>

        <form onSubmit={handleNotify} className="max-w-sm">
          <p className="kw-body text-[14px] mb-4">
            enter your email &amp; phone below to get early access to something we&apos;re building
            to help you feel good in all the noise happening around you and on your phone.
          </p>
          <div className="flex flex-col gap-3 mb-4">
            <input
              type="email"
              required
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="kw-input"
            />
            <input
              type="tel"
              placeholder="phone (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="kw-input"
            />
          </div>
          {notifyError && <p className="text-[13px] mb-3" style={{ color: '#ff6b6b' }}>{notifyError}</p>}
          <button
            type="submit"
            disabled={notifyLoading || !email.trim()}
            className="kw-btn disabled:opacity-40"
          >
            {notifyLoading ? 'submitting...' : 'notify me'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div>
      <h1 className="kw-headline text-[28px] md:text-[36px] mb-8 max-w-xl">
        what&apos;s the nicest thing you&apos;ve done recently for someone?
      </h1>

      <form onSubmit={handleSubmit} className="max-w-xl">
        <textarea
          value={actText}
          onChange={(e) => setActText(e.target.value)}
          rows={5}
          required
          placeholder="i noticed my neighbor's bins were still out and brought them in..."
          className="kw-input mb-4 resize-none"
        />

        <input
          ref={fileInput}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          onChange={handlePhoto}
          className="hidden"
        />

        {photoPreview ? (
          <div className="relative mb-4">
            <img src={photoPreview} alt="" className="w-full" style={{ maxHeight: 260, objectFit: 'cover' }} />
            <button
              type="button"
              onClick={() => { setPhoto(null); setPhotoPreview(null); if (fileInput.current) fileInput.current.value = '' }}
              className="absolute top-2 right-2 text-white text-xs px-3 py-1.5"
              style={{ background: 'rgba(0,0,0,0.7)' }}
            >
              remove
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="kw-btn kw-btn-outline w-full py-4 mb-4 text-[13px]"
          >
            + add a photo (optional)
          </button>
        )}

        {error && <p className="text-[13px] mb-3" style={{ color: '#ff6b6b' }}>{error}</p>}

        <button
          type="submit"
          disabled={loading || !actText.trim()}
          className="kw-btn disabled:opacity-40"
        >
          {loading ? 'sharing...' : 'share it'}
        </button>
      </form>
    </div>
  )
}
