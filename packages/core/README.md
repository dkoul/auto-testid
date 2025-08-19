# @dkoul/auto-testid-core

🎯 **Core AST parsing and transformation logic for React and Vue.js custom attribute generation**

## V2.0 Features

✨ **Configurable Attribute Names** - Generate any custom attribute:
- `data-testid` for E2E testing
- `data-analytics` for user tracking  
- `data-qa` for QA automation
- `data-experiment` for A/B testing
- Any custom attribute for your needs

🎯 **Vue.js Support** - Full Single File Component (.vue) parsing:
- Template section parsing
- Vue directives (`v-model`, `@click`, `:disabled`)
- Vue 2 & Vue 3 compatible
- SFC structure preservation

🔄 **React Support** - Enhanced JSX/TSX parsing:
- TypeScript support
- Class and functional components
- Modern React patterns

## Installation

```bash
npm install @dkoul/auto-testid-core
```

## Quick Start

```typescript
import { createAutoTestID } from '@dkoul/auto-testid-core';

// Create instance with custom configuration
const autoTestID = createAutoTestID({
  attributeName: 'data-analytics', // Custom attribute name
  prefix: 'track',                 // Custom prefix
  frameworks: ['react', 'vue'],    // Target frameworks
  namingStrategy: { type: 'kebab-case' }
});

// Process a React file
const result = await autoTestID.processFile('./src/components/Button.tsx', {
  dryRun: true, // Preview changes
});

console.log(`Generated ${result.metrics.idGenerated} attributes`);

// Process Vue files
const vueResult = await autoTestID.processFile('./src/components/Modal.vue', {
  dryRun: false, // Apply changes
  backup: true   // Create backup
});
```

## Configuration

```typescript
const config = {
  // Custom attribute name (NEW in V2)
  attributeName: 'data-testid',     // or 'data-analytics', 'data-qa', etc.
  
  // Attribute value configuration
  prefix: 'test',                   // Prefix for generated values
  namingStrategy: { 
    type: 'kebab-case'              // kebab-case, camelCase, snake_case
  },
  
  // Framework support
  frameworks: ['react', 'vue'],     // Vue.js support NEW in V2
  
  // Element targeting
  includeElementTypes: [
    'button', 'input', 'select', 'textarea', 
    'form', 'a', 'div', 'span'
  ],
  
  // Processing options
  conflictResolution: 'suffix',     // Handle duplicate IDs
  maxIdLength: 50,                  // Limit attribute length
  preserveExisting: true            // Don't overwrite existing attributes
};
```

## Examples

### React Component Processing

**Input:**
```tsx
function LoginForm() {
  return (
    <form className="login">
      <input type="email" placeholder="Email" />
      <button type="submit">Sign In</button>
    </form>
  );
}
```

**Output (data-testid):**
```tsx
function LoginForm() {
  return (
    <form className="login" data-testid="test-login-form">
      <input type="email" placeholder="Email" data-testid="test-email-input" />
      <button type="submit" data-testid="test-sign-btn">Sign In</button>
    </form>
  );
}
```

**Output (data-analytics):**
```tsx
function LoginForm() {
  return (
    <form className="login" data-analytics="track-login-form">
      <input type="email" placeholder="Email" data-analytics="track-email-input" />
      <button type="submit" data-analytics="track-sign-btn">Sign In</button>
    </form>
  );
}
```

### Vue Component Processing

**Input:**
```vue
<template>
  <div class="user-card">
    <h3>{{ user.name }}</h3>
    <button @click="editUser">Edit Profile</button>
  </div>
</template>
```

**Output:**
```vue
<template>
  <div class="user-card" data-testid="test-user-card-container">
    <h3 data-testid="test-name-heading">{{ user.name }}</h3>
    <button @click="editUser" data-testid="test-edit-profile-btn">Edit Profile</button>
  </div>
</template>
```

## API Reference

### Core Interface

```typescript
interface AutoTestIDCore {
  processFile(filePath: string, options?: ProcessOptions): Promise<ProcessResult>;
  processFiles(filePaths: string[], options?: ProcessOptions): Promise<ProcessResult[]>;
  scanDirectory(directory: string, options?: ScanOptions): Promise<string[]>;
  validateConfiguration(config: Partial<ConfigurationSchema>): ValidationResult;
}
```

### Configuration Schema

```typescript
interface ConfigurationSchema {
  attributeName: string;           // NEW: Custom attribute name
  frameworks: Framework[];         // ['react', 'vue', 'angular', 'html']
  namingStrategy: NamingStrategy;  // Naming convention
  prefix?: string;                 // Value prefix
  exclude: string[];               // File patterns to exclude
  includeElementTypes: string[];   // HTML elements to target
  conflictResolution: 'suffix' | 'prefix' | 'replace';
  maxIdLength: number;
  preserveExisting: boolean;
}
```

## Use Cases

- 🧪 **E2E Testing**: Generate `data-testid` for Cypress, Playwright, Selenium
- 📊 **Analytics**: Generate `data-analytics` for user behavior tracking
- 🔍 **QA Automation**: Generate `data-qa` for quality assurance workflows  
- 🎯 **A/B Testing**: Generate `data-experiment` for testing frameworks
- 🤖 **Custom Automation**: Generate any custom attribute for your workflows

## Framework Support

| Framework | Status | File Types | Features |
|-----------|--------|------------|----------|
| **React** | ✅ Full | `.jsx`, `.tsx`, `.js`, `.ts` | JSX parsing, TypeScript support |
| **Vue.js** | ✅ Full | `.vue` | SFC parsing, Vue directives |  
| **Angular** | 🚧 Planned | `.html`, `.ts` | Coming soon |
| **HTML** | 🚧 Planned | `.html` | Coming soon |

## License

MIT License - see [LICENSE](https://github.com/dkoul/auto-testid/blob/main/LICENSE) for details.

---

**Part of the Auto-TestID ecosystem:**
- [`@dkoul/auto-testid-cli`](https://npmjs.com/package/@dkoul/auto-testid-cli) - Command-line interface