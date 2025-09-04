import session from 'express-session';
import MongoStore from 'connect-mongo';

const ONE_DAY = 1000 * 60 * 60 * 24;

export const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'dev_secret',
  resave: false,
  saveUninitialized: false,
  name: 'sid',
  cookie: {
    httpOnly: true,
    maxAge: ONE_DAY * 7, // 7 days
    sameSite: 'lax',
    secure: String(process.env.SESSION_SECURE).toLowerCase() === 'true',
  },
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
    ttl: 60 * 60 * 24 * 7, // 7 days
  }),
});