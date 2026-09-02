import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import scheduleRoutes from './routes/scheduleRoutes';
import menuRoutes from './routes/menuRoutes';
import orderRoutes from './routes/orderRoutes';
import authRoutes from './routes/authRoutes';
import paymentRoutes from './routes/paymentRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Middlewares
app.use(cors({
  origin: [CLIENT_URL, 'http://localhost:3000'],
  credentials: true,
}));
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
  res.json({ status: 'ok', service: 'Yazhisai Cloud Kitchen Express API', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Yazhisai Cloud Kitchen Express Server running on http://localhost:${PORT}`);
});
