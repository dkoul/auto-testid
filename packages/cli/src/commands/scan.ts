import chalk from 'chalk';
import ora from 'ora';
import { createAutoTestID } from '@dkoul/auto-testid-core';
import * as path from 'path';

interface ScanOptions {
  framework?: string;
  exclude?: string[];
  include?: string[];
  stats?: boolean;
  config?: string;
}

export async function scanCommand(targetPath: string, options: ScanOptions): Promise<void> {
  const spinner = ora('Scanning directory...').start();
  
  try {
    const autoTestID = createAutoTestID();
    const resolvedPath = path.resolve(targetPath);
    
    const scanOptions = {
      include: options.include || ['**/*.{js,jsx,ts,tsx,vue,html}'],
      exclude: options.exclude || [
        '**/node_modules/**',
        '**/dist/**', 
        '**/build/**',
        '**/*.test.*',
        '**/*.spec.*'
      ],
      frameworks: options.framework ? [options.framework as any] : ['react'],
      recursive: true,
    };

    const files = await autoTestID.scanDirectory(resolvedPath, scanOptions);
    spinner.succeed(`Found ${files.length} files`);

    console.log(chalk.cyan.bold('\n📁 Scan Results\n'));
    console.log(`${chalk.blue('Target:')} ${resolvedPath}`);
    console.log(`${chalk.green('Files found:')} ${files.length}`);

    if (options.stats) {
      console.log(chalk.blue.bold('\n📊 File breakdown:'));
      const extensions: Record<string, number> = {};
      
      files.forEach(file => {
        const ext = path.extname(file);
        extensions[ext] = (extensions[ext] || 0) + 1;
      });

      Object.entries(extensions).forEach(([ext, count]) => {
        console.log(`   ${ext || 'no extension'}: ${count} files`);
      });
    }

    if (files.length <= 20) {
      console.log(chalk.blue.bold('\n📋 Files to process:'));
      files.forEach(file => {
        console.log(`   ${chalk.dim('•')} ${path.relative(resolvedPath, file)}`);
      });
    }

  } catch (error: any) {
    spinner.fail(`Scan failed: ${error.message}`);
    process.exit(1);
  }
} 