import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../database/db.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

const JWT_SECRET = process.env.JWT_SECRET || 'psas-research-grade-jwt-secret-key-2026';

export class AuthController {
  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required.' });
        return;
      }

      const result = await db.query(
        'SELECT id, email, password_hash, role FROM admin_users WHERE email = ?',
        [email.trim().toLowerCase()]
      );

      if (result.rows.length === 0) {
        res.status(401).json({ error: 'Invalid administrative credentials.' });
        return;
      }

      const admin = result.rows[0];
      const passwordValid = await bcrypt.compare(password, admin.password_hash);

      if (!passwordValid) {
        res.status(401).json({ error: 'Invalid administrative credentials.' });
        return;
      }

      const token = jwt.sign(
        { id: admin.id, email: admin.email, role: admin.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: admin.id,
          email: admin.email,
          role: admin.role
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Authentication internal error: ' + err.message });
    }
  }

  public static async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    res.json({ user: req.user });
  }
}
