import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../server';
import User from '../models/User.model';
import Event, { EventStatus } from '../models/Event.model';
import SwapRequest, { SwapRequestStatus } from '../models/SwapRequest.model';

describe('Swap Controller', () => {
  let user1Token: string;
  let user2Token: string;
  let user1Id: string;
  let user2Id: string;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/slotswapper-test';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Event.deleteMany({});
    await SwapRequest.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear all collections
    await User.deleteMany({});
    await Event.deleteMany({});
    await SwapRequest.deleteMany({});

    // Create two test users
    const user1Response = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'User One',
        email: 'user1@example.com',
        password: 'password123',
      });

    const user2Response = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'User Two',
        email: 'user2@example.com',
        password: 'password123',
      });

    user1Token = user1Response.body.token;
    user2Token = user2Response.body.token;
    user1Id = user1Response.body.user.id;
    user2Id = user2Response.body.user.id;
  });

  describe('POST /api/swap/swap-request', () => {
    it('should create a swap request successfully', async () => {
      // Create swappable events for both users
      const event1Response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'User 1 Event',
          startTime: new Date('2025-01-10T10:00:00Z'),
          endTime: new Date('2025-01-10T11:00:00Z'),
          status: EventStatus.SWAPPABLE,
        });

      const event2Response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          title: 'User 2 Event',
          startTime: new Date('2025-01-11T14:00:00Z'),
          endTime: new Date('2025-01-11T15:00:00Z'),
          status: EventStatus.SWAPPABLE,
        });

      const mySlotId = event1Response.body.event._id;
      const theirSlotId = event2Response.body.event._id;

      // User 1 creates a swap request
      const response = await request(app)
        .post('/api/swap/swap-request')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          mySlotId,
          theirSlotId,
        })
        .expect(201);

      expect(response.body).toHaveProperty('swapRequest');
      expect(response.body.swapRequest.status).toBe(SwapRequestStatus.PENDING);

      // Verify both slots are now SWAP_PENDING
      const updatedEvent1 = await Event.findById(mySlotId);
      const updatedEvent2 = await Event.findById(theirSlotId);

      expect(updatedEvent1?.status).toBe(EventStatus.SWAP_PENDING);
      expect(updatedEvent2?.status).toBe(EventStatus.SWAP_PENDING);
    });

    it('should not allow swapping with own slot', async () => {
      // Create two events for user1
      const event1Response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Event 1',
          startTime: new Date('2025-01-10T10:00:00Z'),
          endTime: new Date('2025-01-10T11:00:00Z'),
          status: EventStatus.SWAPPABLE,
        });

      const event2Response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Event 2',
          startTime: new Date('2025-01-11T14:00:00Z'),
          endTime: new Date('2025-01-11T15:00:00Z'),
          status: EventStatus.SWAPPABLE,
        });

      const response = await request(app)
        .post('/api/swap/swap-request')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          mySlotId: event1Response.body.event._id,
          theirSlotId: event2Response.body.event._id,
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/swap/swap-response/:requestId', () => {
    it('should accept swap request and exchange slot owners', async () => {
      // Create events
      const event1Response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'User 1 Event',
          startTime: new Date('2025-01-10T10:00:00Z'),
          endTime: new Date('2025-01-10T11:00:00Z'),
          status: EventStatus.SWAPPABLE,
        });

      const event2Response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          title: 'User 2 Event',
          startTime: new Date('2025-01-11T14:00:00Z'),
          endTime: new Date('2025-01-11T15:00:00Z'),
          status: EventStatus.SWAPPABLE,
        });

      const mySlotId = event1Response.body.event._id;
      const theirSlotId = event2Response.body.event._id;

      // Create swap request
      const swapResponse = await request(app)
        .post('/api/swap/swap-request')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ mySlotId, theirSlotId });

      const requestId = swapResponse.body.swapRequest._id;

      // User 2 accepts the swap
      const acceptResponse = await request(app)
        .post(`/api/swap/swap-response/${requestId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ accepted: true })
        .expect(200);

      expect(acceptResponse.body.swapRequest.status).toBe(SwapRequestStatus.ACCEPTED);

      // Verify owners have been swapped
      const updatedEvent1 = await Event.findById(mySlotId);
      const updatedEvent2 = await Event.findById(theirSlotId);

      expect(updatedEvent1?.userId.toString()).toBe(user2Id);
      expect(updatedEvent2?.userId.toString()).toBe(user1Id);
      expect(updatedEvent1?.status).toBe(EventStatus.BUSY);
      expect(updatedEvent2?.status).toBe(EventStatus.BUSY);
    });

    it('should reject swap request and reset slots to swappable', async () => {
      // Create events
      const event1Response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'User 1 Event',
          startTime: new Date('2025-01-10T10:00:00Z'),
          endTime: new Date('2025-01-10T11:00:00Z'),
          status: EventStatus.SWAPPABLE,
        });

      const event2Response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          title: 'User 2 Event',
          startTime: new Date('2025-01-11T14:00:00Z'),
          endTime: new Date('2025-01-11T15:00:00Z'),
          status: EventStatus.SWAPPABLE,
        });

      const mySlotId = event1Response.body.event._id;
      const theirSlotId = event2Response.body.event._id;

      // Create swap request
      const swapResponse = await request(app)
        .post('/api/swap/swap-request')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ mySlotId, theirSlotId });

      const requestId = swapResponse.body.swapRequest._id;

      // User 2 rejects the swap
      const rejectResponse = await request(app)
        .post(`/api/swap/swap-response/${requestId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ accepted: false })
        .expect(200);

      expect(rejectResponse.body.swapRequest.status).toBe(SwapRequestStatus.REJECTED);

      // Verify slots are back to SWAPPABLE
      const updatedEvent1 = await Event.findById(mySlotId);
      const updatedEvent2 = await Event.findById(theirSlotId);

      expect(updatedEvent1?.status).toBe(EventStatus.SWAPPABLE);
      expect(updatedEvent2?.status).toBe(EventStatus.SWAPPABLE);
      expect(updatedEvent1?.userId.toString()).toBe(user1Id);
      expect(updatedEvent2?.userId.toString()).toBe(user2Id);
    });
  });
});
