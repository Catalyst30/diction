export async function requireUser(req, res, next) {
  if (req.path === '/tatum/walrus-status') return next() // public health check
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const anon = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!url || !anon) return res.status(500).json({ error: 'Server sign-in is not configured' })
  if (!token) return res.status(401).json({ error: 'Please sign in' })
  try {
    const r = await fetch(`${url.replace(/\/+$/, '')}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` } })
    if (!r.ok) return res.status(401).json({ error: 'Please sign in again' })
    req.userId = (await r.json()).id
    next()
  } catch { res.status(401).json({ error: 'Could not verify your sign-in' }) }
}
