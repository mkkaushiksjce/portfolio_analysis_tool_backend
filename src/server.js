import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';

import { connectDB } from './config/db.js';
import { sessionMiddleware } from './config/session.js';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';

dotenv.config();
const app = express();

// --- Core middleware ---
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', 1); // if behind reverse proxy (Heroku/Render/Nginx)

// --- CORS ---
const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));

// --- DB + Session ---
await connectDB();
app.use(sessionMiddleware);

// --- Health check ---
app.get('/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// --- Routes ---
app.use('/auth', authRoutes);
app.use('/tasks', taskRoutes);

// --- 404 ---
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// --- Error handler ---
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));