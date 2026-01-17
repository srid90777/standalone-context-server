/**
 * User Service
 * Handles user authentication and profile management
 */

class UserService {
  constructor(database) {
    this.db = database;
    this.cache = new Map();
  }

  /**
   * Authenticate user with email and password
   * @param {string} email - User email address
   * @param {string} password - User password
   * @returns {Promise<Object>} User object with token
   */
  async authenticate(email, password) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const user = await this.db.users.findOne({ email });
    
    if (!user) {
      throw new Error('User not found');
    }

    const isValid = await this.verifyPassword(password, user.passwordHash);
    
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken(user);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    };
  }

  /**
   * Create a new user account
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData) {
    const { email, password, name, role = 'user' } = userData;

    // Validate email format
    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    // Check if user already exists
    const existing = await this.db.users.findOne({ email });
    if (existing) {
      throw new Error('User already exists');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const user = await this.db.users.create({
      email,
      passwordHash,
      name,
      role,
      createdAt: new Date()
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };
  }

  /**
   * Get user profile by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User profile
   */
  async getUserProfile(userId) {
    // Check cache first
    if (this.cache.has(userId)) {
      return this.cache.get(userId);
    }

    const user = await this.db.users.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    const profile = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt
    };

    // Cache the profile
    this.cache.set(userId, profile);

    return profile;
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updates - Profile updates
   * @returns {Promise<Object>} Updated user
   */
  async updateProfile(userId, updates) {
    const allowedFields = ['name', 'email'];
    const filteredUpdates = {};

    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    const user = await this.db.users.update(userId, filteredUpdates);

    // Invalidate cache
    this.cache.delete(userId);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };
  }

  /**
   * Verify password against hash
   * @param {string} password - Plain password
   * @param {string} hash - Password hash
   * @returns {Promise<boolean>} Is valid
   */
  async verifyPassword(password, hash) {
    const bcrypt = require('bcrypt');
    return bcrypt.compare(password, hash);
  }

  /**
   * Hash password
   * @param {string} password - Plain password
   * @returns {Promise<string>} Password hash
   */
  async hashPassword(password) {
    const bcrypt = require('bcrypt');
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Generate JWT token
   * @param {Object} user - User object
   * @returns {string} JWT token
   */
  generateToken(user) {
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'default-secret';
    
    return jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      },
      secret,
      { expiresIn: '24h' }
    );
  }

  /**
   * Validate email format
   * @param {string} email - Email address
   * @returns {boolean} Is valid
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Delete user account
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async deleteUser(userId) {
    await this.db.users.delete(userId);
    this.cache.delete(userId);
  }
}

module.exports = UserService;
