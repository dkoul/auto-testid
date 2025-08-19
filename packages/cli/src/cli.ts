#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { createAutoTestID } from '@dkoul/auto-testid-core';
import { generateCommand } from './commands/generate';
import { scanCommand } from './commands/scan';
import { validateCommand } from './commands/validate';
import { initCommand } from './commands/init';

const program = new Command();

// Package information
const packageInfo = require('../package.json');

program
  .name('auto-testid')
  .description('🎯 Automatically generate custom attributes for UI testing and analytics')
  .version(packageInfo.version, '-v, --version', 'Display version number')
  .helpOption('-h, --help', 'Display help information');

// Global options
program
  .option('-c, --config <path>', 'Path to configuration file')
  .option('-l, --log-level <level>', 'Set log level (error, warn, info, debug, verbose)', 'info')
  .option('--no-color', 'Disable colored output')
  .option('--silent', 'Suppress all output except errors');

// Generate command
program
  .command('generate')
  .alias('gen')
  .description('Generate custom attributes for files or directories')
  .argument('[path]', 'File or directory path to process', process.cwd())
  .option('-f, --framework <framework>', 'Target framework (react, vue, angular, html)', 'react')
  .option('-d, --dry-run', 'Show what would be changed without modifying files', false)
  .option('-b, --backup', 'Create backup files before modification', false)
  .option('-e, --exclude <patterns...>', 'Exclude patterns (glob)')
  .option('-i, --include <patterns...>', 'Include patterns (glob)')
  .option('-p, --prefix <prefix>', 'Test ID prefix', 'test')
  .option('-a, --attribute-name <name>', 'Attribute name to add', 'data-testid')
  .option('--naming <strategy>', 'Naming strategy (kebab-case, camelCase, snake_case)', 'kebab-case')
  .option('--max-length <number>', 'Maximum test ID length', '50')
  .option('--parallel <number>', 'Number of parallel workers', '4')
  .action(generateCommand);

// Scan command
program
  .command('scan')
  .description('Scan directory for files that need data-testid attributes')
  .argument('[path]', 'Directory path to scan', process.cwd())
  .option('-f, --framework <framework>', 'Target framework (react, vue, angular, html)')
  .option('-e, --exclude <patterns...>', 'Exclude patterns (glob)')
  .option('-i, --include <patterns...>', 'Include patterns (glob)')
  .option('--stats', 'Show detailed statistics', false)
  .action(scanCommand);

// Validate command
program
  .command('validate')
  .alias('check')
  .description('Validate existing data-testid attributes for conflicts and issues')
  .argument('[path]', 'File or directory path to validate', process.cwd())
  .option('-f, --framework <framework>', 'Target framework (react, vue, angular, html)')
  .option('--fix', 'Automatically fix detected issues', false)
  .option('--report <format>', 'Output format (console, json, csv)', 'console')
  .action(validateCommand);

// Init command
program
  .command('init')
  .description('Initialize configuration file')
  .option('-f, --format <format>', 'Configuration format (json, js)', 'json')
  .option('--interactive', 'Interactive configuration setup', false)
  .action(initCommand);

// Examples command
program
  .command('examples')
  .description('Show usage examples')
  .action(() => {
    console.log(chalk.cyan.bold('\n🎯 Auto-TestID Usage Examples\n'));
    
    console.log(chalk.yellow('Basic usage:'));
    console.log('  auto-testid generate ./src/components');
    console.log('  auto-testid gen . --dry-run');
    console.log('  auto-testid scan ./src --stats\n');
    
    console.log(chalk.yellow('Framework-specific:'));
    console.log('  auto-testid generate ./src --framework react');
    console.log('  auto-testid generate ./src --framework vue');
    console.log('  auto-testid generate ./src --framework angular\n');
    
    console.log(chalk.yellow('Customization:'));
    console.log('  auto-testid generate ./src --prefix e2e --naming camelCase');
    console.log('  auto-testid generate ./src --attribute-name data-analytics --prefix track');
    console.log('  auto-testid generate ./src --exclude "**/*.test.*" "**/*.spec.*"');
    console.log('  auto-testid generate ./src --max-length 30 --backup\n');
    
    console.log(chalk.yellow('Configuration:'));
    console.log('  auto-testid init --interactive');
    console.log('  auto-testid generate ./src --config custom-config.json\n');
    
    console.log(chalk.yellow('Validation:'));
    console.log('  auto-testid validate ./src --fix');
    console.log('  auto-testid validate ./src --report json > report.json\n');
    
    console.log(chalk.gray('For more information, visit: https://github.com/auto-testid/auto-testid'));
  });

// Error handling
program.exitOverride();

try {
  program.parse();
} catch (err: any) {
  if (err.code === 'commander.version') {
    // Version was requested, exit gracefully
    process.exit(0);
  } else if (err.code === 'commander.help') {
    // Help was requested, exit gracefully
    process.exit(0);
  } else if (err.code === 'commander.unknownCommand') {
    console.error(chalk.red(`❌ Unknown command: ${err.message}`));
    console.log(chalk.gray('\nRun "auto-testid --help" to see available commands.'));
    process.exit(1);
  } else {
    // Unexpected error
    console.error(chalk.red('❌ An unexpected error occurred:'));
    console.error(chalk.red(err.message));
    if (process.env.DEBUG) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(chalk.red('❌ Uncaught Exception:'), err.message);
  if (process.env.DEBUG) {
    console.error(err.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('❌ Unhandled Rejection at:'), promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n⚠️  Process interrupted by user'));
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(chalk.yellow('\n⚠️  Process terminated'));
  process.exit(0);
}); 