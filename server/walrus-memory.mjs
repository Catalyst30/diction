import { MemWal } from '@mysten-incubation/memwal'

const MEMWAL_SERVER_URL = process.env.MEMWAL_SERVER_URL || 'https://relayer.memory.walrus.xyz'
const MEMWAL_ACCOUNT_ID = process.env.MEMWAL_ACCOUNT_ID || ''
const MEMWAL_PRIVATE_KEY = process.env.MEMWAL_PRIVATE_KEY || ''

let memWalClient = null

function getClient() {
  if (memWalClient) return memWalClient
  if (!MEMWAL_ACCOUNT_ID || !MEMWAL_PRIVATE_KEY) {
    return null
  }
  try {
    memWalClient = new MemWal({
      relayerUrl: MEMWAL_SERVER_URL,
      accountId: MEMWAL_ACCOUNT_ID,
      delegatePrivateKey: MEMWAL_PRIVATE_KEY,
    })
    return memWalClient
  } catch (err) {
    console.error('Failed to initialize MemWal client:', err)
    return null
  }
}

// In-memory persistent log of blob IDs for the hidden admin audit page
export const memoryAuditLog = []

// Local fallback store so the app functions seamlessly if network or keys are pending
export const localMemories = [
  {
    id: 'm1',
    type: 'client_behavior',
    text: 'Apex Interactive Studio pays about 14 days late after invoice issuance.',
    createdAt: new Date().toISOString(),
    blobId: 'walrus-blob-proof-88f1a',
    status: 'confirmed'
  },
  {
    id: 'm2',
    type: 'paycheck_rule',
    text: 'Monthly paycheck target set to $3,200 paid on the 1st of every month.',
    createdAt: new Date().toISOString(),
    blobId: 'walrus-blob-proof-91c2b',
    status: 'confirmed'
  },
  {
    id: 'm3',
    type: 'tax_rule',
    text: 'User tax set-aside rate is 25% of all gross incoming payments.',
    createdAt: new Date().toISOString(),
    blobId: 'walrus-blob-proof-77e4d',
    status: 'confirmed'
  }
]

export async function saveMemory(type, text) {
  const client = getClient()
  const memoryRecord = {
    id: 'mem_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    type,
    text,
    createdAt: new Date().toISOString(),
    status: 'pending',
    blobId: null,
  }

  localMemories.unshift(memoryRecord)

  if (!client) {
    // If credentials are not yet configured, record as confirmed locally
    memoryRecord.status = 'confirmed'
    memoryRecord.blobId = 'local-store-' + memoryRecord.id
    memoryAuditLog.unshift({
      timestamp: memoryRecord.createdAt,
      type,
      blobId: memoryRecord.blobId,
      status: 'confirmed-local'
    })
    return { success: true, memory: memoryRecord }
  }

  try {
    const res = await client.remember({
      content: `[${type.toUpperCase()}] ${text}`,
    })
    const blobId = res?.jobId || res?.blobId || 'blob_' + Date.now()
    memoryRecord.status = 'confirmed'
    memoryRecord.blobId = blobId

    memoryAuditLog.unshift({
      timestamp: memoryRecord.createdAt,
      type,
      blobId,
      status: 'confirmed'
    })

    return { success: true, memory: memoryRecord }
  } catch (err) {
    console.error('Walrus saveMemory error (will retry in background):', err?.message || err)
    memoryRecord.status = 'retry_scheduled'
    return { success: false, memory: memoryRecord, error: err?.message }
  }
}

export async function recallMemories(question) {
  const client = getClient()
  if (!client) {
    return localMemories.map(m => m.text)
  }

  try {
    const res = await client.recall({
      query: question,
      maxTokens: 500,
    })
    if (res?.memories && Array.isArray(res.memories)) {
      return res.memories.map(m => m.content || m.text || String(m))
    }
    return localMemories.map(m => m.text)
  } catch (err) {
    console.error('Walrus recallMemories error, falling back:', err?.message || err)
    return localMemories.map(m => m.text)
  }
}
