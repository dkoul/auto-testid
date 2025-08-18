// Parser exports
export * from './react-parser';
// TODO: Add other parsers when implemented
// export * from './vue-parser';
// export * from './angular-parser';  
// export * from './html-parser';

// Re-export parser instances
export { reactParser } from './react-parser';

// Parser factory function
import { Framework, Parser } from '../index';
import { reactParser } from './react-parser';

export function createParser(framework: Framework): Parser | null {
  switch (framework) {
    case 'react':
      return reactParser;
    case 'vue':
      // TODO: return vueParser when implemented
      return null;
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
  
  // TODO: Add other parser detection when implemented
  
  return null;
} 