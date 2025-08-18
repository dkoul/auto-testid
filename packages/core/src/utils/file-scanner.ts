import * as path from 'path';
import { glob } from 'glob';
import * as fs from 'fs/promises';
import { Framework, ScanOptions, FileScanner as IFileScanner } from '../index';
import { Logger } from './logger';

export class FileScanner implements IFileScanner {
  private logger = new Logger('FileScanner');

  private readonly FRAMEWORK_EXTENSIONS: Record<string, Framework[]> = {
    '.jsx': ['react'],
    '.tsx': ['react'],
    '.vue': ['vue'],
    '.html': ['angular', 'html'],
    '.ts': ['angular', 'react'],
    '.js': ['react', 'html'],
  };

  private readonly DEFAULT_SCAN_OPTIONS: ScanOptions = {
    include: ['**/*.{js,jsx,ts,tsx,vue,html}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**',
      '**/*.test.*',
      '**/*.spec.*',
    ],
    frameworks: ['react', 'vue', 'angular', 'html'],
    recursive: true,
    maxFiles: 10000,
  };

  async scan(directory: string, options: Partial<ScanOptions> = {}): Promise<string[]> {
    const scanOptions = { ...this.DEFAULT_SCAN_OPTIONS, ...options };
    
    this.logger.info(`Scanning directory: ${directory}`);
    this.logger.debug(`Scan options:`, scanOptions);

    try {
      const patterns = this.buildGlobPatterns(directory, scanOptions);
      const allFiles: string[] = [];

      for (const pattern of patterns) {
        const files = await glob(pattern, {
          ignore: scanOptions.exclude,
          absolute: true,
          nodir: true,
        });
        allFiles.push(...files);
      }

      // Remove duplicates and apply framework filtering
      const uniqueFiles = Array.from(new Set(allFiles));
      const filteredFiles = await this.filterByFramework(uniqueFiles, scanOptions.frameworks);

      // Apply max files limit
      const limitedFiles = scanOptions.maxFiles 
        ? filteredFiles.slice(0, scanOptions.maxFiles)
        : filteredFiles;

      this.logger.info(`Found ${limitedFiles.length} files to process`);
      return limitedFiles.sort();
    } catch (error) {
      this.logger.error(`Error scanning directory: ${error}`);
      throw new Error(`Failed to scan directory ${directory}: ${error}`);
    }
  }

  isSupported(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return Object.keys(this.FRAMEWORK_EXTENSIONS).includes(ext);
  }

  detectFramework(filePath: string, packageJson?: any): Framework {
    const ext = path.extname(filePath).toLowerCase();
    const filename = path.basename(filePath).toLowerCase();

    // Check file extension first
    const possibleFrameworks = this.FRAMEWORK_EXTENSIONS[ext] || [];

    // Vue files are always Vue
    if (ext === '.vue') {
      return 'vue';
    }

    // JSX/TSX files are always React
    if (ext === '.jsx' || ext === '.tsx') {
      return 'react';
    }

    // For ambiguous extensions, check package.json dependencies
    if (packageJson) {
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
        ...packageJson.peerDependencies,
      };

      // Check for framework-specific dependencies
      if (allDeps.react || allDeps['@types/react']) {
        return 'react';
      }
      
      if (allDeps.vue || allDeps['@vue/core']) {
        return 'vue';
      }
      
      if (allDeps['@angular/core'] || allDeps.angular) {
        return 'angular';
      }
    }

    // Check filename patterns for Angular
    if (filename.includes('.component.') || filename.includes('.template.')) {
      return 'angular';
    }

    // Default fallbacks based on extension
    if (ext === '.html') {
      return filename.includes('component') ? 'angular' : 'html';
    }

    if (ext === '.ts' || ext === '.js') {
      // Check for JSX-like content (basic heuristic)
      return 'react'; // Default assumption for JS/TS files
    }

    return 'html'; // Final fallback
  }

  private buildGlobPatterns(directory: string, options: ScanOptions): string[] {
    const basePatterns = options.include.map(pattern => {
      if (path.isAbsolute(pattern)) {
        return pattern;
      }
      return path.join(directory, pattern);
    });

    return basePatterns;
  }

  private async filterByFramework(files: string[], frameworks: Framework[]): Promise<string[]> {
    const filteredFiles: string[] = [];

    for (const filePath of files) {
      if (!this.isSupported(filePath)) {
        continue;
      }

      try {
        // Try to read package.json from the file's directory or parent directories
        const packageJson = await this.findPackageJson(path.dirname(filePath));
        const framework = this.detectFramework(filePath, packageJson);

        if (frameworks.includes(framework)) {
          filteredFiles.push(filePath);
        }
      } catch (error) {
        // If we can't determine the framework, include the file
        this.logger.warn(`Could not determine framework for ${filePath}: ${error}`);
        filteredFiles.push(filePath);
      }
    }

    return filteredFiles;
  }

  private async findPackageJson(directory: string): Promise<any> {
    let currentDir = directory;
    
    while (currentDir !== path.dirname(currentDir)) {
      try {
        const packageJsonPath = path.join(currentDir, 'package.json');
        const content = await fs.readFile(packageJsonPath, 'utf-8');
        return JSON.parse(content);
      } catch {
        // Continue to parent directory
        currentDir = path.dirname(currentDir);
      }
    }

    return null;
  }

  async getProjectInfo(directory: string): Promise<{ 
    framework: Framework; 
    packageJson: any; 
    tsConfig: any; 
  }> {
    const packageJson = await this.findPackageJson(directory);
    const tsConfig = await this.findTsConfig(directory);
    
    let framework: Framework = 'html';
    
    if (packageJson) {
      // Detect primary framework based on dependencies
      const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      if (deps.react) framework = 'react';
      else if (deps.vue) framework = 'vue';
      else if (deps['@angular/core']) framework = 'angular';
    }

    return { framework, packageJson, tsConfig };
  }

  private async findTsConfig(directory: string): Promise<any> {
    let currentDir = directory;
    
    while (currentDir !== path.dirname(currentDir)) {
      try {
        const tsConfigPath = path.join(currentDir, 'tsconfig.json');
        const content = await fs.readFile(tsConfigPath, 'utf-8');
        return JSON.parse(content);
      } catch {
        currentDir = path.dirname(currentDir);
      }
    }

    return null;
  }
}

export const fileScanner = new FileScanner(); 