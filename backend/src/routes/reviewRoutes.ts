import { Router } from 'express';
import { authenticate } from '../controllers/authControl.js';
import { createReview } from '../controllers/reviewController.js';

const router = Router();

// All review routes require authentication
router.post('/', authenticate, createReview);

export default router;
