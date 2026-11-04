import { Router } from 'express'
import { tatumRpc, tatumFetch } from '../tatum-client.mjs'

const router = Router()
const SUI = {
  '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC': 'USDC',
  '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d481574effb::coin::COIN': 'USDT',
}
const EVM = { USDC: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', USDT: '0xdac17f958d2ee523a2206206994597c13d831ec7' }
const TRANSFER = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
const STABLE = new Set(['USDC', 'USDT', 'DAI'])

async function rpc(chain, method, params) {
  const r = await tatumRpc(chain, { jsonrpc: '2.0', id: 1, method, params })
  const j = await r.json()
  if (j.error) throw new Error(`${method}: ${j.error.message || JSON.stringify(j.error)}`)
  return j.result
}

async function rate(symbol) {
  if (STABLE.has(symbol)) return 1
  try {
    const r = await tatumFetch(`/v4/data/rate/symbol?symbol=${encodeURIComponent(symbol)}&basePair=USD`)
    const v = Number((await r.json()).value)
    return v > 0 ? v : null
  } catch { return null }
}

async function priced(assets) {
  const syms = [...new Set(assets.map((a) => a.symbol))].slice(0, 10)
  const p = {}
  await Promise.all(syms.map(async (s) => { p[s] = await rate(s) }))
  const out = assets.map((a) => ({ ...a, usd: p[a.symbol] == null ? null : a.amount * p[a.symbol] }))
  return { assets: out.sort((x, y) => (y.usd || 0) - (x.usd || 0)), total: out.reduce((s, a) => s + (a.usd || 0), 0) }
}

const meta = new Map()
async function info(ct) {
  if (meta.has(ct)) return meta.get(ct)
  let v
  if (SUI[ct]) v = { sym: SUI[ct], dec: 6 }
  else {
    try { const m = await rpc('sui', 'suix_getCoinMetadata', [ct]); v = { sym: m?.symbol || ct.split('::').pop(), dec: m?.decimals ?? 9 } }
    catch { v = { sym: ct.split('::').pop(), dec: 9 } }
  }
  meta.set(ct, v)
  return v
}

router.post('/sui-activity', async (req, res) => {
  const address = String(req.body?.address || '')
  if (!/^0x[0-9a-fA-F]{1,64}$/.test(address)) return res.status(400).json({ success: false, error: 'Invalid Sui address' })
  try {
    const bals = (await rpc('sui', 'suix_getAllBalances', [address])).filter((c) => Number(c.totalBalance)).slice(0, 12)
    const raw = await Promise.all(bals.map(async (c) => { const i = await info(c.coinType); return { symbol: i.sym, amount: Number(c.totalBalance) / 10 ** i.dec } }))
    const { assets, total } = await priced(raw)
    const opts = { showBalanceChanges: true }
    const [a, b] = await Promise.all(
      [{ ToAddress: address }, { FromAddress: address }].map((filter) => rpc('sui', 'suix_queryTransactionBlocks', [{ filter, options: opts }, null, 25, true])),
    )
    const seen = new Set(), feed = []
    for (const tx of [...a.data, ...b.data]) {
      if (seen.has(tx.digest)) continue
      seen.add(tx.digest)
      for (const ch of tx.balanceChanges || []) {
        if (ch.owner?.AddressOwner?.toLowerCase() !== address.toLowerCase()) continue
        const i = await info(ch.coinType)
        const amt = Number(ch.amount) / 10 ** i.dec
        if (amt) feed.push({ id: tx.digest + i.sym, dir: amt > 0 ? 'in' : 'out', amount: Math.abs(amt), coin: i.sym, ts: Number(tx.timestampMs) })
      }
    }
    feed.sort((x, y) => y.ts - x.ts)
    res.json({ success: true, chain: 'sui', assets, total, feed: feed.slice(0, 30) })
  } catch (e) { res.json({ success: false, error: e.message }) }
})

router.post('/evm-activity', async (req, res) => {
  const address = String(req.body?.address || '').toLowerCase()
  if (!/^0x[0-9a-f]{40}$/.test(address)) return res.status(400).json({ success: false, error: 'Invalid EVM address' })
  try {
    const pad = '0x' + '0'.repeat(24) + address.slice(2)
    const raw = [{ symbol: 'ETH', amount: Number(BigInt(await rpc('ethereum', 'eth_getBalance', [address, 'latest']))) / 1e18 }]
    for (const [symbol, t] of Object.entries(EVM)) {
      const h = await rpc('ethereum', 'eth_call', [{ to: t, data: '0x70a08231' + pad.slice(2) }, 'latest'])
      raw.push({ symbol, amount: Number(BigInt(h)) / 1e6 })
    }
    const { assets, total } = await priced(raw.filter((a) => a.amount > 0))
    const latest = parseInt(await rpc('ethereum', 'eth_blockNumber', []), 16)
    const from = '0x' + (latest - 2000).toString(16)
    const q = (topics) => rpc('ethereum', 'eth_getLogs', [{ fromBlock: from, toBlock: 'latest', address: Object.values(EVM), topics }])
    const [ins, outs] = await Promise.all([q([TRANSFER, null, pad]), q([TRANSFER, pad])])
    const coinOf = (a) => (a.toLowerCase() === EVM.USDC ? 'USDC' : 'USDT')
    const logs = [...ins.map((l) => ({ l, dir: 'in' })), ...outs.map((l) => ({ l, dir: 'out' }))]
      .sort((x, y) => parseInt(y.l.blockNumber, 16) - parseInt(x.l.blockNumber, 16)).slice(0, 15)
    const ts = {}
    for (const { l } of logs) if (!ts[l.blockNumber]) ts[l.blockNumber] = Number((await rpc('ethereum', 'eth_getBlockByNumber', [l.blockNumber, false])).timestamp) * 1000
    const feed = logs.map(({ l, dir }) => ({ id: l.transactionHash + l.logIndex, dir, amount: Number(BigInt(l.data)) / 1e6, coin: coinOf(l.address), ts: ts[l.blockNumber] }))
    res.json({ success: true, chain: 'ethereum', assets, total, feed })
  } catch (e) { res.json({ success: false, error: e.message }) }
})

export default router
