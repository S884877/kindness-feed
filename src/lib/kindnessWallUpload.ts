import { createClient } from './supabase/client'

export const ACCEPTED_IMAGE_TYPES = '.jpg,.jpeg,.png,.heic,.heif,.webp,image/jpeg,image/png,image/heic,image/heif,image/webp'

const HEIC_TYPES = ['image/heic', 'image/heif']

export async function uploadKindnessWallImage(file: File): Promise<string> {
  let uploadFile: File = file

  if (HEIC_TYPES.includes(file.type) || /\.(heic|heif)$/i.test(file.name)) {
    const heic2any = (await import('heic2any')).default
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 })
    const blob = Array.isArray(converted) ? converted[0] : converted
    uploadFile = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' })
  }

  const supabase = createClient()
  const ext = uploadFile.name.split('.').pop() || 'jpg'
  const path = `${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from('kindness-wall-images').upload(path, uploadFile, {
    contentType: uploadFile.type,
    upsert: false,
  })
  if (error) throw error

  const { data } = supabase.storage.from('kindness-wall-images').getPublicUrl(path)
  return data.publicUrl
}
