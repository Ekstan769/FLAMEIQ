import { Router } from 'express';
import { authenticate } from '../controllers/authControl.js';
import { getCylinders, registerCylinder, deleteCylinder } from '../controllers/cylinderController.js';

const router = Router();

// All cylinder routes require authentication
router.use(authenticate);

router.route('/').get(getCylinders).post(registerCylinder);
router.route('/:id').delete(deleteCylinder);

export default router;