export async function saveChainCanvas(chainId: string, payload: { name?: string; canvasState: any }) {
  const res = await fetch(`/api/chains/${chainId}/canvas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to save chain canvas')
  return res.json()
}

export async function getChain(chainId: string) {
  const res = await fetch(`/api/chains/${chainId}`, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to load chain')
  return res.json()
}


