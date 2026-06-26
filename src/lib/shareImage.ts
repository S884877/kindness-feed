import { Moment } from './types'
import { MOODS, isMood } from './moods'

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export async function renderMomentImage(moment: Moment): Promise<Blob> {
  const W = 1080
  const H = 1350
  const PAD = 110
  const innerW = W - PAD * 2

  try {
    await Promise.all([
      (document as any).fonts.load('600 64px Fraunces'),
      (document as any).fonts.load('italic 400 40px Fraunces'),
      (document as any).fonts.load('600 26px Inter'),
      (document as any).fonts.ready,
    ])
  } catch {}

  const dpr = 2
  const canvas = document.createElement('canvas')
  canvas.width = W * dpr
  canvas.height = H * dpr
  const ctx = canvas.getContext('2d')!
  ctx.scale(dpr, dpr)

  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, '#f6efe4')
  grad.addColorStop(1, '#efe4d4')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  ctx.save()
  ctx.shadowColor = 'rgba(80, 60, 40, 0.12)'
  ctx.shadowBlur = 60
  ctx.shadowOffsetY = 24
  ctx.fillStyle = '#fffdf9'
  roundRect(ctx, 64, 80, W - 128, H - 160, 44)
  ctx.fill()
  ctx.restore()

  let y = 190

  ctx.fillStyle = 'rgba(194, 103, 76, 0.22)'
  ctx.font = '600 150px Fraunces, Georgia, serif'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText('"', PAD - 8, y + 40)

  y += 90

  if (isMood(moment.mood)) {
    const m = MOODS[moment.mood]
    ctx.font = '600 26px Inter, sans-serif'
    const label = m.label
    const tw = ctx.measureText(label).width
    const chipW = tw + 52
    const chipH = 52
    ctx.fillStyle = m.chipBg
    roundRect(ctx, PAD, y, chipW, chipH, 26)
    ctx.fill()
    ctx.fillStyle = m.chipText
    ctx.textBaseline = 'middle'
    ctx.fillText(label, PAD + 26, y + chipH / 2 + 1)
    y += chipH + 56
  } else {
    y += 16
  }

  ctx.fillStyle = '#2c2620'
  ctx.font = '600 60px Fraunces, Georgia, serif'
  ctx.textBaseline = 'alphabetic'
  const kindnessLines = wrapText(ctx, moment.kindness, innerW)
  const kLineH = 78
  for (const line of kindnessLines) {
    ctx.fillText(line, PAD, y)
    y += kLineH
  }

  y += 34

  ctx.fillStyle = '#7a6c5d'
  ctx.font = 'italic 400 42px Fraunces, Georgia, serif'
  const feelingLines = wrapText(ctx, moment.feeling, innerW)
  const fLineH = 60
  for (const line of feelingLines) {
    ctx.fillText(line, PAD, y)
    y += fLineH
  }

  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(194, 103, 76, 0.16)'
  ctx.fillRect(W / 2 - 30, H - 196, 60, 3)
  ctx.fillStyle = '#c2674c'
  ctx.font = '600 32px Fraunces, Georgia, serif'
  ctx.fillText('the kindness project', W / 2, H - 140)
  ctx.fillStyle = '#b3a596'
  ctx.font = '400 24px Inter, sans-serif'
  ctx.fillText('small moments of kindness', W / 2, H - 104)
  ctx.textAlign = 'left'

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('canvas export failed'))),
      'image/png'
    )
  })
}
