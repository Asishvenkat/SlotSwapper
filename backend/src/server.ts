import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/database';
import authRoutes from './routes/auth.routes';
import eventRoutes from './routes/event.routes';
import swapRoutes from './routes/swap.routes';
import { errorHandler } from './middleware/error.middleware';
import { initializeSocketIO } from './services/socket.service';

// Load environment variables
dotenv.config();

const app: Application = express();
const httpServer = createServer(app);
const allowedOrigins = [
  'http://localhost:3000',
  'https://slot-swapper-drab.vercel.app'
];

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// Connect to MongoDB
connectDB();

// Initialize Socket.IO
initializeSocketIO(io);

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', message: 'SlotSwapper API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/swap', swapRoutes);

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO initialized`);
});

export { app, io };
