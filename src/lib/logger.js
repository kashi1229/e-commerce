// src/lib/logger.js
const isDev = import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development';
const isLoggingEnabled = import.meta.env.VITE_ENABLE_LOGGING !== 'false';
const isDebugEnabled = import.meta.env.VITE_ENABLE_DEBUG === 'true';

class Logger {
  constructor(context = 'App') {
    this.context = context;
  }

  _formatMessage(level, message) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    return `[${timestamp}] [${level}] [${this.context}] ${message}`;
  }

  debug(message, ...args) {
    if (isDebugEnabled || isDev) {
      console.log(this._formatMessage('DEBUG', message), ...args);
    }
  }

  info(message, ...args) {
    if (isLoggingEnabled) {
      console.info(this._formatMessage('INFO', message), ...args);
    }
  }

  success(message, ...args) {
    if (isLoggingEnabled) {
      console.log(`%c${this._formatMessage('SUCCESS', message)}`, 'color: green', ...args);
    }
  }

  warn(message, ...args) {
    if (isLoggingEnabled) {
      console.warn(this._formatMessage('WARN', message), ...args);
    }
  }

  error(message, ...args) {
    console.error(this._formatMessage('ERROR', message), ...args);
  }
}

export const appLogger = new Logger('App');
export const authLogger = new Logger('Auth');
export const apiLogger = new Logger('API');
export const storageLogger = new Logger('Storage');

export default Logger;