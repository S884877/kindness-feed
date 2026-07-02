import WallClient from '@/components/WallClient'
import { fetchInitialMoments } from '@/lib/moments'

type Props = { searchParams: Promise<{ ref?: string }> }

export default async function Home({ searchParams }: Props) {
  const { ref } = await searchParams
  const moments = await fetchInitialMoments()

  return <WallClient initialMoments={moments} initialRef={ref} />
}
