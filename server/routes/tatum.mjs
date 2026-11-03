import { Router } from 'express'
import { tatumApiBase, tatumRpc, MissingApiKeyError } from '../tatum-client.mjs'

const router = Router()

// Health check — a present key says nothing about egress, so make a real request.
router.get('/status', async (_req, res) => {
  if (!process.env.TATUM_API_KEY) return res.json({ status: 'no-api-key' })
  try {
    // Any HTTP response proves the request left the pod; the status code doesn't matter.
    await fetch(tatumApiBase(), { signal: AbortSignal.timeout(8000) })
    res.json({ status: 'connected' })
  } catch (error) {
    res.json({ status: 'egress-failed', error: error.message })
  }
})

// Tatum RPC block number and gas price for on-chain buffer state anchoring
router.get('/rpc-status', async (_req, res) => {
  try {
    const blockRes = await tatumRpc('ethereum', {
      jsonrpc: '2.0',
      method: 'eth_blockNumber',
      params: [],
      id: 1,
    })
    const blockData = await blockRes.json()

    const gasRes = await tatumRpc('ethereum', {
      jsonrpc: '2.0',
      method: 'eth_gasPrice',
      params: [],
      id: 2,
    })
    const gasData = await gasRes.json()

    res.json({
      status: 'ok',
      blockNumber: blockData?.result ? parseInt(blockData.result, 16) : null,
      gasPriceWei: gasData?.result ? parseInt(gasData.result, 16) : null,
      chain: 'ethereum-mainnet',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    if (error instanceof MissingApiKeyError || error.name === 'MissingApiKeyError') {
      return res.status(200).json({ status: 'no-api-key', message: 'Tatum API Key is required for live RPC sync' })
    }
    res.status(200).json({ status: 'rpc-error', error: error.message })
  }
})

// Simulate Walrus decentralized blob store state synced with on-chain verification
router.get('/walrus-sync', async (_req, res) => {
  res.json({
    blobId: 'walrus://0x9df48a04b86e2417ac9b1a0e36',
    epoch: 48,
    storageStatus: 'stored_and_certified',
    verifiedOnChain: true,
    rules: {
      minBufferMonths: 2,
      targetMonths: 3,
      taxWithholdingPct: 25,
      autoAdvanceEnabled: true
    },
    clientsTracked: [
      { id: 'c1', name: 'Apex Interactive Studio', avgPaymentLagDays: 14, riskCategory: 'high_delay' },
      { id: 'c2', name: 'Nordic Brand House', avgPaymentLagDays: 3, riskCategory: 'reliable' },
      { id: 'c3', name: 'HyperFlow Media', avgPaymentLagDays: 21, riskCategory: 'high_delay' }
    ]
  })
})

export default router
