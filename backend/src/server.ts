import express from 'express'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { notificationService } from './services/notificationService.js'
import { predictionJob } from './jobs/predictionJob.js'
import { authenticate, signIn, signUp, updateProfile } from './controllers/authControl.js'
import orderRoutes from './routes/orderRoutes.js'
import ipTracker from './utils/ipTracker.js'
import httpLogger from './utils/httpLogger.js'
import { setupSwagger } from './config/swagger.js'

dotenv.config()

const app = express()
app.use(express.json())

app.use(ipTracker)
app.use(httpLogger)

setupSwagger(app)

app.get('/', (req, res) => {
  res.send('FLAMEIQ backend running')
})

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 */
app.post('/api/auth/signup', signUp)

/**
 * @swagger
 * /api/auth/signin:
 *   post:
 *     summary: Sign in with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sign-in completed
 *       401:
 *         description: Invalid email or password
 */
app.post('/api/auth/signin', signIn)

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *   patch:
 *     summary: Update user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
app.put('/api/auth/profile', authenticate, updateProfile)
app.patch('/api/auth/profile', authenticate, updateProfile)

// --- Server-Sent Events (SSE) Endpoint for Pop-up Notifications ---
app.get('/api/notifications/stream', (req, res) => {
  const clientId = req.query.clientId as string;
  if (!clientId) {
    return res.status(400).json({ error: 'clientId is required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Flush headers immediately
  res.flushHeaders();

  // Keep connection alive
  res.write(': keep-alive\n\n');

  notificationService.addClient(clientId, res);
});

// --- Order Routes ---
app.use('/api/orders', orderRoutes);

const PORT = process.env.PORT || 3000

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url)

if (isDirectRun) {
  // Initialize background jobs
  predictionJob.start();

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

export default app
