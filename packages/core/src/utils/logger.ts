export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'verbose';

export interface LoggerOptions {
  level?: LogLevel;
  prefix?: string;
  timestamp?: boolean;
  colorize?: boolean;
}

export class Logger {
  private static globalLevel: LogLevel = 'info';
  private options: Required<LoggerOptions>;

  private readonly LOG_LEVELS: Record<LogLevel, number> = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    verbose: 4,
  };

  private readonly COLORS = {
    error: '\x1b[31m',   // Red
    warn: '\x1b[33m',    // Yellow
    info: '\x1b[36m',    // Cyan
    debug: '\x1b[35m',   // Magenta
    verbose: '\x1b[37m', // White
    reset: '\x1b[0m',    // Reset
    dim: '\x1b[2m',      // Dim
    bold: '\x1b[1m',     // Bold
  };

  constructor(prefix?: string, options: LoggerOptions = {}) {
    this.options = {
      level: options.level || Logger.globalLevel,
      prefix: options.prefix || prefix || 'AutoTestID',
      timestamp: options.timestamp ?? true,
      colorize: options.colorize ?? true,
    };
  }

  static setGlobalLevel(level: LogLevel): void {
    Logger.globalLevel = level;
  }

  static getGlobalLevel(): LogLevel {
    return Logger.globalLevel;
  }

  error(message: string, ...args: any[]): void {
    this.log('error', message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log('warn', message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log('info', message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    this.log('debug', message, ...args);
  }

  verbose(message: string, ...args: any[]): void {
    this.log('verbose', message, ...args);
  }

  time(label: string): void {
    console.time(`${this.options.prefix}:${label}`);
  }

  timeEnd(label: string): void {
    console.timeEnd(`${this.options.prefix}:${label}`);
  }

  group(label: string): void {
    if (this.shouldLog('info')) {
      console.group(this.formatMessage('info', label));
    }
  }

  groupEnd(): void {
    if (this.shouldLog('info')) {
      console.groupEnd();
    }
  }

  table(data: any[]): void {
    if (this.shouldLog('info')) {
      console.table(data);
    }
  }

  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message);
    const logMethod = this.getLogMethod(level);
    
    if (args.length > 0) {
      logMethod(formattedMessage, ...args);
    } else {
      logMethod(formattedMessage);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return this.LOG_LEVELS[level] <= this.LOG_LEVELS[this.options.level];
  }

  private formatMessage(level: LogLevel, message: string): string {
    let formatted = '';

    // Add timestamp
    if (this.options.timestamp) {
      const timestamp = new Date().toISOString();
      formatted += this.options.colorize 
        ? `${this.COLORS.dim}${timestamp}${this.COLORS.reset} `
        : `${timestamp} `;
    }

    // Add level indicator
    const levelIndicator = `[${level.toUpperCase()}]`;
    if (this.options.colorize) {
      const color = this.COLORS[level];
      formatted += `${color}${this.COLORS.bold}${levelIndicator}${this.COLORS.reset} `;
    } else {
      formatted += `${levelIndicator} `;
    }

    // Add prefix
    if (this.options.prefix) {
      if (this.options.colorize) {
        formatted += `${this.COLORS.dim}${this.options.prefix}:${this.COLORS.reset} `;
      } else {
        formatted += `${this.options.prefix}: `;
      }
    }

    // Add message
    formatted += message;

    return formatted;
  }

  private getLogMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case 'error':
        return console.error;
      case 'warn':
        return console.warn;
      case 'info':
        return console.info;
      case 'debug':
      case 'verbose':
        return console.log;
      default:
        return console.log;
    }
  }

  // Create child logger with additional prefix
  child(prefix: string, options?: Partial<LoggerOptions>): Logger {
    const childPrefix = `${this.options.prefix}:${prefix}`;
    return new Logger(childPrefix, { ...this.options, ...options });
  }

  // Progress logging utilities
  progress(current: number, total: number, message?: string): void {
    const percentage = Math.round((current / total) * 100);
    const progressBar = this.createProgressBar(percentage);
    const progressMessage = message 
      ? `${progressBar} ${percentage}% ${message}` 
      : `${progressBar} ${percentage}% (${current}/${total})`;
    
    if (this.shouldLog('info')) {
      // Use process.stdout.write to overwrite the same line
      process.stdout.write(`\r${this.formatMessage('info', progressMessage)}`);
      
      // Add newline when complete
      if (current === total) {
        process.stdout.write('\n');
      }
    }
  }

  private createProgressBar(percentage: number, length: number = 20): string {
    const filled = Math.round((percentage / 100) * length);
    const empty = length - filled;
    
    if (this.options.colorize) {
      return `${this.COLORS.dim}[${'█'.repeat(filled)}${'░'.repeat(empty)}]${this.COLORS.reset}`;
    } else {
      return `[${'#'.repeat(filled)}${'-'.repeat(empty)}]`;
    }
  }

  // Metrics and performance logging
  metrics(label: string, metrics: Record<string, number | string>): void {
    if (!this.shouldLog('info')) return;

    this.info(`${label} Metrics:`);
    Object.entries(metrics).forEach(([key, value]) => {
      const formattedValue = typeof value === 'number' 
        ? value.toLocaleString() 
        : value;
      this.info(`  ${key}: ${formattedValue}`);
    });
  }

  // Error logging with stack traces
  exception(error: Error | unknown, context?: string): void {
    if (error instanceof Error) {
      this.error(`${context ? context + ': ' : ''}${error.message}`);
      if (error.stack && this.shouldLog('debug')) {
        this.debug('Stack trace:', error.stack);
      }
    } else {
      this.error(`${context ? context + ': ' : ''}${String(error)}`);
    }
  }
}

// Default logger instance
export const logger = new Logger();

// Convenience functions for global logging
export const log = {
  error: (message: string, ...args: any[]) => logger.error(message, ...args),
  warn: (message: string, ...args: any[]) => logger.warn(message, ...args),
  info: (message: string, ...args: any[]) => logger.info(message, ...args),
  debug: (message: string, ...args: any[]) => logger.debug(message, ...args),
  verbose: (message: string, ...args: any[]) => logger.verbose(message, ...args),
  setLevel: (level: LogLevel) => Logger.setGlobalLevel(level),
}; 