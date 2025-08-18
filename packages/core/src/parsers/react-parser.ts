import { parse } from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import {
  Parser,
  ParseResult,
  TransformResult,
  Element,
  SourcePosition,
  ParseError,
  ParseMetadata,
  Transformation,
  TransformError,
} from '../index';
import { Logger } from '../utils/logger';
import { ValidationUtils } from '../utils/validation';

export class ReactParser implements Parser {
  private logger = new Logger('ReactParser');

  canParse(filePath: string): boolean {
    const supportedExtensions = ['.jsx', '.tsx', '.js', '.ts'];
    return supportedExtensions.some(ext => filePath.endsWith(ext));
  }

  parse(content: string, filePath: string): ParseResult {
    const elements: Element[] = [];
    const errors: ParseError[] = [];
    
    this.logger.debug(`Parsing React file: ${filePath}`);

    try {
      // Parse with Babel, supporting JSX and TypeScript
      const ast = parse(content, {
        sourceType: 'module',
        plugins: [
          'jsx',
          'typescript',
          'decorators-legacy',
          'classProperties',
          'dynamicImport',
          'exportDefaultFrom',
          'exportNamespaceFrom',
          'functionBind',
          'nullishCoalescingOperator',
          'objectRestSpread',
          'optionalChaining',
        ],
      });

      // Traverse AST to find JSX elements
      traverse(ast, {
        JSXElement: (path) => {
          try {
            const element = this.extractElementFromJSX(path, filePath);
            if (element) {
              elements.push(element);
            }
          } catch (error) {
            errors.push({
              message: `Failed to extract JSX element: ${error}`,
              position: this.getPositionFromPath(path),
              severity: 'error',
            });
          }
        },
        JSXFragment: (path) => {
          // Handle React fragments - traverse children
          try {
            this.extractElementsFromFragment(path, elements, filePath);
          } catch (error) {
            errors.push({
              message: `Failed to process JSX fragment: ${error}`,
              position: this.getPositionFromPath(path),
              severity: 'warning',
            });
          }
        },
      });

      const metadata: ParseMetadata = {
        framework: 'react',
        filePath,
        sourceLength: content.length,
        elementsCount: elements.length,
      };

      this.logger.info(`Parsed ${elements.length} elements from ${filePath}`);
      
      return { elements, errors, metadata };
    } catch (error) {
      this.logger.error(`Failed to parse React file ${filePath}: ${error}`);
      
      return {
        elements: [],
        errors: [{
          message: `Parse error: ${error}`,
          severity: 'error',
        }],
        metadata: {
          framework: 'react',
          filePath,
          sourceLength: content.length,
          elementsCount: 0,
        },
      };
    }
  }

  transform(content: string, transformations: Transformation[]): TransformResult {
    const errors: TransformError[] = [];
    
    try {
      this.logger.debug(`Applying ${transformations.length} transformations to React code`);

      // Parse the source code
      const ast = parse(content, {
        sourceType: 'module',
        plugins: [
          'jsx',
          'typescript',
          'decorators-legacy',
          'classProperties',
          'dynamicImport',
          'exportDefaultFrom',
          'exportNamespaceFrom',
          'functionBind',
          'nullishCoalescingOperator',
          'objectRestSpread',
          'optionalChaining',
        ],
      });

      // Group transformations by position for efficient processing
      const transformationMap = new Map<string, Transformation[]>();
      transformations.forEach(transformation => {
        const key = `${transformation.position.line}:${transformation.position.column}`;
        if (!transformationMap.has(key)) {
          transformationMap.set(key, []);
        }
        transformationMap.get(key)!.push(transformation);
      });

      // Apply transformations
      traverse(ast, {
        JSXOpeningElement: (path) => {
          const position = this.getPositionFromPath(path);
          if (!position) return;

          const key = `${position.line}:${position.column}`;
          const elementTransformations = transformationMap.get(key);
          
          if (elementTransformations) {
            elementTransformations.forEach(transformation => {
              try {
                this.applyTransformationToJSX(path, transformation);
              } catch (error) {
                errors.push({
                  message: `Failed to apply transformation: ${error}`,
                  position,
                  severity: 'error',
                });
              }
            });
          }
        },
      });

      // Generate the transformed code
      const result = generate(ast, {
        retainLines: true,
        sourceMaps: true,
      });

      this.logger.info(`Successfully applied ${transformations.length} transformations`);

      return {
        code: result.code,
        sourceMap: JSON.stringify(result.map),
        transformations,
        errors,
      };
    } catch (error) {
      this.logger.error(`Transform error: ${error}`);
      
      return {
        code: content, // Return original on error
        transformations: [],
        errors: [{
          message: `Transform error: ${error}`,
          severity: 'error',
        }],
      };
    }
  }

  private extractElementFromJSX(path: NodePath<t.JSXElement>, filePath: string): Element | null {
    const openingElement = path.node.openingElement;
    
    if (!t.isJSXIdentifier(openingElement.name)) {
      // Handle JSXMemberExpression (e.g., React.Component)
      return null;
    }

    const tagName = openingElement.name.name;
    const attributes: Record<string, string> = {};
    
    // Extract attributes
    openingElement.attributes.forEach(attr => {
      if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name)) {
        const attrName = attr.name.name;
        let attrValue = '';

        if (attr.value) {
          if (t.isStringLiteral(attr.value)) {
            attrValue = attr.value.value;
          } else if (t.isJSXExpressionContainer(attr.value) && !t.isJSXEmptyExpression(attr.value.expression)) {
            // Handle expression containers (e.g., {variable})
            attrValue = this.extractExpressionValue(attr.value.expression);
          }
        }

        attributes[attrName] = attrValue;
      }
    });

    // Extract text content
    let content = '';
    path.node.children.forEach(child => {
      if (t.isJSXText(child)) {
        content += child.value.trim();
      }
    });

    const position = this.getPositionFromPath(path);
    
    const element: Element = {
      tag: tagName,
      attributes,
      content: content || undefined,
      position,
      framework: 'react',
    };

    // Validate the element
    const validation = ValidationUtils.validateElement(element);
    if (!validation.valid) {
      this.logger.warn(`Invalid element found: ${validation.errors[0]?.message}`);
      return null;
    }

    return element;
  }

  private extractElementsFromFragment(
    path: NodePath<t.JSXFragment>, 
    elements: Element[], 
    filePath: string
  ): void {
    // React fragments don't need test IDs themselves,
    // but we need to process their children
    path.traverse({
      JSXElement: (childPath) => {
        try {
          const element = this.extractElementFromJSX(childPath, filePath);
          if (element) {
            elements.push(element);
          }
        } catch (error) {
          this.logger.warn(`Failed to extract element from fragment: ${error}`);
        }
      },
    });
  }

  private extractExpressionValue(expression: t.Expression): string {
    try {
      if (t.isStringLiteral(expression)) {
        return expression.value;
      }
      
      if (t.isNumericLiteral(expression)) {
        return expression.value.toString();
      }
      
      if (t.isBooleanLiteral(expression)) {
        return expression.value.toString();
      }
      
      if (t.isIdentifier(expression)) {
        return `{${expression.name}}`;
      }
      
      if (t.isTemplateLiteral(expression)) {
        // Simple template literal extraction
        return expression.quasis.map(q => q.value.cooked || '').join('${...}');
      }

      // For complex expressions, return a placeholder
      return '{...}';
    } catch (error) {
      this.logger.debug(`Could not extract expression value: ${error}`);
      return '';
    }
  }

  private getPositionFromPath(path: NodePath): SourcePosition | undefined {
    const loc = path.node.loc;
    if (!loc) return undefined;

    return {
      line: loc.start.line,
      column: loc.start.column,
      index: path.node.start || 0,
    };
  }

  private applyTransformationToJSX(
    path: NodePath<t.JSXOpeningElement>, 
    transformation: Transformation
  ): void {
    if (transformation.type !== 'add-attribute') {
      throw new Error(`Unsupported transformation type: ${transformation.type}`);
    }

    // Check if attribute already exists
    const existingAttr = path.node.attributes.find(attr =>
      t.isJSXAttribute(attr) && 
      t.isJSXIdentifier(attr.name) && 
      attr.name.name === transformation.attribute
    );

    if (existingAttr) {
      // Update existing attribute
      if (t.isJSXAttribute(existingAttr)) {
        existingAttr.value = t.stringLiteral(transformation.value);
      }
    } else {
      // Add new attribute
      const newAttribute = t.jsxAttribute(
        t.jsxIdentifier(transformation.attribute),
        t.stringLiteral(transformation.value)
      );
      
      path.node.attributes.push(newAttribute);
    }

    this.logger.debug(
      `Applied transformation: ${transformation.attribute}="${transformation.value}"`
    );
  }

  // Helper method for debugging - serialize AST node
  serialize(ast: t.Node): string {
    try {
      const result = generate(ast, {
        retainLines: false,
      });
      return result.code;
    } catch (error) {
      this.logger.error(`Failed to serialize AST: ${error}`);
      return '';
    }
  }

  // Utility method to check if content contains JSX
  static containsJSX(content: string): boolean {
    // Simple heuristic - look for JSX-like patterns
    const jsxPatterns = [
      /<[A-Z][a-zA-Z0-9]*\s*[^>]*>/,  // Component tags
      /<[a-z]+\s+[^>]*>/,             // HTML tags with attributes
      /React\./,                       // React imports/usage
      /import.*from\s+['"]react['"]/,  // React imports
    ];
    
    return jsxPatterns.some(pattern => pattern.test(content));
  }

  // Utility method to detect if file is TypeScript
  static isTypeScript(filePath: string): boolean {
    return filePath.endsWith('.ts') || filePath.endsWith('.tsx');
  }

  // Extract component name from file path or AST
  extractComponentName(content: string, filePath: string): string | null {
    try {
      const ast = parse(content, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript', 'decorators-legacy'],
      });

      let componentName: string | null = null;

      // Look for function components
      traverse(ast, {
        FunctionDeclaration: (path) => {
          if (this.isReactComponent(path)) {
            componentName = path.node.id?.name || null;
          }
        },
        VariableDeclarator: (path) => {
          if (t.isIdentifier(path.node.id) && 
              (t.isArrowFunctionExpression(path.node.init) || 
               t.isFunctionExpression(path.node.init))) {
            // Check if this looks like a React component
            const name = path.node.id.name;
            if (/^[A-Z]/.test(name)) {
              componentName = name;
            }
          }
        },
        ClassDeclaration: (path) => {
          if (this.isReactComponent(path)) {
            componentName = path.node.id?.name || null;
          }
        },
      });

      // Fallback to filename
      if (!componentName) {
        const baseName = filePath.split('/').pop()?.replace(/\.(jsx?|tsx?)$/, '');
        componentName = baseName || null;
      }

      return componentName;
    } catch (error) {
      this.logger.debug(`Could not extract component name: ${error}`);
      return null;
    }
  }

  private isReactComponent(path: NodePath): boolean {
    // Simple heuristic to detect React components
    // Look for JSX elements in the function/class body
    let hasJSX = false;
    
    path.traverse({
      JSXElement: () => {
        hasJSX = true;
        path.stop(); // Stop traversing once we find JSX
      },
    });

    return hasJSX;
  }
}

export const reactParser = new ReactParser(); 