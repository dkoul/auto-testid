import * as fs from 'fs/promises';
import * as path from 'path';
import { ConfigurationSchema, ValidationResult, ValidationError } from '../index';
import { Logger } from './logger';

export interface ConfigLoader {
  load(configPath?: string): Promise<ConfigurationSchema>;
  validate(config: Partial<ConfigurationSchema>): ValidationResult;
  merge(base: ConfigurationSchema, override: Partial<ConfigurationSchema>): ConfigurationSchema;
  findConfig(startDirectory: string): Promise<string | null>;
}

export class ConfigurationLoader implements ConfigLoader {
  private logger = new Logger('ConfigLoader');
  
  private readonly CONFIG_FILENAMES = [
    '.autotestidrc.json',
    '.autotestidrc.js',
    'autotestid.config.json',
    'autotestid.config.js',
    'package.json', // Look for autotestid field
  ];

  private readonly DEFAULT_CONFIG: ConfigurationSchema = {
    frameworks: ['react', 'vue', 'angular', 'html'],
    namingStrategy: { type: 'kebab-case' },
    prefix: 'test',
    attributeName: 'data-testid',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/*.test.*',
      '**/*.spec.*',
    ],
    includeElementTypes: [
      'button',
      'input',
      'select',
      'textarea',
      'form',
      'a',
      'div',
      'span',
      'img',
      'video',
      'audio',
    ],
    customRules: [],
    conflictResolution: 'suffix',
    maxIdLength: 50,
    preserveExisting: true,
  };

  async load(configPath?: string): Promise<ConfigurationSchema> {
    let config: Partial<ConfigurationSchema> = {};

    try {
      if (configPath) {
        // Load specific config file
        config = await this.loadConfigFile(configPath);
      } else {
        // Find and load config file
        const foundConfigPath = await this.findConfig(process.cwd());
        if (foundConfigPath) {
          config = await this.loadConfigFile(foundConfigPath);
        }
      }

      // Validate loaded config
      const validation = this.validate(config);
      if (!validation.valid) {
        this.logger.warn('Configuration validation failed:');
        validation.errors.forEach(error => 
          this.logger.error(`  ${error.path}: ${error.message}`)
        );
        validation.warnings.forEach(warning => 
          this.logger.warn(`  ${warning.path}: ${warning.message}`)
        );
      }

      // Merge with defaults
      const mergedConfig = this.merge(this.DEFAULT_CONFIG, config);
      
      this.logger.info('Configuration loaded successfully');
      this.logger.debug('Final config:', mergedConfig);
      
      return mergedConfig;
    } catch (error) {
      this.logger.error(`Failed to load configuration: ${error}`);
      this.logger.info('Using default configuration');
      return this.DEFAULT_CONFIG;
    }
  }

  validate(config: Partial<ConfigurationSchema>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate frameworks
    if (config.frameworks) {
      const validFrameworks = ['react', 'vue', 'angular', 'html'];
      const invalidFrameworks = config.frameworks.filter(
        f => !validFrameworks.includes(f)
      );
      if (invalidFrameworks.length > 0) {
        errors.push({
          message: `Invalid frameworks: ${invalidFrameworks.join(', ')}`,
          path: 'frameworks',
          value: invalidFrameworks,
        });
      }
    }

    // Validate naming strategy
    if (config.namingStrategy) {
      const validStrategies = ['kebab-case', 'camelCase', 'snake_case', 'custom'];
      if (!validStrategies.includes(config.namingStrategy.type)) {
        errors.push({
          message: `Invalid naming strategy: ${config.namingStrategy.type}`,
          path: 'namingStrategy.type',
          value: config.namingStrategy.type,
        });
      }

      if (config.namingStrategy.type === 'custom' && !config.namingStrategy.customTransform) {
        errors.push({
          message: 'Custom naming strategy requires customTransform function',
          path: 'namingStrategy.customTransform',
        });
      }
    }

    // Validate prefix
    if (config.prefix && typeof config.prefix !== 'string') {
      errors.push({
        message: 'Prefix must be a string',
        path: 'prefix',
        value: config.prefix,
      });
    }

    // Validate exclude patterns
    if (config.exclude && !Array.isArray(config.exclude)) {
      errors.push({
        message: 'Exclude must be an array of strings',
        path: 'exclude',
        value: config.exclude,
      });
    }

    // Validate maxIdLength
    if (config.maxIdLength !== undefined) {
      if (typeof config.maxIdLength !== 'number' || config.maxIdLength < 1) {
        errors.push({
          message: 'maxIdLength must be a positive number',
          path: 'maxIdLength',
          value: config.maxIdLength,
        });
      } else if (config.maxIdLength < 10) {
        warnings.push({
          message: 'maxIdLength is very small, may cause conflicts',
          path: 'maxIdLength',
          value: config.maxIdLength,
        });
      }
    }

    // Validate conflictResolution
    if (config.conflictResolution) {
      const validResolutions = ['suffix', 'prefix', 'replace'];
      if (!validResolutions.includes(config.conflictResolution)) {
        errors.push({
          message: `Invalid conflict resolution: ${config.conflictResolution}`,
          path: 'conflictResolution',
          value: config.conflictResolution,
        });
      }
    }

    // Validate custom rules
    if (config.customRules) {
      if (!Array.isArray(config.customRules)) {
        errors.push({
          message: 'customRules must be an array',
          path: 'customRules',
          value: config.customRules,
        });
      } else {
        config.customRules.forEach((rule, index) => {
          if (!rule.selector || typeof rule.selector !== 'string') {
            errors.push({
              message: 'Custom rule selector must be a non-empty string',
              path: `customRules[${index}].selector`,
              value: rule.selector,
            });
          }

          if (!rule.generator || typeof rule.generator !== 'function') {
            errors.push({
              message: 'Custom rule generator must be a function',
              path: `customRules[${index}].generator`,
              value: rule.generator,
            });
          }

          if (rule.priority !== undefined && typeof rule.priority !== 'number') {
            errors.push({
              message: 'Custom rule priority must be a number',
              path: `customRules[${index}].priority`,
              value: rule.priority,
            });
          }
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  merge(base: ConfigurationSchema, override: Partial<ConfigurationSchema>): ConfigurationSchema {
    const merged = { ...base };

    // Simple properties
    if (override.namingStrategy) merged.namingStrategy = { ...base.namingStrategy, ...override.namingStrategy };
    if (override.prefix !== undefined) merged.prefix = override.prefix;
    if (override.conflictResolution) merged.conflictResolution = override.conflictResolution;
    if (override.maxIdLength !== undefined) merged.maxIdLength = override.maxIdLength;
    if (override.preserveExisting !== undefined) merged.preserveExisting = override.preserveExisting;

    // Array properties (replace, don't merge)
    if (override.frameworks) merged.frameworks = [...override.frameworks];
    if (override.exclude) merged.exclude = [...override.exclude];
    if (override.includeElementTypes) merged.includeElementTypes = [...override.includeElementTypes];
    if (override.customRules) merged.customRules = [...override.customRules];

    return merged;
  }

  async findConfig(startDirectory: string): Promise<string | null> {
    let currentDir = startDirectory;

    while (currentDir !== path.dirname(currentDir)) {
      for (const filename of this.CONFIG_FILENAMES) {
        const configPath = path.join(currentDir, filename);
        
        try {
          await fs.access(configPath);
          
          // Special handling for package.json
          if (filename === 'package.json') {
            const packageJson = JSON.parse(await fs.readFile(configPath, 'utf-8'));
            if (packageJson.autotestid) {
              this.logger.debug(`Found config in package.json: ${configPath}`);
              return configPath;
            }
          } else {
            this.logger.debug(`Found config file: ${configPath}`);
            return configPath;
          }
        } catch {
          // File doesn't exist, continue
        }
      }
      
      currentDir = path.dirname(currentDir);
    }

    return null;
  }

  private async loadConfigFile(configPath: string): Promise<Partial<ConfigurationSchema>> {
    const ext = path.extname(configPath);
    const basename = path.basename(configPath);

    try {
      if (basename === 'package.json') {
        // Load from package.json autotestid field
        const packageJson = JSON.parse(await fs.readFile(configPath, 'utf-8'));
        return packageJson.autotestid || {};
      }

      if (ext === '.json') {
        // Load JSON config
        const content = await fs.readFile(configPath, 'utf-8');
        return JSON.parse(content);
      }

      if (ext === '.js') {
        // Load JavaScript config (require)
        delete require.cache[require.resolve(configPath)];
        const config = require(configPath);
        return typeof config === 'function' ? config() : config;
      }

      throw new Error(`Unsupported config file format: ${ext}`);
    } catch (error) {
      throw new Error(`Failed to parse config file ${configPath}: ${error}`);
    }
  }

  // Create default config file
  async createDefaultConfig(directory: string, format: 'json' | 'js' = 'json'): Promise<string> {
    const configPath = path.join(
      directory,
      format === 'json' ? '.autotestidrc.json' : 'autotestid.config.js'
    );

    const configContent = format === 'json'
      ? JSON.stringify(this.DEFAULT_CONFIG, null, 2)
      : `module.exports = ${JSON.stringify(this.DEFAULT_CONFIG, null, 2)};`;

    await fs.writeFile(configPath, configContent, 'utf-8');
    
    this.logger.info(`Created default config file: ${configPath}`);
    return configPath;
  }
}

export const configLoader = new ConfigurationLoader(); 