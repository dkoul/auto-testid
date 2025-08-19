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

export class VueParser implements Parser {
  private logger = new Logger('VueParser');

  canParse(filePath: string): boolean {
    return filePath.endsWith('.vue');
  }

  parse(content: string, filePath: string): ParseResult {
    const elements: Element[] = [];
    const errors: ParseError[] = [];
    
    this.logger.debug(`Parsing Vue file: ${filePath}`);

    try {
      // Parse Vue Single File Component structure
      const sections = this.parseSFC(content);
      
      if (!sections.template) {
        this.logger.warn(`No template section found in ${filePath}`);
        return {
          elements: [],
          errors: [{
            message: 'No template section found in Vue Single File Component',
            severity: 'warning',
          }],
          metadata: {
            framework: 'vue',
            filePath,
            sourceLength: content.length,
            elementsCount: 0,
          },
        };
      }

      // Parse the template section for HTML elements
      const templateElements = this.parseTemplate(sections.template.content, sections.template.startLine);
      elements.push(...templateElements);

      const metadata: ParseMetadata = {
        framework: 'vue',
        filePath,
        sourceLength: content.length,
        elementsCount: elements.length,
      };

      this.logger.info(`Parsed ${elements.length} elements from ${filePath}`);
      
      return { elements, errors, metadata };
    } catch (error) {
      this.logger.error(`Failed to parse Vue file ${filePath}: ${error}`);
      
      return {
        elements: [],
        errors: [{
          message: `Parse error: ${error}`,
          severity: 'error',
        }],
        metadata: {
          framework: 'vue',
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
      this.logger.debug(`Applying ${transformations.length} transformations to Vue file`);

      // Parse the SFC structure
      const sections = this.parseSFC(content);
      if (!sections.template) {
        return {
          code: content,
          transformations: [],
          errors: [{
            message: 'No template section found for transformation',
            severity: 'error',
          }],
        };
      }

      // Apply transformations to the template section
      let modifiedTemplate = sections.template.content;
      const templateStartLine = sections.template.startLine;

      // Sort transformations by line number (descending) to avoid position shifts
      const sortedTransformations = [...transformations].sort((a, b) => {
        const aLine = a.position.line - templateStartLine;
        const bLine = b.position.line - templateStartLine;
        return bLine - aLine;
      });

      for (const transformation of sortedTransformations) {
        try {
          // Adjust line number relative to template section
          const relativeLineNumber = transformation.position.line - templateStartLine;
          modifiedTemplate = this.applyTransformationToTemplate(
            modifiedTemplate,
            transformation,
            relativeLineNumber
          );
        } catch (error) {
          errors.push({
            message: `Failed to apply transformation: ${error}`,
            position: transformation.position,
            severity: 'error',
          });
        }
      }

      // Reconstruct the full SFC with modified template
      const modifiedContent = this.reconstructSFC(content, sections, modifiedTemplate);

      this.logger.info(`Successfully applied ${transformations.length} transformations`);

      return {
        code: modifiedContent,
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

  private parseSFC(content: string): SFCStructure {
    const lines = content.split('\n');
    const sections: SFCStructure = {
      template: null,
      script: null,
      style: null,
    };

    let currentSection: keyof SFCStructure | null = null;
    let currentContent: string[] = [];
    let startLine = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Check for section start tags
      if (trimmedLine.startsWith('<template')) {
        if (currentSection) {
          // Save previous section
          this.saveSection(sections, currentSection, currentContent, startLine);
        }
        currentSection = 'template';
        currentContent = [];
        startLine = i + 1; // Content starts on next line
      } else if (trimmedLine.startsWith('<script')) {
        if (currentSection) {
          this.saveSection(sections, currentSection, currentContent, startLine);
        }
        currentSection = 'script';
        currentContent = [];
        startLine = i + 1;
      } else if (trimmedLine.startsWith('<style')) {
        if (currentSection) {
          this.saveSection(sections, currentSection, currentContent, startLine);
        }
        currentSection = 'style';
        currentContent = [];
        startLine = i + 1;
      } else if (trimmedLine.startsWith('</template>') || 
                 trimmedLine.startsWith('</script>') || 
                 trimmedLine.startsWith('</style>')) {
        // End of current section
        if (currentSection) {
          this.saveSection(sections, currentSection, currentContent, startLine);
          currentSection = null;
          currentContent = [];
        }
      } else if (currentSection) {
        // Add content line to current section
        currentContent.push(line);
      }
    }

    // Save the last section if it exists
    if (currentSection) {
      this.saveSection(sections, currentSection, currentContent, startLine);
    }

    return sections;
  }

  private saveSection(
    sections: SFCStructure, 
    sectionName: keyof SFCStructure, 
    content: string[], 
    startLine: number
  ): void {
    sections[sectionName] = {
      content: content.join('\n'),
      startLine,
      endLine: startLine + content.length - 1,
    };
  }

  private parseTemplate(templateContent: string, baseLineNumber: number): Element[] {
    const elements: Element[] = [];
    
    try {
      // Use a simple HTML-like parser for Vue templates
      const lines = templateContent.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();
        
        // Skip empty lines and comments
        if (!trimmedLine || trimmedLine.startsWith('<!--')) {
          continue;
        }

        // Find HTML-like opening tags
        const tagMatches = line.matchAll(/<([a-zA-Z][a-zA-Z0-9-]*)\s*([^>]*)>/g);
        
        for (const match of tagMatches) {
          const [fullMatch, tagName, attributesString] = match;
          const startIndex = match.index || 0;
          
          // Skip self-closing tags and closing tags
          if (fullMatch.endsWith('/>') || tagName.startsWith('/')) {
            continue;
          }

          // Parse attributes
          const attributes = this.parseAttributes(attributesString);
          
          // Extract content if it's a simple single-line element
          let content: string | undefined;
          const contentMatch = line.match(new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`));
          if (contentMatch) {
            content = contentMatch[1].trim();
          }

          const position: SourcePosition = {
            line: baseLineNumber + i + 1, // +1 for 1-based line numbering
            column: startIndex + 1, // +1 for 1-based column numbering
            index: startIndex,
          };

          const element: Element = {
            tag: tagName,
            attributes,
            content: content || undefined,
            position,
            framework: 'vue',
          };

          // Validate the element
          const validation = ValidationUtils.validateElement(element);
          if (validation.valid) {
            elements.push(element);
          } else {
            this.logger.debug(`Invalid element skipped: ${validation.errors[0]?.message}`);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error parsing template: ${error}`);
    }

    return elements;
  }

  private parseAttributes(attributesString: string): Record<string, string> {
    const attributes: Record<string, string> = {};
    
    if (!attributesString.trim()) {
      return attributes;
    }

    // Simple attribute parsing - handles most common cases
    // This regex handles: attr="value", attr='value', attr, :attr="value", @event="handler"
    const attrMatches = attributesString.matchAll(/([:\w-@]+)(?:=["']([^"']*)["'])?/g);
    
    for (const match of attrMatches) {
      const [, attrName, attrValue = ''] = match;
      attributes[attrName] = attrValue;
    }

    return attributes;
  }

  private applyTransformationToTemplate(
    templateContent: string,
    transformation: Transformation,
    relativeLineNumber: number
  ): string {
    if (transformation.type !== 'add-attribute') {
      throw new Error(`Unsupported transformation type: ${transformation.type}`);
    }

    const lines = templateContent.split('\n');
    
    if (relativeLineNumber < 0 || relativeLineNumber >= lines.length) {
      throw new Error(`Invalid line number: ${relativeLineNumber}`);
    }

    const line = lines[relativeLineNumber];
    const tagName = transformation.element.tag;
    
    // Find the opening tag in the line
    const tagRegex = new RegExp(`<${tagName}(\\s[^>]*)?>`);
    const tagMatch = line.match(tagRegex);
    
    if (!tagMatch) {
      throw new Error(`Could not find opening tag <${tagName}> in line`);
    }

    // Check if attribute already exists
    const existingAttrRegex = new RegExp(`\\s${transformation.attribute}=`);
    if (existingAttrRegex.test(tagMatch[0])) {
      // Update existing attribute
      const updatedTag = tagMatch[0].replace(
        new RegExp(`(${transformation.attribute}=)(["'])([^"']*)(["'])`),
        `$1$2${transformation.value}$4`
      );
      lines[relativeLineNumber] = line.replace(tagMatch[0], updatedTag);
    } else {
      // Add new attribute
      const insertionPoint = tagMatch[0].endsWith('>') 
        ? tagMatch[0].length - 1  // Before the closing >
        : tagMatch[0].length;     // At the end
      
      const beforeClosing = tagMatch[0].substring(0, insertionPoint);
      const closing = tagMatch[0].substring(insertionPoint);
      
      const newAttribute = ` ${transformation.attribute}="${transformation.value}"`;
      const updatedTag = beforeClosing + newAttribute + closing;
      
      lines[relativeLineNumber] = line.replace(tagMatch[0], updatedTag);
    }

    this.logger.debug(
      `Applied transformation: ${transformation.attribute}="${transformation.value}"`
    );

    return lines.join('\n');
  }

  private reconstructSFC(
    originalContent: string, 
    sections: SFCStructure, 
    newTemplateContent: string
  ): string {
    if (!sections.template) {
      return originalContent;
    }

    const lines = originalContent.split('\n');
    
    // Replace the template section content
    const templateStartLine = sections.template.startLine;
    const templateEndLine = sections.template.endLine;
    const newTemplateLines = newTemplateContent.split('\n');
    
    // Create new content array
    const newLines = [
      ...lines.slice(0, templateStartLine), // Before template
      ...newTemplateLines,                   // New template content
      ...lines.slice(templateEndLine + 1)   // After template
    ];

    return newLines.join('\n');
  }

  // Static utility method to check if content is a Vue SFC
  static isVueSFC(content: string): boolean {
    const vuePatterns = [
      /<template[^>]*>/i,
      /<script[^>]*>/i,
      /export\s+default\s*{/,
      /Vue\.component/,
    ];
    
    return vuePatterns.some(pattern => pattern.test(content));
  }

  // Extract component name from Vue SFC
  extractComponentName(content: string, filePath: string): string | null {
    try {
      // Try to extract from script section
      const sections = this.parseSFC(content);
      
      if (sections.script) {
        // Look for export default { name: 'ComponentName' }
        const nameMatch = sections.script.content.match(/name\s*:\s*['"`]([^'"`]+)['"`]/);
        if (nameMatch) {
          return nameMatch[1];
        }
      }

      // Fallback to filename
      const baseName = filePath.split('/').pop()?.replace(/\.vue$/, '');
      return baseName || null;
    } catch (error) {
      this.logger.debug(`Could not extract component name: ${error}`);
      return null;
    }
  }
}

interface SFCSection {
  content: string;
  startLine: number;
  endLine: number;
}

interface SFCStructure {
  template: SFCSection | null;
  script: SFCSection | null;
  style: SFCSection | null;
}

export const vueParser = new VueParser();
