import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { generateToken, hashPassword, comparePassword, requireAuth, AuthRequest } from '../auth.js';
import { User } from '../../src/types/quiz.js';
import { persistUser, isMongoConnected } from '../mongoService.js';

const router = Router();

// Register
router.post('/register', (req: Request, res: Response) => {
  const { email, password, displayName } = req.body;
  if (!email || !password || !displayName) {
    return res.status(400).json({ error: 'Email, password, and display name are required' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  for (const existing of db.users.values()) {
    if (existing.email.toLowerCase() === normalizedEmail) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
  }

  const newUser: User & { passwordHash: string } = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    email: normalizedEmail,
    displayName: String(displayName).trim(),
    role: 'creator',
    preferredTheme: 'light',
    createdAt: new Date().toISOString(),
    passwordHash: hashPassword(password)
  };

  db.users.set(newUser.id, newUser);
  persistUser(newUser);

  const token = generateToken({
    userId: newUser.id,
    email: newUser.email,
    role: newUser.role
  });

  const { passwordHash: _, ...safeUser } = newUser;
  return res.status(201).json({ token, user: safeUser });
});

// Login
router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  let user: (User & { passwordHash: string }) | undefined;

  for (const u of db.users.values()) {
    if (u.email.toLowerCase() === normalizedEmail) {
      user = u;
      break;
    }
  }

  if (!user || !comparePassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role
  });

  const { passwordHash: _, ...safeUser } = user;
  return res.json({ token, user: safeUser });
});

// Get Current User
router.get('/me', requireAuth, (req: AuthRequest, res: Response) => {
  const user = db.users.get(req.user!.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const { passwordHash: _, ...safeUser } = user;
  return res.json({ user: safeUser });
});

// Update Profile
router.patch('/profile', requireAuth, (req: AuthRequest, res: Response) => {
  const user = db.users.get(req.user!.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { displayName, avatarUrl, preferredTheme } = req.body;
  if (displayName) user.displayName = displayName;
  if (avatarUrl) user.avatarUrl = avatarUrl;
  if (preferredTheme) user.preferredTheme = preferredTheme;

  persistUser(user);

  const { passwordHash: _, ...safeUser } = user;
  return res.json({ user: safeUser });
});

// Public Auth Configuration
router.get('/config', (req: Request, res: Response) => {
  res.json({
    googleClientId: process.env.VITE_GOOGLE_CLIENT_ID || '364422628626-mbvrd1km2eo2jjj8l9tc5uijbmut6913.apps.googleusercontent.com',
    authMethods: ['password', 'google', 'demo'],
    database: isMongoConnected() ? 'mongodb' : 'in-memory'
  });
});

// Google Sign-In & Sign-Up
router.post('/google', async (req: Request, res: Response) => {
  const { credential, accessToken, email, displayName, avatarUrl, googleId } = req.body;
  let userEmail = email;
  let userName = displayName;
  let userPicture = avatarUrl;
  let sub = googleId;

  // 1. If a Google ID Token (credential) is passed from Google Identity Services
  if (credential && typeof credential === 'string') {
    try {
      const parts = credential.split('.');
      if (parts.length >= 2) {
        let jsonPayload = '';
        try {
          jsonPayload = Buffer.from(parts[1], 'base64url').toString('utf-8');
        } catch {
          const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');
        }
        const payload = JSON.parse(jsonPayload);
        userEmail = payload.email || userEmail;
        userName = payload.name || userName || payload.given_name || (payload.email ? payload.email.split('@')[0] : 'Google User');
        userPicture = payload.picture || userPicture;
        sub = payload.sub || sub;
      }
    } catch (e: any) {
      console.warn('Failed to parse Google ID token credential:', e.message);
    }
  }

  // 2. If an OAuth access token was provided
  const tokenToVerify = accessToken || (typeof credential === 'string' && credential.startsWith('ya29.') ? credential : null);
  if (tokenToVerify && (!userEmail || !userName)) {
    try {
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenToVerify}` }
      });
      if (userInfoRes.ok) {
        const userInfo: any = await userInfoRes.json();
        userEmail = userInfo.email || userEmail;
        userName = userInfo.name || userName;
        userPicture = userInfo.picture || userPicture;
        sub = userInfo.sub || sub;
      }
    } catch (e: any) {
      console.warn('Failed to fetch userinfo from Google with access token:', e.message);
    }
  }

  if (!userEmail) {
    return res.status(400).json({ error: 'Valid Google email or credential token is required' });
  }

  const normalizedEmail = String(userEmail).trim().toLowerCase();
  let user: (User & { passwordHash?: string; googleId?: string; authProvider?: string }) | undefined;

  for (const u of db.users.values()) {
    if (u.email.toLowerCase() === normalizedEmail || (sub && (u as any).googleId === sub)) {
      user = u as any;
      break;
    }
  }

  if (!user) {
    // Register new user via Google
    user = {
      id: `usr_g_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: normalizedEmail,
      displayName: userName ? String(userName).trim() : normalizedEmail.split('@')[0],
      avatarUrl: userPicture,
      googleId: sub,
      authProvider: 'google',
      role: 'creator',
      preferredTheme: 'light',
      createdAt: new Date().toISOString()
    };
  } else {
    // Existing user login via Google
    if (userName && !user.displayName) user.displayName = userName;
    if (userPicture && !user.avatarUrl) user.avatarUrl = userPicture;
    if (sub && !(user as any).googleId) (user as any).googleId = sub;
    (user as any).authProvider = (user as any).authProvider || 'google';
  }

  db.users.set(user.id, user as any);
  persistUser(user as any);

  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role
  });

  const { passwordHash: _, ...safeUser } = user;
  return res.json({ token, user: safeUser });
});

export default router;
