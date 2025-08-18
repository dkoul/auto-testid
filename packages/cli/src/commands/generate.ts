import chalk from 'chalk';
import ora from 'ora';
import { createAutoTestID, ConfigurationSchema, ProcessResult, ProcessProgress } from '@dkoul/auto-testid-core';
import * as path from 'path';
import * as fs from 'fs/promises';

interface GenerateOptions {
  framework?: string;
  dryRun?: boolean;
  backup?: boolean;
  exclude?: string[];
  include?: string[];
  prefix?: string;
  naming?: string;
  maxLength?: string;
  parallel?: string;
  config?: string;
  logLevel?: string;
  silent?: boolean;
  color?: boolean;
}

export async function generateCommand(targetPath: string, options: GenerateOptions): Promise<void> {
  const spinner = ora('Initializing Auto-TestID...').start();
  
  try {
    // Parse options
    const config: Partial<ConfigurationSchema> = {
      frameworks: options.framework ? [options.framework as any] : ['react'],
      namingStrategy: { type: options.naming as any || 'kebab-case' },
      prefix: options.prefix || 'test',
      maxIdLength: parseInt(options.maxLength || '50'),
      exclude: options.exclude || [],
      preserveExisting: true,
    };

    // Load custom config if specified
    if (options.config) {
      try {
        const configContent = await fs.readFile(options.config, 'utf-8');
        const customConfig = JSON.parse(configContent);
        Object.assign(config, customConfig);
        spinner.succeed(`Configuration loaded from ${options.config}`);
      } catch (error) {
        spinner.warn(`Could not load config from ${options.config}, using defaults`);
      }
    } else {
      spinner.succeed('Using default configuration');
    }

    // Initialize the core API
    const autoTestID = createAutoTestID(config);
    
    // Resolve target path
    const resolvedPath = path.resolve(targetPath);
    
    // Check if path exists
    try {
      await fs.access(resolvedPath);
    } catch {
      spinner.fail(`Path does not exist: ${resolvedPath}`);
      process.exit(1);
    }

    // Determine if processing file or directory
    const stats = await fs.stat(resolvedPath);
    let filePaths: string[] = [];

    if (stats.isFile()) {
      filePaths = [resolvedPath];
      spinner.succeed(`Processing single file: ${path.basename(resolvedPath)}`);
    } else if (stats.isDirectory()) {
      spinner.text = 'Scanning directory for files...';
      
      const scanOptions = {
        include: options.include || ['**/*.{js,jsx,ts,tsx,vue,html}'],
        exclude: options.exclude || [
          '**/node_modules/**',
          '**/dist/**',
          '**/build/**',
          '**/*.test.*',
          '**/*.spec.*'
        ],
        frameworks: config.frameworks || ['react'],
        recursive: true,
      };

      filePaths = await autoTestID.scanDirectory(resolvedPath, scanOptions);
      
      if (filePaths.length === 0) {
        spinner.warn('No supported files found in directory');
        process.exit(0);
      }

      spinner.succeed(`Found ${filePaths.length} files to process`);
    }

    // Progress tracking
    let processedFiles = 0;
    let totalElements = 0;
    let totalTransformed = 0;
    let totalErrors = 0;

    const progressSpinner = ora('Processing files...').start();

    const onProgress = (progress: ProcessProgress) => {
      const percentage = Math.round((progress.completed / progress.total) * 100);
      progressSpinner.text = `Processing ${progress.stage}: ${path.basename(progress.current)} (${percentage}%)`;
    };

    // Process files
    const results = await autoTestID.processFiles(filePaths, {
      dryRun: options.dryRun,
      backup: options.backup,
      config,
      onProgress,
    });

    progressSpinner.stop();

    // Analyze results
    let hasErrors = false;
    const successfulResults: ProcessResult[] = [];
    const failedResults: ProcessResult[] = [];

    results.forEach(result => {
      processedFiles++;
      totalElements += result.metrics.elementsFound;
      totalTransformed += result.metrics.elementsTransformed;
      totalErrors += result.errors.length;

      if (result.success) {
        successfulResults.push(result);
      } else {
        failedResults.push(result);
        hasErrors = true;
      }
    });

    // Display results
    console.log(chalk.cyan.bold('\n🎯 Auto-TestID Generation Results\n'));

    if (options.dryRun) {
      console.log(chalk.yellow('📋 Dry Run Mode - No files were modified\n'));
    }

    // Summary statistics
    console.log(chalk.white('📊 Summary:'));
    console.log(`   ${chalk.green('Files processed:')} ${processedFiles}`);
    console.log(`   ${chalk.blue('Elements found:')} ${totalElements}`);
    console.log(`   ${chalk.green('Test IDs generated:')} ${totalTransformed}`);
    
    if (totalErrors > 0) {
      console.log(`   ${chalk.red('Errors:')} ${totalErrors}`);
    }

    // Show successful transformations
    if (successfulResults.length > 0) {
      console.log(chalk.green.bold('\n✅ Successfully processed:'));
      
      successfulResults.forEach(result => {
        const fileName = path.basename(result.filePath);
        const transformCount = result.transformations.length;
        const timeMs = result.metrics.processingTime;
        
        console.log(`   ${chalk.green('✓')} ${fileName} (${transformCount} test IDs, ${timeMs}ms)`);
        
        // Show transformations in dry-run mode
        if (options.dryRun && result.transformations.length > 0) {
          result.transformations.slice(0, 3).forEach(transform => {
            const element = transform.element;
            const preview = element.content ? ` "${element.content}"` : '';
            console.log(`     ${chalk.dim('+')} ${element.tag}${preview} → data-testid="${transform.value}"`);
          });
          
          if (result.transformations.length > 3) {
            console.log(`     ${chalk.dim(`... and ${result.transformations.length - 3} more`)}`);
          }
        }
      });
    }

    // Show errors
    if (failedResults.length > 0) {
      console.log(chalk.red.bold('\n❌ Failed to process:'));
      
      failedResults.forEach(result => {
        const fileName = path.basename(result.filePath);
        console.log(`   ${chalk.red('✗')} ${fileName}`);
        
        result.errors.forEach(error => {
          console.log(`     ${chalk.red('→')} ${error.message}`);
        });
      });
    }

    // Performance metrics
    const totalTime = results.reduce((sum, r) => sum + r.metrics.processingTime, 0);
    const avgTimePerFile = totalTime / results.length;
    
    console.log(chalk.blue.bold('\n⚡ Performance:'));
    console.log(`   ${chalk.blue('Total time:')} ${totalTime}ms`);
    console.log(`   ${chalk.blue('Average per file:')} ${avgTimePerFile.toFixed(1)}ms`);

    // Recommendations
    if (totalTransformed === 0 && totalElements > 0) {
      console.log(chalk.yellow.bold('\n💡 Recommendations:'));
      console.log('   • Elements were found but no test IDs were generated');
      console.log('   • Check your include/exclude patterns');
      console.log('   • Verify the framework setting matches your files');
    }

    if (options.dryRun && totalTransformed > 0) {
      console.log(chalk.yellow.bold('\n💡 Next steps:'));
      console.log(`   • Run without --dry-run to apply ${totalTransformed} changes`);
      console.log('   • Use --backup to create backup files');
    }

    // Exit with appropriate code
    process.exit(hasErrors ? 1 : 0);

  } catch (error: any) {
    spinner.fail(`Generation failed: ${error.message}`);
    
    if (options.logLevel === 'debug') {
      console.error(chalk.red('Stack trace:'), error.stack);
    }
    
    process.exit(1);
  }
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  const sizes = ['B', 'KB', 'MB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

// Helper function to format duration
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
} 