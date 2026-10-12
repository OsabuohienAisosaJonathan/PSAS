import { Request, Response, NextFunction } from 'express';

export function privacyGuard(req: Request, res: Response, next: NextFunction): void {
  // Prevent caching of any analysis or authentication responses
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Verify that interactive endpoints never accept plaintext query parameters
  if (req.query && (req.query.password || req.query.pwd || req.query.plaintext)) {
    res.status(400).json({
      error: 'Security Policy Violation: Plaintext passwords are strictly forbidden in URL query parameters.'
    });
    return;
  }

  next();
}
