import { Router } from 'express'
import { saveMemory, recallMemories, localMemories, memoryAuditLog, hydrate, walrusStatus } from '../walrus-memory.mjs'

const router = Router()

router.get('/walrus-status', (_req, res) => res.json(walrusStatus()))

router.get('/memories', async (req, res) => {
  try {
    await hydrate(req.userId)
    res.json({ success: true, memories: localMemories.filter((m) => m.userId === req.userId) })
  } catch (e) {
    res.status(500).json({ success: false, error: e?.message || String(e) })
  }
})

router.post('/memories', async (req, res) => {
  try {
    const { type, text } = req.body
    if (!text) return res.status(400).json({ error: 'Memory text is required' })
    res.json(await saveMemory(type || 'insight', text, req.userId))
  } catch (e) {
    res.status(500).json({ success: false, error: e?.message || String(e) })
  }
})

router.delete('/memories/:id', async (req, res) => {
  const i = localMemories.findIndex((m) => m.id === req.params.id && m.userId === req.userId)
  if (i !== -1) localMemories.splice(i, 1)
  res.json({ success: true, id: req.params.id })
})

router.get('/admin/audit-blobs', async (req, res) => {
  const log = memoryAuditLog.filter((e) => e.userId === req.userId)
  res.json({ success: true, auditLog: log, totalSaved: log.length })
})

router.post('/ask-assistant', async (req, res) => {
  try {
    const { question, userContext = {} } = req.body || {}
    if (!question) return res.status(400).json({ error: 'Question is required' })

    const recalled = await recallMemories(question, 6, req.userId)
    const { safeToSpend = 0, buffer = 0, upcomingBills = 0, nextPaycheck = 0, clients = [], nextBill } = userContext
    const money = (n) => '$' + Math.round(n).toLocaleString()
    const learned = clients
      .filter((c) => c.seen > 0)
      .map((c) => `${c.name} now counts at ${Math.round(c.trust * 100)}% (it was ${Math.round(c.before * 100)}%) because ${c.seen} saved payment${c.seen > 1 ? 's' : ''} show they usually pay ${c.avgLag > 2 ? c.avgLag + ' days late' : 'on time'}`)
    const notes = recalled
      .filter((t) => !t.includes('PAYMENT_LAG'))
      .map((t) => t.replace(/^\[[^\]]*\]\s*/, '').trim())
      .filter(Boolean)
      .slice(0, 2)

    const q = question.toLowerCase()
    let answer
    if (q.includes('why') || q.includes('how is') || q.includes('number')) {
      answer = `Your safe-to-spend of ${money(safeToSpend)} starts from your buffer of ${money(buffer)}, then takes off ${money(upcomingBills)} of bills due before payday, your tax set-aside, and your next paycheck of ${money(nextPaycheck)}. Money you are still waiting for is added only in part, based on how reliably each client pays.`
      if (learned.length) answer += ` What I have learned: ${learned.join('; ')}.`
    } else if (q.includes('bill') || q.includes('due') || q.includes('next')) {
      answer = nextBill
        ? `Your next bill is ${nextBill.name} for ${money(nextBill.amount)}, due ${nextBill.dueDate}. Your buffer is set up so bills and your paycheck are covered before spending money.`
        : `I don't see any bills yet. Add them on the Bills page and I'll track what is due before payday.`
    } else if (q.includes('afford') || q.includes('spend') || /\$\s?\d/.test(question)) {
      const m = question.match(/\$?\s?(\d[\d,]*)/)
      const amount = m ? parseFloat(m[1].replace(/,/g, '')) : 100
      answer = safeToSpend >= amount
        ? `Yes, you can safely spend ${money(amount)}. You would still have ${money(safeToSpend - amount)} safe to spend afterwards.`
        : `Not right now. ${money(amount)} is ${money(amount - safeToSpend)} more than your safe-to-spend of ${money(safeToSpend)}.`
      if (learned.length) answer += ` I'm being careful about money you are waiting for: ${learned.slice(0, 2).join('; ')}.`
    } else {
      answer = `You have ${money(safeToSpend)} safe to spend today, after bills of ${money(upcomingBills)} before payday and your paycheck of ${money(nextPaycheck)}.`
      if (learned.length) answer += ` ${learned[0]}.`
    }
    if (notes.length) answer += ` From your notes I also remember: ${notes.join(' | ')}.`
    answer += ' (Estimates only.)'

    res.json({ success: true, answer, memoriesConsulted: recalled.length, usedLearning: learned.length })
  } catch (e) {
    res.status(500).json({ success: false, error: e?.message || String(e) })
  }
})

export default router
