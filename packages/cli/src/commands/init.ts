import chalk from 'chalk';
import * as fs from 'fs/promises';
import * as path from 'path';

interface InitOptions {
  format?: string;
  interactive?: boolean;
}

export async function initCommand(options: InitOptions): Promise<void> {
  const format = options.format || 'json';
  const filename = format === 'json' ? '.autotestidrc.json' : 'autotestid.config.js';
  
  const defaultConfig = {
    frameworks: ['react'],
    namingStrategy: { type: 'kebab-case' },
    prefix: 'test',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/*.test.*',
      '**/*.spec.*'
    ],
    includeElementTypes: ['button', 'input', 'select', 'textarea', 'form', 'a', 'div'],
    maxIdLength: 50,
    preserveExisting: true
  };

  try {
    const configPath = path.join(process.cwd(), filename);
    
    // Check if config already exists
    try {
      await fs.access(configPath);
      console.log(chalk.yellow(`⚠️  Configuration file already exists: ${filename}`));
      console.log(chalk.gray('Use --force to overwrite (not implemented yet)'));
      return;
    } catch {
      // File doesn't exist, continue
    }

    let configContent: string;
    
    if (format === 'json') {
      configContent = JSON.stringify(defaultConfig, null, 2);
    } else {
      configContent = `module.exports = ${JSON.stringify(defaultConfig, null, 2)};`;
    }

    await fs.writeFile(configPath, configContent, 'utf-8');
    
    console.log(chalk.green(`✅ Created configuration file: ${filename}`));
    console.log(chalk.blue('\n📝 Default configuration:'));
    console.log(chalk.gray(JSON.stringify(defaultConfig, null, 2)));
    
    console.log(chalk.cyan('\n💡 Next steps:'));
    console.log('   • Edit the configuration file to match your project needs');
    console.log('   • Run "auto-testid generate ./src" to start generating test IDs');
    
  } catch (error: any) {
    console.error(chalk.red(`❌ Failed to create configuration: ${error.message}`));
    process.exit(1);
  }
} 