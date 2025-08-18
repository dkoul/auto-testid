import { 
  IDGenerator as IIDGenerator, 
  Element, 
  GenerationContext, 
  NamingStrategy 
} from '../index';
import { Logger } from '../utils/logger';
import { ValidationUtils } from '../utils/validation';

export class IDGenerator implements IIDGenerator {
  private logger = new Logger('IDGenerator');

  // Common words that provide semantic meaning
  private readonly SEMANTIC_KEYWORDS = {
    actions: ['click', 'submit', 'cancel', 'close', 'open', 'save', 'delete', 'edit', 'add', 'remove'],
    navigation: ['nav', 'menu', 'link', 'breadcrumb', 'tab', 'page', 'home', 'back', 'next'],
    forms: ['form', 'input', 'field', 'select', 'option', 'checkbox', 'radio', 'textarea', 'label'],
    content: ['title', 'heading', 'text', 'content', 'description', 'summary', 'detail'],
    layout: ['header', 'footer', 'sidebar', 'main', 'container', 'wrapper', 'section'],
    status: ['success', 'error', 'warning', 'info', 'loading', 'disabled', 'active', 'selected'],
  };

  // Element type mappings for better semantic IDs
  private readonly ELEMENT_MAPPINGS: Record<string, string> = {
    'button': 'btn',
    'input': 'input',
    'select': 'select',
    'textarea': 'textarea',
    'form': 'form',
    'div': 'container',
    'span': 'text',
    'img': 'image',
    'a': 'link',
    'h1': 'heading',
    'h2': 'heading',
    'h3': 'heading',
    'h4': 'heading',
    'h5': 'heading',
    'h6': 'heading',
    'p': 'paragraph',
    'ul': 'list',
    'ol': 'list',
    'li': 'item',
    'table': 'table',
    'tr': 'row',
    'td': 'cell',
    'th': 'header',
  };

  generate(element: Element, context: GenerationContext): string {
    this.logger.debug(`Generating ID for ${element.tag} element`);

    // Build semantic components for the ID
    const components: string[] = [];

    // 1. Add context component if available
    if (context.component) {
      components.push(this.sanitizeComponent(context.component));
    }

    // 2. Analyze element for semantic meaning
    const semanticParts = this.extractSemanticParts(element);
    components.push(...semanticParts);

    // 3. Add element type
    const elementType = this.getElementType(element);
    if (elementType && !components.includes(elementType)) {
      components.push(elementType);
    }

    // 4. Generate base ID
    let baseId = this.combineComponents(components, context.namingStrategy);

    // 5. Apply prefix if specified
    if (context.prefix) {
      baseId = this.applyPrefix(baseId, context.prefix, context.namingStrategy);
    }

    // 6. Ensure uniqueness
    const uniqueId = this.resolveConflicts(baseId, context.existingIds);

    // 7. Validate and sanitize final ID
    const finalId = ValidationUtils.sanitizeTestId(uniqueId, 50);

    this.logger.debug(`Generated ID: ${finalId} for ${element.tag}`);
    return finalId;
  }

  validateUniqueness(id: string, scope: Set<string>): boolean {
    return !scope.has(id);
  }

  resolveConflicts(id: string, existingIds: Set<string>): string {
    if (!existingIds.has(id)) {
      return id;
    }

    this.logger.debug(`Resolving conflict for ID: ${id}`);

    // Try different strategies to resolve conflicts
    let attempts = 0;
    let resolvedId = id;

    while (existingIds.has(resolvedId) && attempts < 100) {
      attempts++;
      
      // Strategy 1: Append incremental number
      resolvedId = `${id}-${attempts}`;
      
      // Strategy 2: For very long IDs, try truncation with suffix
      if (attempts > 10 && id.length > 30) {
        const truncated = id.substring(0, 25);
        resolvedId = `${truncated}-${attempts}`;
      }
    }

    if (existingIds.has(resolvedId)) {
      // Fallback: Generate a unique ID with timestamp
      resolvedId = `${id}-${Date.now().toString(36)}`;
    }

    this.logger.debug(`Resolved conflict: ${id} -> ${resolvedId}`);
    return resolvedId;
  }

  private extractSemanticParts(element: Element): string[] {
    const parts: string[] = [];

    // 1. Analyze attributes for semantic meaning
    const meaningfulAttrs = this.extractMeaningfulAttributes(element);
    parts.push(...meaningfulAttrs);

    // 2. Analyze content for keywords
    if (element.content) {
      const contentKeywords = this.extractContentKeywords(element.content);
      parts.push(...contentKeywords);
    }

    // 3. Look for ARIA attributes
    const ariaSemantics = this.extractAriaSemantics(element);
    parts.push(...ariaSemantics);

    // 4. Analyze class names for semantic patterns
    const classSemantics = this.extractClassSemantics(element);
    parts.push(...classSemantics);

    return parts.filter(part => part.length > 0);
  }

  private extractMeaningfulAttributes(element: Element): string[] {
    const parts: string[] = [];
    const attrs = element.attributes || {};

    // Common meaningful attributes
    const meaningfulAttrNames = ['name', 'id', 'type', 'role', 'title', 'alt', 'placeholder'];
    
    meaningfulAttrNames.forEach(attrName => {
      const value = attrs[attrName];
      if (value && typeof value === 'string') {
        const keywords = this.extractKeywords(value);
        parts.push(...keywords);
      }
    });

    return parts;
  }

  private extractContentKeywords(content: string): string[] {
    if (!content || content.trim().length === 0) {
      return [];
    }

    // Extract keywords from text content
    const words = content
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && word.length < 15);

    // Prioritize semantic keywords
    const semanticWords: string[] = [];
    const allSemanticKeywords = Object.values(this.SEMANTIC_KEYWORDS).flat();
    
    words.forEach(word => {
      if (allSemanticKeywords.includes(word)) {
        semanticWords.push(word);
      }
    });

    // If no semantic words found, use first few meaningful words
    if (semanticWords.length === 0 && words.length > 0) {
      return words.slice(0, 2); // Take first 2 words
    }

    return semanticWords.slice(0, 3); // Limit to 3 semantic words
  }

  private extractAriaSemantics(element: Element): string[] {
    const parts: string[] = [];
    const attrs = element.attributes || {};

    // ARIA attributes that provide semantic meaning
    const ariaAttrs = [
      'aria-label',
      'aria-describedby',
      'aria-labelledby',
      'role',
    ];

    ariaAttrs.forEach(attrName => {
      const value = attrs[attrName];
      if (value && typeof value === 'string') {
        const keywords = this.extractKeywords(value);
        parts.push(...keywords);
      }
    });

    return parts;
  }

  private extractClassSemantics(element: Element): string[] {
    const className = element.attributes?.className || element.attributes?.class || '';
    if (!className) {
      return [];
    }

    const classNames = className.split(/\s+/);
    const semanticClasses: string[] = [];

    classNames.forEach(cls => {
      // Look for BEM-style classes or semantic patterns
      const keywords = this.extractKeywords(cls);
      semanticClasses.push(...keywords);
    });

    return semanticClasses.slice(0, 2); // Limit to avoid overly long IDs
  }

  private extractKeywords(text: string): string[] {
    if (!text) return [];

    // Split by common separators and extract meaningful parts
    const words = text
      .toLowerCase()
      .replace(/[-_]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1);

    const allSemanticKeywords = Object.values(this.SEMANTIC_KEYWORDS).flat();
    const semanticWords = words.filter(word => allSemanticKeywords.includes(word));
    
    // Return semantic words first, then other meaningful words
    return [...semanticWords, ...words.filter(w => !semanticWords.includes(w))].slice(0, 3);
  }

  private getElementType(element: Element): string | null {
    const tag = element.tag.toLowerCase();
    
    // Use mapping if available
    if (this.ELEMENT_MAPPINGS[tag]) {
      return this.ELEMENT_MAPPINGS[tag];
    }

    // For custom elements or unknown tags
    if (tag.includes('-')) {
      // Custom element - use the last part
      const parts = tag.split('-');
      return parts[parts.length - 1];
    }

    // Return the tag itself for unmapped elements
    return tag;
  }

  private sanitizeComponent(component: string): string {
    return component
      .toLowerCase()
      .replace(/component$/i, '') // Remove "Component" suffix
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private combineComponents(components: string[], strategy: NamingStrategy): string {
    if (components.length === 0) {
      return 'element';
    }

    // Remove duplicates while preserving order
    const uniqueComponents = [...new Set(components)];

    switch (strategy.type) {
      case 'kebab-case':
        return uniqueComponents.join('-');
      
      case 'camelCase':
        return uniqueComponents.reduce((result, component, index) => {
          if (index === 0) {
            return component.toLowerCase();
          }
          return result + component.charAt(0).toUpperCase() + component.slice(1).toLowerCase();
        }, '');
      
      case 'snake_case':
        return uniqueComponents.join('_');
      
      case 'custom':
        if (strategy.customTransform) {
          return strategy.customTransform(uniqueComponents.join('-'));
        }
        return uniqueComponents.join('-');
      
      default:
        return uniqueComponents.join('-');
    }
  }

  private applyPrefix(id: string, prefix: string, strategy: NamingStrategy): string {
    const separator = this.getSeparator(strategy.type);
    return `${prefix}${separator}${id}`;
  }

  private getSeparator(strategyType: string): string {
    switch (strategyType) {
      case 'kebab-case':
        return '-';
      case 'snake_case':
        return '_';
      case 'camelCase':
        return '';
      default:
        return '-';
    }
  }

  // Utility method to analyze element priority for ID generation
  getPriority(element: Element): number {
    let priority = 0;

    // Interactive elements get higher priority
    const interactiveElements = ['button', 'input', 'select', 'textarea', 'a'];
    if (interactiveElements.includes(element.tag.toLowerCase())) {
      priority += 10;
    }

    // Elements with roles get higher priority
    if (element.attributes?.role) {
      priority += 5;
    }

    // Elements with meaningful content get higher priority
    if (element.content && element.content.trim().length > 0) {
      priority += 3;
    }

    // Elements with ARIA labels get higher priority
    if (element.attributes?.['aria-label']) {
      priority += 5;
    }

    return priority;
  }

  // Generate multiple ID candidates and return the best one
  generateCandidates(element: Element, context: GenerationContext, count: number = 3): string[] {
    const candidates: string[] = [];

    // Strategy 1: Full semantic analysis
    candidates.push(this.generate(element, context));

    // Strategy 2: Simplified approach with just content + element type
    if (element.content) {
      const contentKeywords = this.extractContentKeywords(element.content);
      const elementType = this.getElementType(element);
      const simplified = [...contentKeywords, elementType].filter((item): item is string => Boolean(item));
      const simplifiedId = this.combineComponents(simplified, context.namingStrategy);
      if (context.prefix) {
        candidates.push(this.applyPrefix(simplifiedId, context.prefix, context.namingStrategy));
      } else {
        candidates.push(simplifiedId);
      }
    }

    // Strategy 3: Attribute-based approach
    const attrKeywords = this.extractMeaningfulAttributes(element);
    if (attrKeywords.length > 0) {
      const elementType = this.getElementType(element);
      const attrBased = [...attrKeywords.slice(0, 2), elementType].filter((item): item is string => Boolean(item));
      const attrBasedId = this.combineComponents(attrBased, context.namingStrategy);
      if (context.prefix) {
        candidates.push(this.applyPrefix(attrBasedId, context.prefix, context.namingStrategy));
      } else {
        candidates.push(attrBasedId);
      }
    }

    // Remove duplicates and ensure uniqueness
    const uniqueCandidates = [...new Set(candidates)];
    return uniqueCandidates
      .map(id => this.resolveConflicts(id, context.existingIds))
      .slice(0, count);
  }
}

export const idGenerator = new IDGenerator(); 