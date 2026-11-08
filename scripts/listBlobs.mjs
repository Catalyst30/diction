// Run locally:  node --env-file=.env scripts/listBlobs.mjs
import { MemWal } from '@mysten-incubation/memwal'

const c = MemWal.create({
  key: process.env.MEMWAL_PRIVATE_KEY,
  accountId: process.env.MEMWAL_ACCOUNT_ID,
  serverUrl: process.env.MEMWAL_SERVER_URL || 'https://relayer.memory.walrus.xyz',
  namespace: 'diction',
})

const byNs = {}
let cursor
let more = true
while (more) {
  const page = await c.listMemories({ cursor })
  for (const m of page.memories) (byNs[m.namespace_id] ||= []).push(m)
  cursor = page.next_cursor ?? undefined
  more = page.has_more
}
for (const [ns, list] of Object.entries(byNs)) {
  console.log(`\nNamespace: ${ns} (${list.length})`)
  for (const m of list) console.log(`  ${m.created_at}  ${m.blob_id}  ${m.status}`)
}
if (!Object.keys(byNs).length) console.log('No memories found on this account.')
