import http from 'http';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import scheduleRoutes from './routes/scheduleRoutes';
import menuRoutes from './routes/menuRoutes';
import orderRoutes from './routes/orderRoutes';
import authRoutes from './routes/authRoutes';
import paymentRoutes from './routes/paymentRoutes';
import { initSocket } from './socket';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

const httpServer = http.createServer(app);
initSocket(httpServer);

// Dynamic CORS configuration for production deployment
const allowedOrigins = [
  CLIENT_URL,
  CLIENT_URL.replace(/\/$/, ''),
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, server-to-server)
      if (!origin) return callback(null, true);

      // Check explicit allowed origins or Vercel preview/production URLs
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        (CLIENT_URL && origin.startsWith(CLIENT_URL))
      ) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS policy'));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Routes Mount
app.use('/api/schedule', scheduleRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Yazhisai Cloud Kitchen Express API',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Yazhisai Cloud Kitchen Express Server + Socket.io running on port ${PORT}`);
});
