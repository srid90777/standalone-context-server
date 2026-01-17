/**
 * Logger utility
 * Provides structured logging with different log levels
 */

const fs = require('fs');
const path = require('path');

class Logger {
  constructor(options = {}) {
    this.logLevel = options.logLevel || process.env.LOG_LEVEL || 'info';
    this.logFile = options.logFile || null;
    this.enableColors = options.enableColors !== false;
    
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      trace: 4
    };

    this.colors = {
      error: '\x1b[31m', // Red
      warn: '\x1b[33m',  // Yellow
      info: '\x1b[36m',  // Cyan
      debug: '\x1b[35m', // Magenta
      trace: '\x1b[37m', // White
      reset: '\x1b[0m'
    };
  }

  /**
   * Check if level should be logged
   * @param {string} level - Log level
   * @returns {boolean} Should log
   */
  shouldLog(level) {
    return this.levels[level] <= this.levels[this.logLevel];
  }

  /**
   * Format log message
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} meta - Metadata
   * @returns {string} Formatted message
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const levelUpper = level.toUpperCase();
    
    let formatted = `[${timestamp}] ${levelUpper}: ${message}`;

    if (Object.keys(meta).length > 0) {
      formatted += ` ${JSON.stringify(meta)}`;
    }

    return formatted;
  }

  /**
   * Colorize message
   * @param {string} level - Log level
   * @param {string} message - Message to colorize
   * @returns {string} Colorized message
   */
  colorize(level, message) {
    if (!this.enableColors) {
      return message;
    }

    const color = this.colors[level] || '';
    const reset = this.colors.reset;
    
    return `${color}${message}${reset}`;
  }

  /**
   * Write log to file
   * @param {string} message - Log message
   */
  writeToFile(message) {
    if (!this.logFile) {
      return;
    }

    try {
      fs.appendFileSync(this.logFile, message + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Log message
   * @param {string} level - Log level
   * @param {string} message - Message
   * @param {Object} meta - Metadata
   */
  log(level, message, meta = {}) {
    if (!this.shouldLog(level)) {
      return;
    }

    const formatted = this.formatMessage(level, message, meta);
    const colored = this.colorize(level, formatted);

    console.log(colored);
    this.writeToFile(formatted);
  }

  /**
   * Log error
   * @param {string} message - Error message
   * @param {Error|Object} error - Error object or metadata
   */
  error(message, error = {}) {
    const meta = error instanceof Error
      ? { error: error.message, stack: error.stack }
      : error;

    this.log('error', message, meta);
  }

  /**
   * Log warning
   * @param {string} message - Warning message
   * @param {Object} meta - Metadata
   */
  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  /**
   * Log info
   * @param {string} message - Info message
   * @param {Object} meta - Metadata
   */
  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  /**
   * Log debug
   * @param {string} message - Debug message
   * @param {Object} meta - Metadata
   */
  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  /**
   * Log trace
   * @param {string} message - Trace message
   * @param {Object} meta - Metadata
   */
  trace(message, meta = {}) {
    this.log('trace', message, meta);
  }

  /**
   * Create child logger with additional context
   * @param {Object} context - Additional context
   * @returns {Logger} Child logger
   */
  child(context = {}) {
    const childLogger = new Logger({
      logLevel: this.logLevel,
      logFile: this.logFile,
      enableColors: this.enableColors
    });

    const originalLog = childLogger.log.bind(childLogger);
    childLogger.log = (level, message, meta = {}) => {
      originalLog(level, message, { ...context, ...meta });
    };

    return childLogger;
  }
}

// Create default logger instance
const defaultLogger = new Logger();

module.exports = Logger;
module.exports.default = defaultLogger;
