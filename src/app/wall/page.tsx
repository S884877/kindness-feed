import WallClient from '@/components/WallClient'
import { fetchInitialMoments } from '@/lib/moments'

export default async function WallPage() {
  const moments = await fetchInitialMoments()
  return <WallClient initialMoments={moments} />
}
