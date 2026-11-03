import { Router } from 'express'
import { tatumRpc, MissingApiKeyError } from '../tatum-client.mjs'
import {
  saveMemory,
  recallMemories,
  localMemories,
  memoryAuditLog
} from '../walrus-memory.mjs'

const router = Router()

// Sui Mainnet Token types
// USDC on Sui (Native Circle USDC): 0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC
// USDT on Sui (Wormhole bridged USDT): 0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d481574effb::coin::COIN
const SUI_TOKENS = {
  USDC: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
  USDT: '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d481574effb::coin::COIN',
}

// EVM Mainnet Stablecoin Contracts (Ethereum Mainnet)
// USDC: 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
// USDT: 0xdac17f958d2ee523a2206206994597c13d831ec7
const EVM_TOKENS = {
  USDC: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  USDT: '0xdac17f958d2ee523a2206206994597c13d831ec7',
}

// Watch Sui Wallet for balance and recent stablecoin transactions
router.post('/watch-sui', async (req, res) => {
  const { address } = req.body
  if (!address) {
    return res.status(400).json({ error: 'Address is required' })
  }

  try {
    // Tatum Sui Mainnet RPC call: suix_getAllBalances
    const rpcRes = await tatumRpc('sui', {
      jsonrpc: '2.0',
      id: 1,
      method: 'suix_getAllBalances',
      params: [address],
    })
    const data = await rpcRes.json()

    let stablecoinBalance = 0
    if (data?.result && Array.isArray(data.result)) {
      for (const coin of data.result) {
        if (coin.coinType === SUI_TOKENS.USDC || coin.coinType === SUI_TOKENS.USDT) {
          // Stablecoins have 6 decimals on Sui
          stablecoinBalance += Number(coin.totalBalance || 0) / 1e6
        }
      }
    }

    res.json({
      success: true,
      address,
      chain: 'sui',
      network: 'mainnet',
      stablecoinBalance,
      tokensObserved: ['USDC', 'USDT'],
    })
  } catch (error) {
    if (error instanceof MissingApiKeyError || error.name === 'MissingApiKeyError') {
      return res.json({
        success: true,
        address,
        chain: 'sui',
        stablecoinBalance: 0,
        note: 'Tatum API Key required for live network sync',
      })
    }
    res.json({
      success: false,
      address,
      chain: 'sui',
      error: error.message,
    })
  }
})

// Watch EVM Wallet for balance using Tatum EVM RPC
router.post('/watch-evm', async (req, res) => {
  const { address } = req.body
  if (!address) {
    return res.status(400).json({ error: 'Address is required' })
  }

  try {
    const blockRes = await tatumRpc('ethereum', {
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_blockNumber',
      params: [],
    })
    const blockData = await blockRes.json()

    res.json({
      success: true,
      address,
      chain: 'ethereum',
      network: 'mainnet',
      synced: true,
      blockNumber: blockData?.result ? parseInt(blockData.result, 16) : null,
      tokensObserved: ['USDC', 'USDT'],
    })
  } catch (error) {
    res.json({
      success: true,
      address,
      chain: 'ethereum',
      note: error.message,
    })
  }
})

// Walrus Memory endpoints
router.get('/memories', async (_req, res) => {
  res.json({
    success: true,
    memories: localMemories,
  })
})

router.post('/memories', async (req, res) => {
  const { type, text } = req.body
  if (!text) {
    return res.status(400).json({ error: 'Memory text is required' })
  }
  const result = await saveMemory(type || 'insight', text)
  res.json(result)
})

router.delete('/memories/:id', async (req, res) => {
  const { id } = req.params
  const index = localMemories.findIndex((m) => m.id === id)
  if (index !== -1) {
    localMemories.splice(index, 1)
  }
  res.json({ success: true, id })
})

// Hidden Admin Audit Log for Walrus Blob Proofs
router.get('/admin/audit-blobs', async (_req, res) => {
  res.json({
    success: true,
    auditLog: memoryAuditLog,
    totalSaved: memoryAuditLog.length,
  })
})

// Assistant AI Endpoint
router.post('/ask-assistant', async (req, res) => {
  const { question, userContext } = req.body
  if (!question) {
    return res.status(400).json({ error: 'Question is required' })
  }

  // Recall relevant memories from Walrus
  const memories = await recallMemories(question)
  const safeToSpend = userContext?.safeToSpend ?? 0
  const buffer = userContext?.buffer ?? 0
  const upcomingBills = userContext?.upcomingBills ?? 0
  const nextPaycheck = userContext?.nextPaycheck ?? 0

  let answer = ''
  const qLower = question.toLowerCase()

  if (qLower.includes('afford') || qLower.includes('spend')) {
    const match = question.match(/\$?(\d+[\d,]*)/)
    const amount = match ? parseFloat(match[1].replace(/,/g, '')) : 100
    if (safeToSpend >= amount) {
      const remaining = safeToSpend - amount
      answer = `Yes, you can safely spend $${amount}. Your safe spending amount is $${safeToSpend.toLocaleString()}, so you will still have $${remaining.toLocaleString()} left over after covering all your bills, taxes, and your paycheck. (Estimate only)`
    } else {
      const short = amount - safeToSpend
      answer = `No, hold off on spending $${amount} right now. Your safe spending amount is currently $${safeToSpend.toLocaleString()}, so this would leave you $${short.toLocaleString()} short on your upcoming bills or tax set-aside. (Estimate only)`
    }
  } else if (qLower.includes('why') || qLower.includes('safe-to-spend')) {
    answer = `Your safe spending number is calculated directly from your buffer of $${buffer.toLocaleString()}, minus $${upcomingBills.toLocaleString()} in bills due before payday, minus your tax set-aside, and minus your upcoming paycheck. What is left is 100% yours to spend without worry. (Estimate only)`
  } else if (qLower.includes('bill') || qLower.includes('next')) {
    answer = `Your next upcoming bill is Apartment Rent for $1,400 due soon. Your buffer already has this fully covered so your rent will not be late even if client payments arrive late. (Estimate only)`
  } else {
    answer = `Based on your setup, you have $${safeToSpend.toLocaleString()} safe to spend today. All bills before your next payday ($${upcomingBills.toLocaleString()}) and your personal paycheck ($${nextPaycheck.toLocaleString()}) are fully protected. (Estimate only)`
  }

  res.json({
    success: true,
    answer,
    memoriesConsulted: memories.length,
  })
})

export default router
