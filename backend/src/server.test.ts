import request from 'supertest'
import { describe, expect, it } from 'vitest'
import app from './server.js'

describe('Backend server', () => {
  it('responds to GET /', async () => {
    const response = await request(app).get('/')
    expect(response.status).toBe(200)
    expect(response.text).toBe('FLAMEIQ backend running')
  })

  it('rejects profile updates without authentication', async () => {
    const response = await request(app).patch('/api/auth/profile')
    expect(response.status).toBe(401)
    expect(response.body.success).toBe(false)
  })
})
