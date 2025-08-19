// Parser exports
export * from './react-parser';
export * from './vue-parser';
// TODO: Add other parsers when implemented
// export * from './angular-parser';  
// export * from './html-parser';

// Re-export parser instances
export { reactParser } from './react-parser';
export { vueParser } from './vue-parser';

// Parser factory function
import { Framework, Parser } from '../index';
import { reactParser } from './react-parser';
import { vueParser } from './vue-parser';

export function createParser(framework: Framework): Parser | null {
  switch (framework) {
    case 'react':
      return reactParser;
    case 'vue':
      return vueParser;
    case 'angular':
      // TODO: return angularParser when implemented
      return null;
    case 'html':
      // TODO: return htmlParser when implemented  
      return null;
    default:
      return null;
  }
}

// Auto-detect parser based on file path
export function detectParser(filePath: string): Parser | null {
  if (reactParser.canParse(filePath)) {
    return reactParser;
  }
  
  if (vueParser.canParse(filePath)) {
    return vueParser;
  }
  
  // TODO: Add other parser detection when implemented
  
  return null;
} 