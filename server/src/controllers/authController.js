import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const allowedRoles = ['donor', 'receiver', 'volunteer'];

function createSession(user) {
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}

export async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;
    if (!name?.trim() || !email?.trim() || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required.' });
    }
    if (!allowedRoles.includes(role)) return res.status(400).json({ message: 'Choose a valid account role.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ message: 'An account with this email already exists.' });
    const user = await User.create({
      name: name.trim(), email: normalizedEmail, role,
      passwordHash: await bcrypt.hash(password, 12),
    });
    res.status(201).json(createSession(user));
  } catch (error) { next(error); }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash');
    if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Email or password is incorrect.' });
    }
    res.json(createSession(user));
  } catch (error) { next(error); }
}

export async function googleLogin(req, res, next) {
  try {
    if (!process.env.GOOGLE_CLIENT_ID) return res.status(503).json({ message: 'Google sign-in is not configured yet.' });
    const { credential, role } = req.body;
    if (!credential) return res.status(400).json({ message: 'Google credential is required.' });
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
    const profile = ticket.getPayload();
    if (!profile?.email || !profile.email_verified) return res.status(401).json({ message: 'Google could not verify this email address.' });

    let user = await User.findOne({ email: profile.email.toLowerCase() });
    if (!user) {
      if (!allowedRoles.includes(role)) return res.status(400).json({ message: 'Choose your account role to finish signing up with Google.' });
      user = await User.create({ name: profile.name || profile.email, email: profile.email.toLowerCase(), googleId: profile.sub, role });
    } else if (!user.googleId) {
      user.googleId = profile.sub;
      await user.save();
    }
    res.json(createSession(user));
  } catch (error) { next(error); }
}

export function currentUser(req, res) {
  res.json({ user: { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role } });
}
