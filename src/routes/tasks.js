import { Router } from 'express';
import Task from '../models/task.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All routes below require a valid session
router.use(requireAuth);

// Create
router.post('/', async (req, res, next) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });
    const task = await Task.create({ title, userId: req.session.userId });
    res.status(201).json(task);
  } catch (err) { next(err); }
});

// Read (mine)
/*router.get('/', async (req, res, next) => {
  try {
    const tasks = await Task.find({ userId: req.session.userId }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});*/

router.get('/', (req, res) => {
  res.json({ message: 'Tasks endpoint works!' });
});

export default router;
