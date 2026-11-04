import { MemWal } from '@mysten-incubation/memwal'

let client = null
let lastError = null
export const localMemories = [] // cache of this server's writes; Walrus is the source of truth
export const memoryAuditLog = [] // only REAL blob ids from Walrus ever go here

const configured = () => !!(process.env.MEMWAL_PRIVATE_KEY && process.env.MEMWAL_ACCOUNT_ID)

function getClient() {
  if (client) return client
  if (!configured()) return null
  client = MemWal.create({
    key: process.env.MEMWAL_PRIVATE_KEY,
    accountId: process.env.MEMWAL_ACCOUNT_ID,
    serverUrl: process.env.MEMWAL_SERVER_URL || 'https://relayer.memory.walrus.xyz',
    namespace: process.env.MEMWAL_NAMESPACE || 'diction',
  })
  return client
}

export const walrusStatus = () => ({ configured: configured(), lastError, confirmedWrites: memoryAuditLog.length })

async function attempt(rec, tries = 0) {
  const c = getClient()
  if (!c) { rec.status = 'not_configured'; lastError = 'MEMWAL_PRIVATE_KEY / MEMWAL_ACCOUNT_ID not set'; return false }
  try {
    const r = await c.rememberAndWait(`[${rec.type}] ${rec.text}`)
    rec.status = 'confirmed'
    rec.blobId = r.blob_id
    memoryAuditLog.unshift({ timestamp: new Date().toISOString(), type: rec.type, blobId: r.blob_id, status: 'confirmed' })
    lastError = null
    return true
  } catch (err) {
    lastError = err?.message || String(err)
    console.error('Walrus write failed:', lastError)
    if (tries < 3) {
      rec.status = 'retry_scheduled'
      setTimeout(() => attempt(rec, tries + 1), 20000 * (tries + 1))
    } else rec.status = 'failed'
    return false
  }
}

export async function saveMemory(type, text) {
  const rec = { id: 'mem_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7), type, text, createdAt: new Date().toISOString(), status: 'pending', blobId: null }
  localMemories.unshift(rec)
  const ok = await attempt(rec)
  return { success: ok, memory: rec, error: ok ? undefined : lastError }
}

export async function recallMemories(question, limit = 8) {
  const c = getClient()
  if (!c) return []
  try {
    const r = await c.recall({ query: question, limit })
    return (r.results || []).map((m) => m.text)
  } catch (err) { lastError = err?.message || String(err); return [] }
}

// After a server restart the cache is empty: rebuild it from Walrus itself.
export async function hydrate() {
  const c = getClient()
  if (!c || localMemories.length) return
  try {
    const r = await c.recall({ query: 'client payment paycheck tax bill', limit: 50 })
    for (const m of r.results || []) {
      localMemories.push({ id: m.blob_id, type: 'recalled', text: m.text, createdAt: m.created_at || '', status: 'confirmed', blobId: m.blob_id })
    }
  } catch (err) { lastError = err?.message || String(err) }
}
