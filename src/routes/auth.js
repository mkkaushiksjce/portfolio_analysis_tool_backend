import { Router } from 'express';
import crypto from 'crypto';
import User from '../models/user.js';
import { sendResetToken } from '../utils/sendResetToken.js';

const router = Router();

// Register
router.post('/register', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const user = new User({ email, passwordHash: 'temp' });
    await user.setPassword(password);
    await user.save();

    req.session.userId = user._id.toString();
    res.status(201).json({ message: 'Registered', user: { id: user._id, email: user.email } });
  } catch (err) {
    next(err);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await user.validatePassword(password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    req.session.userId = user._id.toString();
    res.json({ message: 'Logged in', user: { id: user._id, email: user.email } });
  } catch (err) {
    next(err);
  }
});

// Me (session info)
router.get('/me', async (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  const user = await User.findById(req.session.userId).select('_id email createdAt');
  res.json({ user });
});

// Logout
router.post('/logout', (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('sid');
    res.json({ message: 'Logged out' });
  });
});

// Request password reset
router.post('/request-password-reset', async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.json({ message: 'If the email exists, a reset link has been sent.' });

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 min

    user.resetToken = token;
    user.resetTokenExpiresAt = expires;
    await user.save();

    const base = process.env.APP_BASE_URL || 'http://localhost:4000';
    const link = `${base}/auth/reset-password/${token}`;

    await sendResetToken({ email: user.email, link });

    res.json({ message: 'If the email exists, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
});

// Verify reset token (optional helper for clients)
router.get('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const user = await User.findOne({ resetToken: token, resetTokenExpiresAt: { $gt: new Date() } }).select('_id email');
  if (!user) return res.status(400).json({ error: 'Invalid or expired token' });
  return res.json({ message: 'Token valid', email: user.email });
});

// Perform password reset
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const user = await User.findOne({ resetToken: token, resetTokenExpiresAt: { $gt: new Date() } });
    if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

    await user.setPassword(password);
    user.resetToken = undefined;
    user.resetTokenExpiresAt = undefined;
    await user.save();

    // Optionally, auto-login after reset
    req.session.userId = user._id.toString();
    res.json({ message: 'Password updated', user: { id: user._id, email: user.email } });
  } catch (err) {
    next(err);
  }
});

export default router;