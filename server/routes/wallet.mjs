import { Router } from 'express'
import { SuiGrpcClient } from '@mysten/sui/grpc'
import { GrpcTransport } from '@protobuf-ts/grpc-transport'
import { ChannelCredentials } from '@grpc/grpc-js'
import { tatumRpc, tatumFetch } from '../tatum-client.mjs'

const router = Router()
const SUI_COINS = {
  '0x2::sui::SUI': { sym: 'SUI', dec: 9 },
  '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC': { sym: 'USDC', dec: 6 },
  '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d481574effb::coin::COIN': { sym: 'USDT', dec: 6 },
  '0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59::wal::WAL': { sym: 'WAL', dec: 9 },
}
const EVM = { USDC: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', USDT: '0xdac17f958d2ee523a2206206994597c13d831ec7' }
const TRANSFER = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
const STABLE = new Set(['USDC', 'USDT', 'DAI'])

async function rpc(chain, method, params) {
  const r = await tatumRpc(chain, { jsonrpc: '2.0', id: 1, method, params })
  const text = await r.text()
  let j
  try { j = JSON.parse(text) } catch { throw new Error(`${method}: Tatum replied (${r.status}) ${text.slice(0, 160)}`) }
  if (j.error) throw new Error(`${method}: ${j.error.message || JSON.stringify(j.error)}`)
  if (j.result === undefined) throw new Error(`${method}: empty reply from Tatum (${r.status}) ${text.slice(0, 160)}`)
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

let grpc
function sui() {
  if (!grpc) {
    grpc = new SuiGrpcClient({
      network: 'mainnet',
      transport: new GrpcTransport({
        host: 'sui-mainnet-grpc.gateway.tatum.io:443',
        channelCredentials: ChannelCredentials.createSsl(),
        meta: { 'x-api-key': process.env.TATUM_API_KEY || '' },
      }),
    })
  }
  return grpc
}

async function suiAssets(address) {
  const g = sui()
  let list
  try { list = (await g.listBalances({ owner: address, limit: 50 })).balances }
  catch {
    list = await Promise.all(Object.keys(SUI_COINS).map(async (coinType) => ({ coinType, balance: (await g.getBalance({ owner: address, coinType })).balance.balance })))
  }
  const held = list.filter((b) => Number(b.balance) > 0).slice(0, 12)
  return Promise.all(held.map(async (b) => {
    let c = SUI_COINS[b.coinType]
    if (!c) {
      try { const m = (await g.getCoinMetadata({ coinType: b.coinType })).coinMetadata; c = { sym: m?.symbol || b.coinType.split('::').pop(), dec: m?.decimals ?? 9 } }
      catch { c = { sym: b.coinType.split('::').pop(), dec: 9 } }
    }
    return { symbol: c.sym, amount: Number(b.balance) / 10 ** c.dec }
  }))
}

router.post('/sui-activity', async (req, res) => {
  const address = String(req.body?.address || '')
  if (!/^0x[0-9a-fA-F]{1,64}$/.test(address)) return res.status(400).json({ success: false, error: 'Invalid Sui address' })
  try {
    const { assets, total } = await priced(await suiAssets(address))
    res.json({ success: true, chain: 'sui', assets, total, feed: [], note: '' })
  } catch (e) { res.json({ success: false, error: 'Sui (gRPC): ' + (e?.message || e) }) }
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
