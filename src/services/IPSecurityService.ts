/**
 * IP reputation / blacklist contract (SPEC-AUTH-001 §2, item 8).
 * Blacklisted client IPs must be rejected with HTTP 403 Forbidden
 * before any password reset business logic executes.
 */
export interface IIPSecurityService {
  /** Returns true when the given client IP is blacklisted. */
  isBlacklisted(ipAddress: string): Promise<boolean>;
}

/**
 * Default in-memory IIPSecurityService implementation. A production
 * deployment would back this with a threat-intelligence feed or WAF list.
 */
export class IPSecurityService implements IIPSecurityService {
  private readonly blacklist: Set<string>;

  constructor(blacklistedIps: string[] = []) {
    this.blacklist = new Set(blacklistedIps);
  }

  async isBlacklisted(ipAddress: string): Promise<boolean> {
    return this.blacklist.has(ipAddress);
  }
}
