import request from 'supertest';
import { app } from '../../src/app';
import { User } from '../../src/models/User';
import { TokenRepository } from '../../src/repositories/TokenRepository';
import { EmailService } from '../../src/services/EmailService';

jest.mock('../../src/services/EmailService');

describe('POST /api/v1/auth/password-reset-request (SPEC-AUTH-001)', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await User.destroy({ where: {} });
    await TokenRepository.clear();
  });

  // Scenario 1: Valid Account Password Reset Request (Happy Path)
  it('should generate a hashed token, queue email, and return 200 for existing active user', async () => {
    // Arrange
    await User.create({
      email: 'user@example.com',
      status: 'ACTIVE',
      passwordHash: 'existing_hash',
    });

    // Act
    const response = await request(app)
      .post('/api/v1/auth/password-reset-request')
      .send({ email: 'user@example.com' });

    // Assert: HTTP Status & Uniform Response
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: 'If account exists, a reset link has been sent.',
    });

    // Assert: Hashed Token Persistence
    const savedToken = await TokenRepository.findByEmail('user@example.com');
    expect(savedToken).toBeDefined();
    expect(savedToken?.tokenHash).not.toBeNull();
    // Verify raw token is NOT stored in plain text
    expect(savedToken?.tokenHash).not.toContain('raw_');

    // Assert: Async Email Dispatch
    expect(EmailService.prototype.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    expect(EmailService.prototype.sendPasswordResetEmail).toHaveBeenCalledWith(
      'user@example.com',
      expect.any(String) // raw token link
    );
  });

  // Scenario 2: Non-Existent Account (Prevent User Enumeration)
  it('should return identical 200 message without generating token or sending email for non-existent account', async () => {
    // Act
    const response = await request(app)
      .post('/api/v1/auth/password-reset-request')
      .send({ email: 'unregistered@example.com' });

    // Assert: Identical Response
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: 'If account exists, a reset link has been sent.',
    });

    // Assert: No side effects occurred
    const savedToken = await TokenRepository.findByEmail('unregistered@example.com');
    expect(savedToken).toBeNull();
    expect(EmailService.prototype.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  // Scenario 3: Rate Limiting Abuse Protection
  it('should return 429 Too Many Requests when request limit is exceeded', async () => {
    const payload = { email: 'rate-limit@example.com' };

    // Simulate 3 allowed attempts
    for (let i = 0; i < 3; i++) {
      await request(app).post('/api/v1/auth/password-reset-request').send(payload);
    }

    // 4th Attempt should be blocked
    const blockedResponse = await request(app)
      .post('/api/v1/auth/password-reset-request')
      .send(payload);

    expect(blockedResponse.status).toBe(429);
    expect(blockedResponse.body).toEqual({
      error: 'TOO_MANY_REQUESTS',
      message: 'Rate limit exceeded. Please try again later.',
    });
  });
});
