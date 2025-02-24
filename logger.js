/**
 * Available log levels in order of severity
 */
const LOG_LEVELS = {
  ERROR: "ERROR",
  WARN: "WARN",
  INFO: "INFO",
  DEBUG: "DEBUG",
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
    this.levels = Object.values(LOG_LEVELS);
  }

  /**
   * Formats current time as ISO string
   * @returns {string} Formatted timestamp
   */
  formatTime() {
    return new Date().toISOString();
  }

  /**
   * Determines if a message should be logged based on level
   * @param {string} level - Log level to check
   * @returns {boolean} Whether the message should be logged
   */
  shouldLog(level) {
    if (!this.enabled) return false;
    const currentLevelIndex = this.levels.indexOf(level);
    const minLevelIndex = this.levels.indexOf(this.minLevel);
    return currentLevelIndex <= minLevelIndex;
  }

  /**
   * Formats a log message with timestamp and data
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {*} data - Additional data to log
   * @returns {string} Formatted log message
   */
  formatMessage(level, message, data = null) {
    const timestamp = this.formatTime();
    const prefix = `[${timestamp}] ${level}`;

    if (data) {
      if (typeof data === "object") {
        return `${prefix} ${message}:\n${JSON.stringify(data, null, 2)}`;
      }
      return `${prefix} ${message}: ${data}`;
    }
    return `${prefix} ${message}`;
  }

  /**
   * Logs a message at the specified level
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {*} data - Additional data to log
   */
  log(level, message, data = null) {
    if (!this.shouldLog(level)) return;
    console.log(this.formatMessage(level, message, data));
  }

  /**
   * Logs an error message
   * @param {string} message - Error message
   * @param {*} data - Error details
   */
  error(message, data = null) {
    this.log(LOG_LEVELS.ERROR, message, data);
  }

  /**
   * Logs a warning message
   * @param {string} message - Warning message
   * @param {*} data - Warning details
   */
  warn(message, data = null) {
    this.log(LOG_LEVELS.WARN, message, data);
  }

  /**
   * Logs an info message
   * @param {string} message - Info message
   * @param {*} data - Additional information
   */
  info(message, data = null) {
    this.log(LOG_LEVELS.INFO, message, data);
  }

  /**
   * Logs a debug message
   * @param {string} message - Debug message
   * @param {*} data - Debug information
   */
  debug(message, data = null) {
    this.log(LOG_LEVELS.DEBUG, message, data);
  }

  /**
   * Logs API request details
   * @param {string} method - HTTP method
   * @param {string} path - API endpoint path
   * @param {Object} options - Request options
   */
  logApiRequest(method, path, options = {}) {
    this.info(`🌐 API Request [${method}] ${path}`, {
      method,
      path,
      headers: {
        ...options.headers,
        Authorization: "Bearer [REDACTED]",
      },
      body: options.body ? JSON.parse(options.body) : undefined,
    });
  }

  /**
   * Logs API response details
   * @param {string} method - HTTP method
   * @param {string} path - API endpoint path
   * @param {Response} response - Fetch response object
   * @param {number} duration - Request duration in milliseconds
   */
  logApiResponse(method, path, response, duration) {
    this.info(`📥 API Response [${response.status}] ${path}`, {
      status: response.status,
      statusText: response.statusText,
      duration: `${duration}ms`,
      headers: Object.fromEntries(response.headers.entries()),
    });
  }

  /**
   * Logs API response body
   * @param {Object} data - Response body data
   */
  logApiResponseBody(data) {
    this.debug("📦 Response Body", data);
  }

  /**
   * Logs API error details
   * @param {Object} error - Error information
   * @param {Object} context - Error context
   */
  logApiError(error, context = {}) {
    this.error("❌ API Error", {
      ...error,
      context,
    });
  }
}

module.exports = {
  LOG_LEVELS,
  Logger,
};
