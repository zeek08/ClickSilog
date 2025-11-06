/**
 * Safe Error Handler Utility
 * Handles global error management with fallbacks for environments where ErrorUtils may not be available
 */

/**
 * Setup global error handler with safe fallbacks
 */
export function setupGlobalErrorHandler() {
  // Check if ErrorUtils is available
  if (global.ErrorUtils && global.ErrorUtils.setGlobalHandler) {
    try {
      // Get original handler if available
      const originalHandler = global.ErrorUtils.getGlobalHandler?.() || null;

      // Set custom handler
      global.ErrorUtils.setGlobalHandler((error, isFatal) => {
        console.error('Global Error Handler:', error);
        console.error('Error Message:', error?.message || 'Unknown error');
        console.error('Stack Trace:', error?.stack || 'No stack trace');
        console.error('Is Fatal:', isFatal);

        // Log specific details about spacing errors
        if (error?.message && error.message.includes('spacing')) {
          console.error('Spacing Error Detected:', {
            message: error.message,
            stack: error.stack,
            component: error.stack?.split('\n')[1] || 'Unknown',
          });
        }

        // Call original handler if it exists
        if (originalHandler && typeof originalHandler === 'function') {
          try {
            originalHandler(error, isFatal);
          } catch (e) {
            console.error('Error in original handler:', e);
          }
        }
      });
    } catch (e) {
      console.warn('Failed to set ErrorUtils handler:', e);
      // Fall through to alternative handlers
    }
  }

  // Fallback: Use global error handlers for environments without ErrorUtils
  if (typeof globalThis !== 'undefined') {
    // Browser/Web environment fallback
    if (typeof globalThis.onerror === 'undefined') {
      globalThis.onerror = (msg, src, line, col, err) => {
        console.error('Global Error (onerror):', {
          message: msg,
          source: src,
          line,
          column: col,
          error: err,
        });
        return false; // Don't prevent default error handling
      };
    }
  }

  // Node.js environment fallback
  if (typeof process !== 'undefined' && process.on) {
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
  }
}

/**
 * Get global error handler safely
 */
export function getGlobalErrorHandler() {
  if (global.ErrorUtils && global.ErrorUtils.getGlobalHandler) {
    try {
      return global.ErrorUtils.getGlobalHandler();
    } catch (e) {
      console.warn('Failed to get ErrorUtils handler:', e);
    }
  }
  return null;
}

/**
 * Set global error handler safely
 */
export function setGlobalErrorHandler(handler) {
  if (!handler || typeof handler !== 'function') {
    console.warn('setGlobalErrorHandler: handler must be a function');
    return;
  }

  if (global.ErrorUtils && global.ErrorUtils.setGlobalHandler) {
    try {
      global.ErrorUtils.setGlobalHandler(handler);
    } catch (e) {
      console.warn('Failed to set ErrorUtils handler:', e);
    }
  } else {
    console.warn('ErrorUtils is not available in this environment');
  }
}

