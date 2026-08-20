import './types/express.d.js';
import express from 'express'
import dotenv from 'dotenv'
import { corsConfig } from './middleware/corsConfig.js';
import { config } from './config/index.js';
import { fileURLToPath } from 'url'
import multer from 'multer';
import { notificationService } from './services/notificationService.js'
import { predictionJob } from './jobs/predictionJob.js';
import { payoutJob } from './jobs/payoutJob.js';
import { authenticate, authorizeAdmin, deleteSelf, deleteUsers, flagVendor, forgotPassword, getMe, getTotalProfit, getUsers, resetPassword, signIn, signUp, updateProfile, verifyOtp } from './controllers/authControl.js';
import { uploadProfilePicture } from './controllers/uploadController.js';
import { encryptionController } from './controllers/encryptionController.js';
import orderRoutes from './routesF/orderRoutes.js';
import paymentRoutes from './routesF/paymentRoutes.js';
import payoutRoutes from './routesF/payoutRoutes.js';
import cylinderRoutes from './routesF/cylinderRoutes.js';
import reviewRoutes from './routesF/reviewRoutes.js';
//import predictionRoutes from './routes/predictionRoutes.js';
import createRoutesRouter from './routesF/routes.js';
import ipTracker from './utils/ipTracker.js';
import httpLogger from './utils/httpLogger.js';
import { setupSwagger } from './config/swagger.js';
import { generalLimiter, authLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
// dotenv.config() is now handled by src/config/index.ts
dotenv.config()


const app = express()

app.use(corsConfig)
app.use(express.json())

app.use(ipTracker)
app.use(httpLogger)
app.use(generalLimiter);

// Multer setup for in-memory file storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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
app.post('/api/auth/signup', authLimiter, signUp)

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
app.post('/api/auth/verify-otp', authLimiter, verifyOtp);


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
app.post('/api/auth/signin', authLimiter, signIn)
app.post('/api/auth/login', authLimiter, signIn)

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
app.post('/api/auth/forgot-password', authLimiter, forgotPassword);

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
app.post('/api/auth/reset-password', authLimiter, resetPassword);

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
 *     summary: Get all users with profiles, pagination, and filtering (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of users per page (max 100).
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search users by name or email.
 *       - in: query
 *         name: profileType
 *         schema:
 *           type: string
 *           enum: [USER, VENDOR, ADMIN]
 *         description: Filter users by profile type.
 *     responses:
 *       200:
 *         description: A paginated list of users with profile data.
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

/**
 * @swagger
 * /api/users/{id}/flag:
 *   patch:
 *     summary: Flag a vendor (Admin only). 3 flags auto-deletes the vendor account.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The vendor's user ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for flagging the vendor.
 *     responses:
 *       200:
 *         description: Vendor flagged successfully. Returns flag count and auto-delete status.
 *       400:
 *         description: Invalid request or user is not a vendor.
 *       404:
 *         description: Vendor not found.
 */
//app.patch('/api/users/:id/flag', authenticate, authorizeAdmin, flagVendor);

/**
 * @swagger
 * /api/admin/profit:
 *   get:
 *     summary: Get total platform profit (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform total profit calculated from successful payments
 */
//app.get('/api/admin/profit', authenticate, authorizeAdmin, getTotalProfit);

// NOTE: SSE notification stream is registered below alongside payment routes (authenticated, per-user)

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

// --- Prediction Routes ---
/**
 * @swagger
 * tags:
 *   name: Predictions
 *   description: API for managing gas refill predictions
 */

/**
 * @swagger
 * /api/predictions/initial:
 *   post:
 *     summary: Generate the first (cold-start) prediction for a user
 *     tags: [Predictions]
 *     description: >
 *       This endpoint is typically called automatically after a user registers their first cylinder
 *       and has provided their household profile information. It generates a "cold-start" prediction
 *       and saves it.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cylinderId:
 *                 type: string
 *                 description: The ID of the user's first registered cylinder.
 *     responses:
 *       202:
 *         description: Prediction generation has been accepted and is processing in the background.
 */
//app.use('/api/predictions', predictionRoutes);

// --- Payout Routes ---
/**
 * @swagger
 * tags:
 *   name: Payouts
 *   description: API for vendors to view their payout history
 */
app.use('/api/payouts', payoutRoutes);
// --- Payment Routes (initiate, verify, wallet, webhook) ---
app.use('/api/payments', paymentRoutes);

// --- Encryption Route ---
/**
 * @swagger
 * /api/encrypt:
 *   post:
 *     summary: Encrypt a payload for the payment gateway
 *     tags: [Utility]
 *     description: >
 *       Encrypts a string payload using the payment gateway's public key.
 *       **WARNING**: For PCI compliance, sensitive card data (PAN, CVV) should be
 *       encrypted on the client-side, not sent to the server for encryption. This
 *       endpoint receives the payload in plaintext.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payload:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payload encrypted successfully.
 */
app.post('/api/encrypt', encryptionController.encryptPayload);

// --- Real-time Notifications (Server-Sent Events) ---
// GET /api/notifications/stream — authenticated users subscribe to their own event stream
app.get('/api/notifications/stream', authenticate, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering
  res.flushHeaders();

  const userId = req.user!.id;
  notificationService.addClient(res, userId);

  // Send a heartbeat every 30s to keep the connection alive
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  res.on('close', () => clearInterval(heartbeat));
});

// GET /api/notifications — fetch persisted notifications for the user
app.get('/api/notifications', authenticate, async (req, res) => {
  try {
    const { prisma } = await import('./db/prisma.js');
    const userId = req.user!.id;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return res.json({ success: true, data: notifications });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
});

// PATCH /api/notifications/:id/read — mark a notification as read
app.patch('/api/notifications/:id/read', authenticate, async (req, res) => {
  try {
    const { prisma } = await import('./db/prisma.js');
    const { id } = req.params;
    await prisma.notification.update({ where: { id }, data: { isRead: true } });
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to mark notification as read.' });
  }
});

// --- Developer Route Listing (must be last to see all routes) ---
app.use('/routes', createRoutesRouter(app));

// --- Global Error Handler (must be the last middleware) ---
app.use(errorHandler);

const PORT = config.port;

const isDirectRun =
  !process.argv[1] ||
  process.argv[1].toLowerCase() === fileURLToPath(import.meta.url).toLowerCase() ||
  process.argv[1].endsWith('server.ts') ||
  process.argv[1].endsWith('server.js');

if (isDirectRun) {
  // Initialize background jobs
  if (config.enablePredictionJob) predictionJob.start();
  if (config.enablePayoutJob) payoutJob.start(); // Start the new payout job

  setTimeout(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)
    })
  }, 0);
}

export default app
