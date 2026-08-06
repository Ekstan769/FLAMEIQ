import express from 'express'
import dotenv from 'dotenv'
import { notificationService } from './services/notificationService.js'
import { predictionJob } from './jobs/predictionJob.js'

dotenv.config()

const app = express()
app.use(express.json())

app.get('/', (req, res) => {
  res.send('FLAMEIQ backend running')
})

// --- Server-Sent Events (SSE) Endpoint for Pop-up Notifications ---
app.get('/api/notifications/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Flush headers immediately
  res.flushHeaders();

  // Keep connection alive
  res.write(': keep-alive\n\n');

  notificationService.addClient(res);
});


const PORT = process.env.PORT || 3000

// Initialize background jobs
predictionJob.start();

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${PORT}`)
})

export default app
