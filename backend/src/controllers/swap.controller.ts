import { Response } from 'express';
import mongoose from 'mongoose';
import Event, { EventStatus } from '../models/Event.model';
import SwapRequest, { SwapRequestStatus } from '../models/SwapRequest.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { notifyUser } from '../services/socket.service';

// @desc    Get all swappable slots (from other users)
// @route   GET /api/swap/swappable-slots
// @access  Private
export const getSwappableSlots = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    // Find all swappable events that don't belong to the current user
    const swappableSlots = await Event.find({
      status: EventStatus.SWAPPABLE,
      userId: { $ne: userId },
    })
      .populate('userId', 'name email')
      .sort({ startTime: 1 });

    res.status(200).json({
      count: swappableSlots.length,
      slots: swappableSlots,
    });
  } catch (error) {
    console.error('Get swappable slots error:', error);
    res.status(500).json({ error: 'Error fetching swappable slots' });
  }
};

// @desc    Create a swap request
// @route   POST /api/swap/swap-request
// @access  Private
export const createSwapRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { mySlotId, theirSlotId } = req.body;

    console.log('Creating swap request:', { userId, mySlotId, theirSlotId });

    // Validate input
    if (!mySlotId || !theirSlotId) {
      res.status(400).json({ error: 'Both mySlotId and theirSlotId are required' });
      return;
    }

    // Find both slots
    const mySlot = await Event.findById(mySlotId);
    const theirSlot = await Event.findById(theirSlotId);

    // Validate slots exist
    if (!mySlot || !theirSlot) {
      res.status(404).json({ error: 'One or both slots not found' });
      return;
    }

    // Verify ownership of mySlot
    if (mySlot.userId.toString() !== userId) {
      res.status(403).json({ error: 'You do not own the slot you are offering' });
      return;
    }

    // Verify user doesn't own theirSlot
    if (theirSlot.userId.toString() === userId) {
      res.status(400).json({ error: 'Cannot swap with your own slot' });
      return;
    }

    // Verify both slots are swappable
    if (mySlot.status !== EventStatus.SWAPPABLE) {
      res.status(400).json({ error: 'Your slot is not marked as swappable' });
      return;
    }

    if (theirSlot.status !== EventStatus.SWAPPABLE) {
      res.status(400).json({ error: 'The requested slot is not available for swapping' });
      return;
    }

    // Create swap request
    const swapRequest = await SwapRequest.create({
      requesterId: userId,
      requesterSlotId: mySlotId,
      targetUserId: theirSlot.userId,
      targetSlotId: theirSlotId,
      status: SwapRequestStatus.PENDING,
    });

    // Update both slots to SWAP_PENDING
    mySlot.status = EventStatus.SWAP_PENDING;
    theirSlot.status = EventStatus.SWAP_PENDING;

    await mySlot.save();
    await theirSlot.save();

    // Populate the swap request for response
    const populatedSwapRequest = await SwapRequest.findById(swapRequest._id)
      .populate('requesterId', 'name email')
      .populate('requesterSlotId')
      .populate('targetUserId', 'name email')
      .populate('targetSlotId');

    // Send real-time notification to target user
    notifyUser(theirSlot.userId.toString(), 'swap-request-received', {
      swapRequest: populatedSwapRequest,
    });

    res.status(201).json({
      message: 'Swap request created successfully',
      swapRequest: populatedSwapRequest,
    });
  } catch (error) {
    console.error('Create swap request error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({ error: 'Error creating swap request', details: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// @desc    Respond to a swap request (accept or reject)
// @route   POST /api/swap/swap-response/:requestId
// @access  Private
export const respondToSwapRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const requestId = req.params.requestId;
    const { accepted } = req.body;

    // Validate input
    if (typeof accepted !== 'boolean') {
      res.status(400).json({ error: 'Accepted field must be a boolean' });
      return;
    }

    // Find swap request
    const swapRequest = await SwapRequest.findById(requestId);

    if (!swapRequest) {
      res.status(404).json({ error: 'Swap request not found' });
      return;
    }

    // Verify the current user is the target of the swap
    if (swapRequest.targetUserId.toString() !== userId) {
      res.status(403).json({ error: 'You are not authorized to respond to this swap request' });
      return;
    }

    // Verify swap request is still pending
    if (swapRequest.status !== SwapRequestStatus.PENDING) {
      res.status(400).json({ error: 'This swap request has already been processed' });
      return;
    }

    // Find both slots
    const requesterSlot = await Event.findById(swapRequest.requesterSlotId);
    const targetSlot = await Event.findById(swapRequest.targetSlotId);

    if (!requesterSlot || !targetSlot) {
      res.status(404).json({ error: 'One or both slots no longer exist' });
      return;
    }

    if (accepted) {
      // ACCEPT: Swap the owners of the two slots
      const tempUserId = requesterSlot.userId;
      requesterSlot.userId = targetSlot.userId;
      targetSlot.userId = tempUserId;

      // Set both slots back to BUSY
      requesterSlot.status = EventStatus.BUSY;
      targetSlot.status = EventStatus.BUSY;

      // Update swap request status
      swapRequest.status = SwapRequestStatus.ACCEPTED;

      await requesterSlot.save();
      await targetSlot.save();
      await swapRequest.save();

      // Send real-time notifications
      notifyUser(swapRequest.requesterId.toString(), 'swap-request-accepted', {
        swapRequest: {
          id: swapRequest._id,
          status: SwapRequestStatus.ACCEPTED,
        },
      });

      res.status(200).json({
        message: 'Swap request accepted successfully',
        swapRequest,
      });
    } else {
      // REJECT: Set both slots back to SWAPPABLE
      requesterSlot.status = EventStatus.SWAPPABLE;
      targetSlot.status = EventStatus.SWAPPABLE;

      // Update swap request status
      swapRequest.status = SwapRequestStatus.REJECTED;

      await requesterSlot.save();
      await targetSlot.save();
      await swapRequest.save();

      // Send real-time notification
      notifyUser(swapRequest.requesterId.toString(), 'swap-request-rejected', {
        swapRequest: {
          id: swapRequest._id,
          status: SwapRequestStatus.REJECTED,
        },
      });

      res.status(200).json({
        message: 'Swap request rejected successfully',
        swapRequest,
      });
    }
  } catch (error) {
    console.error('Respond to swap request error:', error);
    res.status(500).json({ error: 'Error responding to swap request' });
  }
};

// @desc    Get incoming swap requests (requests for current user)
// @route   GET /api/swap/incoming-requests
// @access  Private
export const getIncomingRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    const incomingRequests = await SwapRequest.find({
      targetUserId: userId,
    })
      .populate('requesterId', 'name email')
      .populate('requesterSlotId')
      .populate('targetSlotId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: incomingRequests.length,
      requests: incomingRequests,
    });
  } catch (error) {
    console.error('Get incoming requests error:', error);
    res.status(500).json({ error: 'Error fetching incoming requests' });
  }
};

// @desc    Get outgoing swap requests (requests made by current user)
// @route   GET /api/swap/outgoing-requests
// @access  Private
export const getOutgoingRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    const outgoingRequests = await SwapRequest.find({
      requesterId: userId,
    })
      .populate('targetUserId', 'name email')
      .populate('requesterSlotId')
      .populate('targetSlotId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: outgoingRequests.length,
      requests: outgoingRequests,
    });
  } catch (error) {
    console.error('Get outgoing requests error:', error);
    res.status(500).json({ error: 'Error fetching outgoing requests' });
  }
};
