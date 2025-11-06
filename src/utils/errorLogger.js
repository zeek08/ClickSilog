/**
 * Error logging utility for monitoring app errors and user interactions
 */

class ErrorLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 100;
    this.enabled = __DEV__ || process.env.NODE_ENV === 'development';
  }

  /**
   * Log an error with context
   */
  logError(error, context = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'error',
      message: error?.message || String(error),
      stack: error?.stack,
      context,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'React Native',
    };

    this.logs.push(logEntry);
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    if (this.enabled) {
      console.error('ErrorLogger:', logEntry);
    }

    // In production, you could send to an analytics service
    // Example: analytics.track('Error', logEntry);
  }

  /**
   * Log user interaction
   */
  logInteraction(action, component, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'interaction',
      action,
      component,
      data,
    };

    this.logs.push(logEntry);

    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    if (this.enabled) {
      console.log('Interaction:', logEntry);
    }
  }

  /**
   * Log UI event (button press, navigation, etc.)
   */
  logUIEvent(eventType, details = {}) {
    this.logInteraction('ui_event', eventType, details);
  }

  /**
   * Get all logs
   */
  getLogs() {
    return [...this.logs];
  }

  /**
   * Clear logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Get error logs only
   */
  getErrorLogs() {
    return this.logs.filter(log => log.type === 'error');
  }

  /**
   * Get interaction logs only
   */
  getInteractionLogs() {
    return this.logs.filter(log => log.type === 'interaction');
  }

  /**
   * Export logs as JSON
   */
  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const errorLogger = new ErrorLogger();

// Export for use in components
export default errorLogger;

