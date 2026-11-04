import '../server/proxy-bootstrap.mjs'
import '../server/credentials-store.mjs'
import express from 'express'
import tatumRoutes from '../server/routes/tatum.mjs'
import walletRoutes from '../server/routes/wallet.mjs'
import { credentialGuard } from '../server/credential-guard.mjs'

const app = express()
app.use(express.json())
app.use(credentialGuard)
app.use('/api/tatum', tatumRoutes)
app.use('/api/wallet', walletRoutes)

export default app
