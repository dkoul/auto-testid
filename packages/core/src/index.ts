// Core Types and Interfaces
export interface Element {
  tag: string;
  attributes: Record<string, string>;
  content?: string;
  children?: Element[];
  position?: SourcePosition;
  framework?: Framework;
}

export interface SourcePosition {
  line: number;
  column: number;
  index: number;
}

export type Framework = 'react' | 'vue' | 'angular' | 'html';

export interface ParseResult {
  elements: Element[];
  errors: ParseError[];
  metadata: ParseMetadata;
}

export interface ParseError {
  message: string;
  position?: SourcePosition;
  severity: 'error' | 'warning' | 'info';
}

export interface ParseMetadata {
  framework: Framework;
  filePath: string;
  sourceLength: number;
  elementsCount: number;
}

export interface TransformResult {
  code: string;
  sourceMap?: string;
  transformations: Transformation[];
  errors: TransformError[];
}

export interface Transformation {
  type: 'add-attribute' | 'modify-attribute' | 'remove-attribute';
  element: Element;
  attribute: string;
  value: string;
  position: SourcePosition;
}

export interface TransformError {
  message: string;
  element?: Element;
  position?: SourcePosition;
  severity: 'error' | 'warning';
}

export interface GenerationContext {
  component?: string;
  filePath: string;
  existingIds: Set<string>;
  namingStrategy: NamingStrategy;
  prefix?: string;
  framework: Framework;
}

export interface NamingStrategy {
  type: 'kebab-case' | 'camelCase' | 'snake_case' | 'custom';
  customTransform?: (input: string) => string;
}

export interface ConfigurationSchema {
  frameworks: Framework[];
  namingStrategy: NamingStrategy;
  prefix?: string;
  exclude: string[];
  includeElementTypes: string[];
  customRules: CustomRule[];
  conflictResolution: 'suffix' | 'prefix' | 'replace';
  maxIdLength: number;
  preserveExisting: boolean;
}

export interface CustomRule {
  selector: string;
  generator: (element: Element, context: GenerationContext) => string;
  priority: number;
}

// Core Interfaces for Extension
export interface Parser {
  canParse(filePath: string): boolean;
  parse(content: string, filePath: string): ParseResult;
  transform(content: string, transformations: Transformation[]): TransformResult;
  serialize?(ast: any): string;
}

export interface IDGenerator {
  generate(element: Element, context: GenerationContext): string;
  validateUniqueness(id: string, scope: Set<string>): boolean;
  resolveConflicts(id: string, existingIds: Set<string>): string;
}

export interface Transformer {
  transform(elements: Element[], context: GenerationContext): Transformation[];
  applyTransformations(content: string, transformations: Transformation[]): TransformResult;
}

export interface FileScanner {
  scan(directory: string, options: ScanOptions): Promise<string[]>;
  isSupported(filePath: string): boolean;
  detectFramework(filePath: string, packageJson?: any): Framework;
}

export interface ScanOptions {
  include: string[];
  exclude: string[];
  frameworks: Framework[];
  recursive: boolean;
  maxFiles?: number;
}

// Core API
export interface AutoTestIDCore {
  processFile(filePath: string, options?: ProcessOptions): Promise<ProcessResult>;
  processFiles(filePaths: string[], options?: ProcessOptions): Promise<ProcessResult[]>;
  scanDirectory(directory: string, options?: ScanOptions): Promise<string[]>;
  validateConfiguration(config: Partial<ConfigurationSchema>): ValidationResult;
}

export interface ProcessOptions {
  dryRun?: boolean;
  backup?: boolean;
  config?: Partial<ConfigurationSchema>;
  onProgress?: (progress: ProcessProgress) => void;
}

export interface ProcessResult {
  filePath: string;
  success: boolean;
  transformations: Transformation[];
  errors: TransformError[];
  metrics: ProcessMetrics;
  diff?: string;
}

export interface ProcessProgress {
  total: number;
  completed: number;
  current: string;
  stage: 'scanning' | 'parsing' | 'generating' | 'transforming' | 'writing';
}

export interface ProcessMetrics {
  elementsFound: number;
  elementsTransformed: number;
  idGenerated: number;
  conflictsResolved: number;
  processingTime: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface ValidationError {
  message: string;
  path: string;
  value?: any;
}

// Export modules
export * from './parsers';
export * from './generators';
export * from './transformers';
export * from './utils';

// Factory function
export function createAutoTestID(config?: Partial<ConfigurationSchema>): AutoTestIDCore {
  return new AutoTestIDCoreImpl(config);
}

// Default configuration
export const DEFAULT_CONFIG: ConfigurationSchema = {
  frameworks: ['react', 'vue', 'angular', 'html'],
  namingStrategy: { type: 'kebab-case' },
  prefix: 'test',
  exclude: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/*.test.*',
    '**/*.spec.*'
  ],
  includeElementTypes: ['button', 'input', 'select', 'textarea', 'form', 'a', 'div', 'span'],
  customRules: [],
  conflictResolution: 'suffix',
  maxIdLength: 50,
  preserveExisting: true,
};

// Core implementation
class AutoTestIDCoreImpl implements AutoTestIDCore {
  private config: ConfigurationSchema;

  constructor(config?: Partial<ConfigurationSchema>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async processFile(filePath: string, options?: ProcessOptions): Promise<ProcessResult> {
    const startTime = Date.now();
    const mergedOptions = { dryRun: false, backup: false, ...options };
    const effectiveConfig = { ...this.config, ...mergedOptions.config };

    // Import utilities (dynamic imports to avoid circular dependencies)
    const { fileScanner } = await import('./utils/file-scanner');
    const { configLoader } = await import('./utils/config-loader');
    const { detectParser } = await import('./parsers');
    const { idGenerator } = await import('./generators');

    try {
      // Validate file path
      if (!fileScanner.isSupported(filePath)) {
        return {
          filePath,
          success: false,
          transformations: [],
          errors: [{
            message: `Unsupported file type: ${filePath}`,
            severity: 'error',
          }],
          metrics: {
            elementsFound: 0,
            elementsTransformed: 0,
            idGenerated: 0,
            conflictsResolved: 0,
            processingTime: Date.now() - startTime,
          },
        };
      }

      // Detect framework and get parser
      const framework = fileScanner.detectFramework(filePath);
      const parser = detectParser(filePath);

      if (!parser) {
        return {
          filePath,
          success: false,
          transformations: [],
          errors: [{
            message: `No parser available for framework: ${framework}`,
            severity: 'error',
          }],
          metrics: {
            elementsFound: 0,
            elementsTransformed: 0,
            idGenerated: 0,
            conflictsResolved: 0,
            processingTime: Date.now() - startTime,
          },
        };
      }

      // Read file content
      const fs = await import('fs/promises');
      const content = await fs.readFile(filePath, 'utf-8');

      // Parse file to extract elements
      const parseResult = parser.parse(content, filePath);
      
      if (parseResult.errors.length > 0) {
        return {
          filePath,
          success: false,
          transformations: [],
          errors: parseResult.errors.map(e => ({
            message: e.message,
            position: e.position,
            severity: e.severity as 'error' | 'warning',
          })),
          metrics: {
            elementsFound: parseResult.elements.length,
            elementsTransformed: 0,
            idGenerated: 0,
            conflictsResolved: 0,
            processingTime: Date.now() - startTime,
          },
        };
      }

      // Filter elements that need test IDs
      const { ValidationUtils } = await import('./utils/validation');
      const elementsToProcess = parseResult.elements.filter(element =>
        ValidationUtils.shouldAddTestId(element, effectiveConfig.includeElementTypes)
      );

      // Generate transformations
      const transformations: Transformation[] = [];
      const existingIds = new Set<string>();
      let conflictsResolved = 0;

      // Extract existing test IDs from all elements
      parseResult.elements.forEach(element => {
        const testId = element.attributes['data-testid'];
        if (testId) {
          existingIds.add(testId);
        }
      });

      // Generate test IDs for elements that need them
      elementsToProcess.forEach(element => {
        if (element.position) {
          const context: GenerationContext = {
            filePath,
            existingIds,
            namingStrategy: effectiveConfig.namingStrategy,
            prefix: effectiveConfig.prefix,
            framework: framework,
          };

          const generatedId = idGenerator.generate(element, context);
          
          // Check if this resolved a conflict
          const baseId = generatedId.replace(/-\d+$/, ''); // Remove numeric suffix
          if (generatedId !== baseId) {
            conflictsResolved++;
          }

          existingIds.add(generatedId);

          transformations.push({
            type: 'add-attribute',
            element,
            attribute: 'data-testid',
            value: generatedId,
            position: element.position,
          });
        }
      });

      // Apply transformations if not dry run
      let transformResult: TransformResult | undefined;
      if (!mergedOptions.dryRun && transformations.length > 0) {
        transformResult = parser.transform(content, transformations);
        
        if (!transformResult.errors.length) {
          // Write back to file
          if (mergedOptions.backup) {
            await fs.writeFile(`${filePath}.bak`, content, 'utf-8');
          }
          await fs.writeFile(filePath, transformResult.code, 'utf-8');
        }
      }

      const metrics: ProcessMetrics = {
        elementsFound: parseResult.elements.length,
        elementsTransformed: transformations.length,
        idGenerated: transformations.length,
        conflictsResolved,
        processingTime: Date.now() - startTime,
      };

      return {
        filePath,
        success: true,
        transformations,
        errors: transformResult?.errors || [],
        metrics,
        diff: mergedOptions.dryRun ? this.generateDiff(content, transformResult?.code || content) : undefined,
      };

    } catch (error) {
      return {
        filePath,
        success: false,
        transformations: [],
        errors: [{
          message: `Processing error: ${error}`,
          severity: 'error',
        }],
        metrics: {
          elementsFound: 0,
          elementsTransformed: 0,
          idGenerated: 0,
          conflictsResolved: 0,
          processingTime: Date.now() - startTime,
        },
      };
    }
  }

  async processFiles(filePaths: string[], options?: ProcessOptions): Promise<ProcessResult[]> {
    const results: ProcessResult[] = [];
    
    for (let i = 0; i < filePaths.length; i++) {
      const filePath = filePaths[i];
      
      if (options?.onProgress) {
        options.onProgress({
          total: filePaths.length,
          completed: i,
          current: filePath,
          stage: 'parsing',
        });
      }

      try {
        const result = await this.processFile(filePath, options);
        results.push(result);
      } catch (error) {
        results.push({
          filePath,
          success: false,
          transformations: [],
          errors: [{
            message: `Processing error: ${error}`,
            severity: 'error',
          }],
          metrics: {
            elementsFound: 0,
            elementsTransformed: 0,
            idGenerated: 0,
            conflictsResolved: 0,
            processingTime: 0,
          },
        });
      }
    }

    return results;
  }

  async scanDirectory(directory: string, options?: ScanOptions): Promise<string[]> {
    const { fileScanner } = await import('./utils/file-scanner');
    return fileScanner.scan(directory, options);
  }

  validateConfiguration(config: Partial<ConfigurationSchema>): ValidationResult {
    // Import and use the config loader's validation
    const { configLoader } = require('./utils/config-loader');
    return configLoader.validate(config);
  }

  private generateDiff(original: string, modified: string): string {
    // Simple diff implementation for dry-run mode
    if (original === modified) {
      return 'No changes';
    }

    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');
    
    const diff: string[] = [];
    const maxLines = Math.max(originalLines.length, modifiedLines.length);
    
    for (let i = 0; i < maxLines; i++) {
      const origLine = originalLines[i] || '';
      const modLine = modifiedLines[i] || '';
      
      if (origLine !== modLine) {
        if (origLine) {
          diff.push(`- ${origLine}`);
        }
        if (modLine) {
          diff.push(`+ ${modLine}`);
        }
      }
    }

    return diff.join('\n');
  }
} 