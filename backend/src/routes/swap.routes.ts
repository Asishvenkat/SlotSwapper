import { Router } from 'express';
import { body } from 'express-validator';
import {
  getSwappableSlots,
  createSwapRequest,
  respondToSwapRequest,
  getIncomingRequests,
  getOutgoingRequests,
} from '../controllers/swap.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation rules
const createSwapRequestValidation = [
  body('mySlotId').notEmpty().isMongoId().withMessage('Valid mySlotId is required'),
  body('theirSlotId').notEmpty().isMongoId().withMessage('Valid theirSlotId is required'),
];

const respondToSwapValidation = [
  body('accepted').isBoolean().withMessage('Accepted must be a boolean'),
];

// Routes
router.get('/swappable-slots', getSwappableSlots);
router.get('/incoming-requests', getIncomingRequests);
router.get('/outgoing-requests', getOutgoingRequests);
router.post('/swap-request', validate(createSwapRequestValidation), createSwapRequest);
router.post('/swap-response/:requestId', validate(respondToSwapValidation), respondToSwapRequest);

export default router;
