/**
 * Database utilities for COFRAP Authentication System
 * Simulated in-memory database for NextJS demo (replaces PostgreSQL)
 */

export interface User {
  id: number;
  username: string;
  password_hash: string;
  mfa_secret: string;
  gendate: number;
  expired: boolean;
}

class InMemoryDatabase {
  private users: Map<string, User> = new Map();
  private nextId: number = 1;
  private instanceId: string;

  constructor() {
    this.instanceId = Math.random().toString(36).substring(7);
    console.log(`🗄️ Database instance created: ${this.instanceId}`);
  }

  // Simulate the users table creation
  createUserTable(): void {
    console.log(`🗄️ [${this.instanceId}] Users table created/verified successfully (in-memory)`);
    console.log(`🗄️ [${this.instanceId}] Current users count: ${this.users.size}`);
  }

  // Insert or update user
  insertUser(username: string, password_hash: string, mfa_secret: string, gendate: number): boolean {
    try {
      const existingUser = this.users.get(username);
      
      if (existingUser) {
        // Update existing user
        existingUser.password_hash = password_hash;
        existingUser.mfa_secret = mfa_secret;
        existingUser.gendate = gendate;
        existingUser.expired = false;
      } else {
        // Insert new user
        const newUser: User = {
          id: this.nextId++,
          username,
          password_hash,
          mfa_secret,
          gendate,
          expired: false
        };
        this.users.set(username, newUser);
      }
      
      console.log(`🗄️ [${this.instanceId}] User ${username} inserted/updated successfully (in-memory)`);
      console.log(`🗄️ [${this.instanceId}] Total users now: ${this.users.size}`);
      return true;
    } catch (error) {
      console.error(`Failed to insert/update user ${username}:`, error);
      return false;
    }
  }

  // Get user by username
  getUser(username: string): User | null {
    try {
      const user = this.users.get(username);
      if (user) {
        console.log(`🗄️ [${this.instanceId}] User ${username} retrieved successfully (in-memory)`);
        return { ...user }; // Return a copy
      } else {
        console.log(`🗄️ [${this.instanceId}] User ${username} not found (in-memory)`);
        console.log(`🗄️ [${this.instanceId}] Available users: [${Array.from(this.users.keys()).join(', ')}]`);
        return null;
      }
    } catch (error) {
      console.error(`Failed to retrieve user ${username}:`, error);
      return null;
    }
  }

  // Update user's password
  updateUserPassword(username: string, password_hash: string, gendate: number): boolean {
    try {
      const user = this.users.get(username);
      if (user) {
        user.password_hash = password_hash;
        user.gendate = gendate;
        user.expired = false;
        console.log(`Password updated for user ${username} (in-memory)`);
        return true;
      } else {
        console.warn(`No user found with username ${username} (in-memory)`);
        return false;
      }
    } catch (error) {
      console.error(`Failed to update password for user ${username}:`, error);
      return false;
    }
  }

  // Update user's MFA secret
  updateUserMFA(username: string, mfa_secret: string, gendate: number): boolean {
    try {
      const user = this.users.get(username);
      if (user) {
        user.mfa_secret = mfa_secret;
        user.gendate = gendate;
        user.expired = false;
        console.log(`MFA secret updated for user ${username} (in-memory)`);
        return true;
      } else {
        console.warn(`No user found with username ${username} (in-memory)`);
        return false;
      }
    } catch (error) {
      console.error(`Failed to update MFA secret for user ${username}:`, error);
      return false;
    }
  }

  // Mark user as expired
  markUserExpired(username: string): boolean {
    try {
      const user = this.users.get(username);
      if (user) {
        user.expired = true;
        console.log(`User ${username} marked as expired (in-memory)`);
        return true;
      } else {
        console.warn(`No user found with username ${username} (in-memory)`);
        return false;
      }
    } catch (error) {
      console.error(`Failed to mark user ${username} as expired:`, error);
      return false;
    }
  }

  // Get all users (for debugging)
  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  // Clear all users (for testing)
  clearAllUsers(): void {
    this.users.clear();
    this.nextId = 1;
    console.log('All users cleared from in-memory database');
  }
}

// Singleton instance with global persistence for NextJS dev mode
let database: InMemoryDatabase;

if (typeof globalThis !== 'undefined') {
  // Use globalThis to persist across module reloads in development
  if (!(globalThis as any).__cofrap_database) {
    console.log('🗄️ Creating new global database instance');
    (globalThis as any).__cofrap_database = new InMemoryDatabase();
  } else {
    console.log('🗄️ Using existing global database instance');
  }
  database = (globalThis as any).__cofrap_database;
} else {
  // Fallback for environments without globalThis
  database = new InMemoryDatabase();
}

export class DatabaseManager {
  constructor() {
    // Initialize the database
    this.createUserTable();
  }

  createUserTable(): void {
    database.createUserTable();
  }

  insertUser(username: string, password_hash: string, mfa_secret: string, gendate: number): boolean {
    return database.insertUser(username, password_hash, mfa_secret, gendate);
  }

  getUser(username: string): User | null {
    return database.getUser(username);
  }

  updateUserPassword(username: string, password_hash: string, gendate: number): boolean {
    return database.updateUserPassword(username, password_hash, gendate);
  }

  updateUserMFA(username: string, mfa_secret: string, gendate: number): boolean {
    return database.updateUserMFA(username, mfa_secret, gendate);
  }

  markUserExpired(username: string): boolean {
    return database.markUserExpired(username);
  }

  // Utility methods for debugging/testing
  getAllUsers(): User[] {
    return database.getAllUsers();
  }

  clearAllUsers(): void {
    database.clearAllUsers();
  }
} 