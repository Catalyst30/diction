import { MemWal } from '@mysten-incubation/memwal'

let lastError = null
const clients = new Map()
export const localMemories = []
export const memoryAuditLog = []

const configured = () => !!(process.env.MEMWAL_PRIVATE_KEY && process.env.MEMWAL_ACCOUNT_ID)
const nsFor = (userId) => (userId ? 'u_' + String(userId).replace(/[^a-zA-Z0-9]/g, '') : process.env.MEMWAL_NAMESPACE || 'diction')

function getClient(userId) {
  const ns = nsFor(userId)
  if (clients.has(ns)) return clients.get(ns)
  if (!configured()) return null
  const c = MemWal.create({
    key: process.env.MEMWAL_PRIVATE_KEY,
    accountId: process.env.MEMWAL_ACCOUNT_ID,
    serverUrl: process.env.MEMWAL_SERVER_URL || 'https://relayer.memory.walrus.xyz',
    namespace: ns,
  })
  clients.set(ns, c)
  return c
}

export const walrusStatus = () => ({ configured: configured(), lastError, confirmedWrites: memoryAuditLog.length })

async function attempt(rec, tries = 0) {
  const c = getClient(rec.userId)
  if (!c) { rec.status = 'not_configured'; lastError = 'MEMWAL_PRIVATE_KEY / MEMWAL_ACCOUNT_ID not set'; return false }
  try {
    const r = await c.rememberAndWait(`[${rec.type}] ${rec.text}`)
    rec.status = 'confirmed'
    rec.blobId = r.blob_id
    memoryAuditLog.unshift({ timestamp: new Date().toISOString(), type: rec.type, blobId: r.blob_id, status: 'confirmed', userId: rec.userId })
    lastError = null
    return true
  } catch (err) {
    lastError = err?.message || String(err)
    console.error('Walrus write failed:', lastError)
    if (tries < 3) { rec.status = 'retry_scheduled'; setTimeout(() => attempt(rec, tries + 1), 20000 * (tries + 1)) }
    else rec.status = 'failed'
    return false
  }
}

export async function saveMemory(type, text, userId) {
  const rec = { id: 'mem_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7), type, text, createdAt: new Date().toISOString(), status: 'pending', blobId: null, userId }
  localMemories.unshift(rec)
  const ok = await attempt(rec)
  return { success: ok, memory: rec, error: ok ? undefined : lastError }
}

export async function recallMemories(question, limit = 8, userId) {
  const c = getClient(userId)
  if (!c) return []
  try { return ((await c.recall({ query: question, limit })).results || []).map((m) => m.text) }
  catch (err) { lastError = err?.message || String(err); return [] }
}

export async function hydrate(userId) {
  const c = getClient(userId)
  if (!c || localMemories.some((m) => m.userId === userId)) return
  try {
    const r = await c.recall({ query: 'client payment paycheck tax bill', limit: 50 })
    for (const m of r.results || []) localMemories.push({ id: m.blob_id, type: 'recalled', text: m.text, createdAt: m.created_at || '', status: 'confirmed', blobId: m.blob_id, userId })
  } catch (err) { lastError = err?.message || String(err) }
}
