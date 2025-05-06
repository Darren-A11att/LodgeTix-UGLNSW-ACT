// A simple script to test the logger implementation
import logger, { LogLevel } from '../src/lib/loggerUtils.ts';

console.log('Testing logger implementation...');

// Set to a higher level to see all logs
logger.configure({
  level: LogLevel.DEBUG,
  prefix: 'TEST',
  persistToDb: false, // Set to true to test database persistence
});

// Test all log methods
logger.debug('This is a debug message', { context: 'debugging' });
logger.info('This is an info message', { userId: '123', action: 'test' });
logger.warn('This is a warning message');
logger.error('This is an error message', new Error('Test error'));

// Test configuration
console.log('Current logger config:', logger.getConfig());

// Reset to defaults
logger.reset();
console.log('Reset logger config:', logger.getConfig());

console.log('Logger test complete!');