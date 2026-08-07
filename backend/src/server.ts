import express from 'express'
import dotenv from 'dotenv'
import { notificationService } from './services/notificationService.js'
import { predictionJob } from './jobs/predictionJob.js'
import orderRoutes from './routes/orderRoutes.js'

dotenv.config()

const app = express()
app.use(express.json())

app.get('/', (req, res) => {
  res.send('FLAMEIQ backend running')
})

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

// Initialize background jobs
predictionJob.start();

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${PORT}`)
})

export default app
