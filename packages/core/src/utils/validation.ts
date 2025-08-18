import { Element, Framework, ValidationResult, ValidationError } from '../index';

export class ValidationUtils {
  /**
   * Validate element structure
   */
  static validateElement(element: Element): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate required fields
    if (!element.tag || typeof element.tag !== 'string') {
      errors.push({
        message: 'Element tag is required and must be a string',
        path: 'tag',
        value: element.tag,
      });
    }

    if (!element.attributes || typeof element.attributes !== 'object') {
      errors.push({
        message: 'Element attributes must be an object',
        path: 'attributes',
        value: element.attributes,
      });
    }

    // Validate position if provided
    if (element.position) {
      if (typeof element.position.line !== 'number' || element.position.line < 0) {
        errors.push({
          message: 'Position line must be a non-negative number',
          path: 'position.line',
          value: element.position.line,
        });
      }

      if (typeof element.position.column !== 'number' || element.position.column < 0) {
        errors.push({
          message: 'Position column must be a non-negative number',
          path: 'position.column',
          value: element.position.column,
        });
      }
    }

    // Validate framework
    if (element.framework) {
      const validFrameworks: Framework[] = ['react', 'vue', 'angular', 'html'];
      if (!validFrameworks.includes(element.framework)) {
        errors.push({
          message: `Invalid framework: ${element.framework}`,
          path: 'framework',
          value: element.framework,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * Validate file path
   */
  static validateFilePath(filePath: string): ValidationResult {
    const errors: ValidationError[] = [];

    if (!filePath || typeof filePath !== 'string') {
      errors.push({
        message: 'File path is required and must be a string',
        path: 'filePath',
        value: filePath,
      });
    }

    if (filePath && filePath.trim() === '') {
      errors.push({
        message: 'File path cannot be empty',
        path: 'filePath',
        value: filePath,
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * Validate test ID format
   */
  static validateTestId(id: string, maxLength?: number): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (!id || typeof id !== 'string') {
      errors.push({
        message: 'Test ID is required and must be a string',
        path: 'id',
        value: id,
      });
      return { valid: false, errors, warnings };
    }

    // Check length
    if (maxLength && id.length > maxLength) {
      errors.push({
        message: `Test ID exceeds maximum length of ${maxLength} characters`,
        path: 'id',
        value: id,
      });
    }

    // Check for invalid characters
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
      errors.push({
        message: 'Test ID contains invalid characters. Only alphanumeric, hyphens, and underscores are allowed',
        path: 'id',
        value: id,
      });
    }

    // Check if starts with number
    if (/^[0-9]/.test(id)) {
      warnings.push({
        message: 'Test ID starts with a number, which may cause issues in some frameworks',
        path: 'id',
        value: id,
      });
    }

    // Check for common patterns that might be problematic
    if (id.includes('--') || id.includes('__')) {
      warnings.push({
        message: 'Test ID contains double hyphens or underscores, which may cause conflicts',
        path: 'id',
        value: id,
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate framework detection
   */
  static validateFramework(framework: Framework): ValidationResult {
    const errors: ValidationError[] = [];
    const validFrameworks: Framework[] = ['react', 'vue', 'angular', 'html'];

    if (!validFrameworks.includes(framework)) {
      errors.push({
        message: `Invalid framework: ${framework}`,
        path: 'framework',
        value: framework,
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * Validate HTML tag name
   */
  static validateTagName(tag: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (!tag || typeof tag !== 'string') {
      errors.push({
        message: 'Tag name is required and must be a string',
        path: 'tag',
        value: tag,
      });
      return { valid: false, errors, warnings };
    }

    // Check for valid HTML tag format
    if (!/^[a-zA-Z][a-zA-Z0-9]*(-[a-zA-Z0-9]+)*$/.test(tag)) {
      if (tag.includes('-')) {
        // Might be a custom element
        warnings.push({
          message: 'Tag name appears to be a custom element',
          path: 'tag',
          value: tag,
        });
      } else {
        errors.push({
          message: 'Invalid tag name format',
          path: 'tag',
          value: tag,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Sanitize and normalize test ID
   */
  static sanitizeTestId(id: string, maxLength?: number): string {
    if (!id || typeof id !== 'string') {
      return '';
    }

    // Convert to lowercase and replace invalid characters
    let sanitized = id
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/^[0-9]+/, '') // Remove leading numbers
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

    // Truncate if necessary
    if (maxLength && sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength).replace(/-+$/, '');
    }

    // Ensure it's not empty
    if (!sanitized) {
      sanitized = 'element';
    }

    return sanitized;
  }

  /**
   * Check if element should have test ID
   */
  static shouldAddTestId(element: Element, includeElementTypes: string[]): boolean {
    // Skip if already has data-testid
    if (element.attributes['data-testid']) {
      return false;
    }

    // Check if element type is in include list
    if (!includeElementTypes.includes(element.tag.toLowerCase())) {
      return false;
    }

    // Skip certain elements that typically don't need test IDs
    const skipElements = ['html', 'head', 'meta', 'title', 'style', 'script', 'link'];
    if (skipElements.includes(element.tag.toLowerCase())) {
      return false;
    }

    return true;
  }

  /**
   * Validate attribute value
   */
  static validateAttributeValue(value: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (value === null || value === undefined) {
      errors.push({
        message: 'Attribute value cannot be null or undefined',
        path: 'value',
        value: value,
      });
      return { valid: false, errors, warnings };
    }

    if (typeof value !== 'string') {
      warnings.push({
        message: 'Attribute value should be a string',
        path: 'value',
        value: value,
      });
    }

    // Check for potentially dangerous values
    if (typeof value === 'string') {
      if (value.includes('<script>') || value.includes('javascript:')) {
        errors.push({
          message: 'Attribute value contains potentially dangerous content',
          path: 'value',
          value: value,
        });
      }

      // Check for extremely long values
      if (value.length > 1000) {
        warnings.push({
          message: 'Attribute value is very long and may cause performance issues',
          path: 'value',
          value: value,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate unique ID within scope
   */
  static validateUniqueness(id: string, existingIds: Set<string>): ValidationResult {
    const errors: ValidationError[] = [];

    if (existingIds.has(id)) {
      errors.push({
        message: `Test ID '${id}' already exists in the current scope`,
        path: 'id',
        value: id,
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * Combine multiple validation results
   */
  static combineValidationResults(results: ValidationResult[]): ValidationResult {
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationError[] = [];

    results.forEach(result => {
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    });

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
    };
  }
}

export const validation = new ValidationUtils(); 