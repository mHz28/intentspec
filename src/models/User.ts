export interface UserAttributes {
  email: string;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  passwordHash: string;
}

/**
 * Minimal in-memory user model exposing a Sequelize-like static API
 * (create / destroy / findOne) as consumed by the test suite.
 */
export class User implements UserAttributes {
  email: string;
  status: UserAttributes['status'];
  passwordHash: string;

  private static users: User[] = [];

  private constructor(attrs: UserAttributes) {
    this.email = attrs.email;
    this.status = attrs.status;
    this.passwordHash = attrs.passwordHash;
  }

  static async create(attrs: UserAttributes): Promise<User> {
    const user = new User(attrs);
    User.users.push(user);
    return user;
  }

  static async findOne(options: { where: Partial<UserAttributes> }): Promise<User | null> {
    const entries = Object.entries(options.where) as [keyof UserAttributes, string][];
    const match = User.users.find((u) => entries.every(([key, value]) => u[key] === value));
    return match ?? null;
  }

  static async destroy(options: { where: Partial<UserAttributes> }): Promise<number> {
    const entries = Object.entries(options.where) as [keyof UserAttributes, string][];
    const before = User.users.length;
    User.users = User.users.filter(
      (u) => !entries.every(([key, value]) => u[key] === value)
    );
    return before - User.users.length;
  }
}
