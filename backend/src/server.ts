import './types/express.d.js';

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import multer from 'multer';
import { notificationService } from './services/notificationService.js'
import { predictionJob } from './jobs/predictionJob.js';
import { authenticate, authorizeAdmin, deleteSelf, deleteUsers, forgotPassword, getMe, getUsers, resetPassword, signIn, signUp, updateProfile, verifyOtp } from './controllers/authControl.js';
import { uploadProfilePicture } from './controllers/uploadController.js';
import { handleFlutterwaveWebhook } from './controllers/paymentController.js';
import orderRoutes from './routes/orderRoutes.js';
import cylinderRoutes from './routes/cylinderRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import ipTracker from './utils/ipTracker.js'
import httpLogger from './utils/httpLogger.js'
import { setupSwagger } from './config/swagger.js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

// Multer setup for in-memory file storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify user account with OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account verified successfully, returns JWT
 */
app.post('/api/auth/verify-otp', verifyOtp);

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
app.post('/api/auth/login', signIn)

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request a password reset OTP
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
 *     responses:
 *       200:
 *         description: A confirmation message is sent
 */
app.post('/api/auth/forgot-password', forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with a valid OTP
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
 *               otp:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password has been reset successfully
 */
app.post('/api/auth/reset-password', resetPassword);

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

/**
 * @swagger
 * /api/auth/profile/picture:
 *   post:
 *     summary: Upload or update a user's profile picture
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile picture updated successfully.
 *       400:
 *         description: No file uploaded.
 */
app.post('/api/auth/profile/picture', authenticate, upload.single('profileImage'), uploadProfilePicture);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get the profile of the currently authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data retrieved successfully.
 *       401:
 *         description: Unauthorized.
 */
app.get('/api/auth/me', authenticate, getMe);
/**
 * @swagger
 * /api/auth/me:
 *   delete:
 *     summary: Deletes the currently authenticated user's account (soft delete)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account soft-deleted successfully
 */
app.delete('/api/auth/me', authenticate, deleteSelf);

// --- Admin & User Management Routes ---

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of users
 */
app.get('/api/users', authenticate, authorizeAdmin, getUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user by ID (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User soft-deleted successfully
 */
app.delete('/api/users/:id', authenticate, authorizeAdmin, deleteUsers);

// --- Server-Sent Events (SSE) Endpoint for Pop-up Notifications ---
/**
 * @swagger
 * /api/notifications/stream:
 *   get:
 *     summary: Establishes a Server-Sent Events (SSE) connection for real-time notifications.
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *         required: true
 *         description: A unique identifier for the client establishing the connection.
 *     responses:
 *       200:
 *         description: SSE connection established. Events will be streamed.
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *               example: "data: {\"title\":\"New Order Received\",\"message\":\"You have a new standard order! Total: $120.00\",\"type\":\"info\",\"timestamp\":\"2023-10-27T10:00:00.000Z\"}\n\n"
 *       400:
 *         description: clientId is required.
 */
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

  notificationService.addClient(res);
});

// --- Order Routes ---
/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: API for managing user and vendor orders
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vendorId
 *               - items
 *               - type
 *             properties:
 *               vendorId:
 *                 type: string
 *                 description: The ID of the vendor to place the order with.
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - quantity
 *                     - price
 *                   properties:
 *                     name:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                     price:
 *                       type: number
 *                       format: float
 *                 description: Array of items in the order.
 *               type:
 *                 type: string
 *                 enum: [STANDARD, QUICK]
 *                 description: Type of the order (STANDARD or QUICK).
 *               cylinderId:
 *                 type: string
 *                 nullable: true
 *                 description: Optional ID of the user's cylinder being refilled.
 *     responses:
 *       201:
 *         description: Order created successfully.
 *       400:
 *         description: Invalid input.
 *       500:
 *         description: Server error.
 *   get:
 *     summary: Get all orders for the authenticated user (customer or vendor)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of orders.
 *       500:
 *         description: Server error.
 */
/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   patch:
 *     summary: Cancel a pending order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the order to cancel.
 *     responses:
 *       200:
 *         description: Order cancelled successfully.
 *       400:
 *         description: Order cannot be cancelled in its current state or is a quick order.
 *       404:
 *         description: Order not found or unauthorized.
 *       500:
 *         description: Server error.
 */
/**
 * @swagger
 * /api/orders/{id}/accept:
 *   patch:
 *     summary: Vendor accepts a pending order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the order to accept.
 *     responses:
 *       200:
 *         description: Order accepted successfully.
 *       400:
 *         description: Order cannot be accepted in its current state.
 *       403:
 *         description: Forbidden (not a vendor).
 *       404:
 *         description: Order not found or unauthorized.
 *       500:
 *         description: Server error.
 */
/**
 * @swagger
 * /api/orders/{id}/on-route:
 *   patch:
 *     summary: Vendor marks an accepted order as on route for delivery
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the order to mark as on route.
 *     responses:
 *       200:
 *         description: Order marked as on route successfully.
 *       400:
 *         description: Order cannot be marked as on route in its current state.
 *       403:
 *         description: Forbidden (not a vendor).
 *       404:
 *         description: Order not found or unauthorized.
 *       500:
 *         description: Server error.
 */
/**
 * @swagger
 * /api/orders/{id}/delivered:
 *   patch:
 *     summary: Vendor marks an order as delivered
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the order to mark as delivered.
 *     responses:
 *       200:
 *         description: Order marked as delivered successfully.
 *       400:
 *         description: Order cannot be marked as delivered in its current state.
 *       403:
 *         description: Forbidden (not a vendor).
 *       404:
 *         description: Order not found or unauthorized.
 *       500:
 *         description: Server error.
 */
/**
 * @swagger
 * /api/orders/{id}/reject:
 *   patch:
 *     summary: Vendor rejects a pending order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the order to reject.
 *     responses:
 *       200:
 *         description: Order rejected successfully.
 *       400:
 *         description: Order cannot be rejected in its current state.
 *       403:
 *         description: Forbidden (not a vendor).
 *       404:
 *         description: Order not found or unauthorized.
 *       500:
 *         description: Server error.
 */
app.use('/api/orders', orderRoutes);

// --- Cylinder Routes ---
/**
 * @swagger
 * tags:
 *   name: Cylinders
 *   description: API for managing user's gas cylinders
 */

/**
 * @swagger
 * /api/cylinders:
 *   get:
 *     summary: Get all registered cylinders for the authenticated user
 *     tags: [Cylinders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of user's cylinders.
 *       500:
 *         description: Server error.
 *   post:
 *     summary: Register a new gas cylinder for the authenticated user
 *     tags: [Cylinders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - size
 *             properties:
 *               size:
 *                 type: string
 *                 enum: [KG_3, KG_6, KG_12, KG_12_5, KG_25]
 *                 description: Size of the cylinder.
 *               serialNumber:
 *                 type: string
 *                 nullable: true
 *                 description: Unique serial number of the cylinder (optional).
 *               nickname:
 *                 type: string
 *                 nullable: true
 *                 description: A friendly name for the cylinder (e.g., "Kitchen Cylinder").
 *     responses:
 *       201:
 *         description: Cylinder registered successfully.
 *       400:
 *         description: Invalid input (e.g., missing size, invalid size).
 *       409:
 *         description: A cylinder with this serial number already exists.
 *       500:
 *         description: Server error.
 */
/**
 * @swagger
 * /api/cylinders/{id}:
 *   delete:
 *     summary: Delete a registered cylinder
 *     tags: [Cylinders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the cylinder to delete.
 *     responses:
 *       204:
 *         description: Cylinder deleted successfully.
 *       404:
 *         description: Cylinder not found or not owned by user.
 *       500:
 *         description: Server error.
 */
app.use('/api/cylinders', cylinderRoutes);

// --- Review Routes ---
/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: API for submitting reviews for completed orders
 */

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a review for a delivered order
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - rating
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: The ID of the delivered order to review.
 *               rating:
 *                 type: integer
 *                 description: A rating from 1 to 5.
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *                 nullable: true
 *                 description: An optional text comment for the review.
 *     responses:
 *       201:
 *         description: Review created successfully.
 *       400, 403, 404, 409:
 *         description: Invalid input, not authorized, or review already exists.
 */
app.use('/api/reviews', reviewRoutes);

// --- Payment Webhook Route ---
/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: API for handling payment gateway webhooks
 */

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Handles payment confirmation webhooks from Flutterwave
 *     tags: [Payments]
 *     description: This endpoint receives webhook events from Flutterwave to confirm payment status. It should not be called directly by a client.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *                 example: charge.completed
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Webhook received and acknowledged.
 *       401:
 *         description: Invalid webhook signature.
 */
app.post('/api/payments/webhook', handleFlutterwaveWebhook);

const PORT = process.env.PORT || 4000

const isDirectRun =
  !process.argv[1] ||
  process.argv[1].toLowerCase() === fileURLToPath(import.meta.url).toLowerCase() ||
  process.argv[1].endsWith('server.ts') ||
  process.argv[1].endsWith('server.js');

if (isDirectRun) {
  // Initialize background jobs
  predictionJob.start();

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

export default app
