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
import addressRoutes from './routes/addressRoutes';
import deliveryPartnerRoutes from './routes/deliveryPartnerRoutes';
import adminRiderRoutes from './routes/adminRiderRoutes';
import chefRoutes from './routes/chefRoutes';
import adminChefRoutes from './routes/adminChefRoutes';
import adminRoutes from './routes/adminRoutes';
import reviewRoutes from './routes/reviewRoutes';
import { initSocket } from './socket';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

const httpServer = http.createServer(app);
initSocket(httpServer);

// Dynamic CORS configuration for production deployment
const defaultAdditionalOrigins = [
  'https://yazhisaicloudkitchen.in',
  'https://www.yazhisaicloudkitchen.in',
];

const envAdditionalOrigins = process.env.ADDITIONAL_ALLOWED_ORIGINS
  ? process.env.ADDITIONAL_ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : [];

const rawOrigins = [
  CLIENT_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  ...defaultAdditionalOrigins,
  ...envAdditionalOrigins,
].filter(Boolean);

const allowedOrigins = Array.from(
  new Set(rawOrigins.flatMap((o) => [o, o.replace(/\/$/, '')]))
);

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

app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(cookieParser());

// Routes Mount
app.use('/api/schedule', scheduleRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/rider', deliveryPartnerRoutes);
app.use('/api/chef', chefRoutes);
app.use('/api/admin/riders', adminRiderRoutes);
app.use('/api/admin/chefs', adminChefRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);


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
