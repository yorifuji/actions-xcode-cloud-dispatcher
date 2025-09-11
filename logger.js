/**
 * Available log levels in order of severity
 */
const LOG_LEVELS = {
  ERROR: "ERROR",
  WARN: "WARN",
  INFO: "INFO",
  DEBUG: "DEBUG"
};

/**
 * Logger class for structured logging with level control
 */
class Logger {
  /**
   * Creates a new Logger instance
   * @param {Object} options - Logger configuration options
   * @param {boolean} options.enabled - Whether logging is enabled
   * @param {string} options.minLevel - Minimum log level to output
   */
  constructor(options = {}) {
    this.enabled = options.enabled || false;
    this.minLevel = options.minLevel || LOG_LEVELS.INFO;
    this.levels = {
      [LOG_LEVELS.DEBUG]: 0,
      [LOG_LEVELS.INFO]: 1,
      [LOG_LEVELS.WARN]: 2,
      [LOG_LEVELS.ERROR]: 3
    };
  }

  /**
   * Determines if a message at the given level should be logged
   * @param {string} level - The log level to check
   * @returns {boolean} Whether the message should be logged
   */
  shouldLog(level) {
    if (!this.enabled) return false;
    return this.levels[level] >= this.levels[this.minLevel];
  }

  /**
   * Logs a debug message
   * @param {string} message - The message to log
   * @param  {...any} args - Additional arguments to log
   */
  debug(message, ...args) {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Logs an info message
   * @param {string} message - The message to log
   * @param  {...any} args - Additional arguments to log
   */
  info(message, ...args) {
    if (this.shouldLog(LOG_LEVELS.INFO)) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  /**
   * Logs a warning message
   * @param {string} message - The message to log
   * @param  {...any} args - Additional arguments to log
   */
  warn(message, ...args) {
    if (this.shouldLog(LOG_LEVELS.WARN)) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  /**
   * Logs an error message
   * @param {string} message - The message to log
   * @param  {...any} args - Additional arguments to log
   */
  error(message, ...args) {
    if (this.shouldLog(LOG_LEVELS.ERROR)) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  /**
   * Logs API request details
   * @param {string} method - HTTP method
   * @param {string} path - Request path
   * @param {Object} options - Request options
   */
  logApiRequest(method, path, options = {}) {
    this.debug(`API Request: ${method} ${path}`);
    if (options.body) {
      try {
        const body = typeof options.body === 'string' 
          ? JSON.parse(options.body) 
          : options.body;
        this.debug("Request body:", body);
      } catch (e) {
        this.debug("Request body: [Could not parse]");
      }
    }
  }

  /**
   * Logs API response details
   * @param {number} status - HTTP status code
   * @param {Object} data - Response data
   */
  logApiResponse(status, data) {
    this.debug(`Response status: ${status}`);
    this.debug("Response data:", data);
  }
}

module.exports = { Logger, LOG_LEVELS };
