import axios, { AxiosInstance } from 'axios';
import type {
  AuthResponse,
  Event,
  SwapRequest,
  CreateEventData,
  UpdateEventData,
  CreateSwapRequestData,
  SwapResponseData,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Auth endpoints
  async signup(name: string, email: string, password: string): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/signup', { name, email, password });
    return response.data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/login', { email, password });
    return response.data;
  }

  async getMe() {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  // Event endpoints
  async getMyEvents(): Promise<{ count: number; events: Event[] }> {
    const response = await this.api.get<{ count: number; events: Event[] }>('/events');
    return response.data;
  }

  async createEvent(data: CreateEventData): Promise<{ message: string; event: Event }> {
    const response = await this.api.post<{ message: string; event: Event }>('/events', data);
    return response.data;
  }

  async updateEvent(id: string, data: UpdateEventData): Promise<{ message: string; event: Event }> {
    const response = await this.api.put<{ message: string; event: Event }>(`/events/${id}`, data);
    return response.data;
  }

  async deleteEvent(id: string): Promise<{ message: string }> {
    const response = await this.api.delete<{ message: string }>(`/events/${id}`);
    return response.data;
  }

  // Swap endpoints
  async getSwappableSlots(): Promise<{ count: number; slots: Event[] }> {
    const response = await this.api.get<{ count: number; slots: Event[] }>('/swap/swappable-slots');
    return response.data;
  }

  async createSwapRequest(data: CreateSwapRequestData): Promise<{ message: string; swapRequest: SwapRequest }> {
    const response = await this.api.post<{ message: string; swapRequest: SwapRequest }>('/swap/swap-request', data);
    return response.data;
  }

  async respondToSwapRequest(requestId: string, data: SwapResponseData): Promise<{ message: string; swapRequest: SwapRequest }> {
    const response = await this.api.post<{ message: string; swapRequest: SwapRequest }>(
      `/swap/swap-response/${requestId}`,
      data
    );
    return response.data;
  }

  async getIncomingRequests(): Promise<{ count: number; requests: SwapRequest[] }> {
    const response = await this.api.get<{ count: number; requests: SwapRequest[] }>('/swap/incoming-requests');
    return response.data;
  }

  async getOutgoingRequests(): Promise<{ count: number; requests: SwapRequest[] }> {
    const response = await this.api.get<{ count: number; requests: SwapRequest[] }>('/swap/outgoing-requests');
    return response.data;
  }
}

export default new ApiService();
