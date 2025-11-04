import { Response } from 'express';
import Event, { EventStatus } from '../models/Event.model';
import { AuthRequest } from '../middleware/auth.middleware';

// @desc    Get all events for the logged-in user
// @route   GET /api/events
// @access  Private
export const getMyEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    const events = await Event.find({ userId }).sort({ startTime: 1 });

    res.status(200).json({
      count: events.length,
      events,
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Error fetching events' });
  }
};

// @desc    Create a new event
// @route   POST /api/events
// @access  Private
export const createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { title, startTime, endTime, status } = req.body;

    // Validate time
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      res.status(400).json({ error: 'End time must be after start time' });
      return;
    }

    // Create event
    const event = await Event.create({
      title,
      startTime: start,
      endTime: end,
      status: status || EventStatus.BUSY,
      userId,
    });

    res.status(201).json({
      message: 'Event created successfully',
      event,
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Error creating event' });
  }
};

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private
export const updateEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const eventId = req.params.id;
    const { title, startTime, endTime, status } = req.body;

    // Find event
    const event = await Event.findById(eventId);

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    // Check ownership
    if (event.userId.toString() !== userId) {
      res.status(403).json({ error: 'Not authorized to update this event' });
      return;
    }

    // Check if event is in a swap pending state
    if (event.status === EventStatus.SWAP_PENDING && status && status !== EventStatus.SWAP_PENDING) {
      res.status(400).json({ error: 'Cannot update event while a swap is pending' });
      return;
    }

    // Update fields
    if (title) event.title = title;
    if (startTime) event.startTime = new Date(startTime);
    if (endTime) event.endTime = new Date(endTime);
    if (status) event.status = status;

    // Validate time
    if (event.endTime <= event.startTime) {
      res.status(400).json({ error: 'End time must be after start time' });
      return;
    }

    await event.save();

    res.status(200).json({
      message: 'Event updated successfully',
      event,
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Error updating event' });
  }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private
export const deleteEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const eventId = req.params.id;

    // Find event
    const event = await Event.findById(eventId);

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    // Check ownership
    if (event.userId.toString() !== userId) {
      res.status(403).json({ error: 'Not authorized to delete this event' });
      return;
    }

    // Check if event is in a swap pending state
    if (event.status === EventStatus.SWAP_PENDING) {
      res.status(400).json({ error: 'Cannot delete event while a swap is pending' });
      return;
    }

    await Event.findByIdAndDelete(eventId);

    res.status(200).json({
      message: 'Event deleted successfully',
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Error deleting event' });
  }
};
