import express, { Request, Response } from 'express';
import { passwordResetRateLimiter } from './middleware/rateLimiter';
import { TokenRepository } from './repositories/TokenRepository';
import { EmailService } from './services/EmailService';
import { IPSecurityService } from './services/IPSecurityService';
import { PasswordResetService } from './services/PasswordResetService';

// Pragmatic RFC 5322-compatible email shape check, capped per schema (§5).
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LENGTH = 255;

const passwordResetService = new PasswordResetService(
  new EmailService(),
  TokenRepository,
  new IPSecurityService()
);

export const app = express();
app.use(express.json());

app.post(
  '/api/v1/auth/password-reset-request',
  passwordResetRateLimiter,
  async (req: Request, res: Response) => {
    const email: unknown = req.body?.email;

    // Scenario 4: reject malformed payloads (SPEC-AUTH-001 §3/§5).
    if (
      typeof email !== 'string' ||
      email.length > EMAIL_MAX_LENGTH ||
      !EMAIL_REGEX.test(email)
    ) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'A valid RFC-compliant email address is required.',
      });
      return;
    }

    const result = await passwordResetService.requestPasswordReset(
      email,
      req.ip ?? 'unknown'
    );

    // SPEC-AUTH-001 §2.8: blacklisted IPs receive 403 Forbidden.
    if (result.error?.code === 'IP_BLACKLISTED') {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Requests from this IP address are not permitted.',
      });
      return;
    }

    // Uniform response regardless of account existence or internal outcome
    // (SPEC-AUTH-001 Scenario 2: user enumeration prevention).
    res.status(200).json({
      message: 'If account exists, a reset link has been sent.',
    });
  }
);
