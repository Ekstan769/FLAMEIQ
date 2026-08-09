import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const { combine, timestamp, printf, colorize } = winston.format;

// Custom format
const customFormat = printf((info) => {
  const { level, message, timestamp, ...metadata } = info;
  let msg = `${timestamp} [${level}] : ${message} `;
  if (Object.keys(metadata).length > 0) {
    msg += JSON.stringify(metadata);
  }
  return msg;
});

// Casual logger for normal application flow (INFO, HTTP requests, etc)
export const casualLogger = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    customFormat
  ),
  transports: [
    new winston.transports.File({ filename: path.join(logDir, 'casual.log') }),
    // Also log casual to console for development visibility
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        customFormat
      ),
    })
  ],
});

// Urgent logger for security issues, crashes, and errors
export const urgentLogger = winston.createLogger({
  level: 'warn',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    customFormat
  ),
  transports: [
    new winston.transports.File({ filename: path.join(logDir, 'urgent.log'), level: 'warn' }),
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        customFormat
      ),
    })
  ],
});

const adapt = (loggerMethod: any) => (arg1: any, arg2?: any) => {
  if (typeof arg1 === 'string') {
    loggerMethod(arg1, arg2);
  } else {
    loggerMethod(String(arg2 || ''), arg1);
  }
};

// Backward compatibility
export const logger = {
  info: adapt(casualLogger.info.bind(casualLogger)),
  debug: adapt(casualLogger.debug.bind(casualLogger)),
  warn: adapt(urgentLogger.warn.bind(urgentLogger)),
  error: adapt(urgentLogger.error.bind(urgentLogger)),
};

export default logger;
