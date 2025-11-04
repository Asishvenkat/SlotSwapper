export enum EventStatus {
  BUSY = 'BUSY',
  SWAPPABLE = 'SWAPPABLE',
  SWAP_PENDING = 'SWAP_PENDING',
}

export enum SwapRequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Event {
  _id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: EventStatus;
  userId: string | User;
  createdAt: string;
  updatedAt: string;
}

export interface SwapRequest {
  _id: string;
  requesterId: string | User;
  requesterSlotId: string | Event;
  targetUserId: string | User;
  targetSlotId: string | Event;
  status: SwapRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface CreateEventData {
  title: string;
  startTime: Date;
  endTime: Date;
  status?: EventStatus;
}

export interface UpdateEventData {
  title?: string;
  startTime?: Date;
  endTime?: Date;
  status?: EventStatus;
}

export interface CreateSwapRequestData {
  mySlotId: string;
  theirSlotId: string;
}

export interface SwapResponseData {
  accepted: boolean;
}
