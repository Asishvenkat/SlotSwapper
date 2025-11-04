import { Router } from 'express';
import { body } from 'express-validator';
import {
  getMyEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../controllers/event.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation rules
const createEventValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('startTime').isISO8601().withMessage('Valid start time is required'),
  body('endTime').isISO8601().withMessage('Valid end time is required'),
];

const updateEventValidation = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('startTime').optional().isISO8601().withMessage('Valid start time is required'),
  body('endTime').optional().isISO8601().withMessage('Valid end time is required'),
  body('status').optional().isIn(['BUSY', 'SWAPPABLE', 'SWAP_PENDING']).withMessage('Invalid status'),
];

// Routes
router.get('/', getMyEvents);
router.post('/', validate(createEventValidation), createEvent);
router.put('/:id', validate(updateEventValidation), updateEvent);
router.delete('/:id', deleteEvent);

export default router;
