# @dkoul/auto-testid-core

🎯 **Core AST parsing and transformation logic for automated data-testid generation**

## Overview

The `@auto-testid/core` package provides the core functionality for automatically generating semantic `data-testid` attributes in React, Vue, Angular, and HTML files. It uses Abstract Syntax Tree (AST) parsing to intelligently analyze UI elements and generate meaningful test identifiers.

## Features

✅ **Multi-Framework Support**
- React/JSX with TypeScript support
- Vue Single File Components (planned)
- Angular templates (planned)
- Vanilla HTML (planned)

✅ **Intelligent ID Generation**
- Semantic analysis of element content and attributes
- Conflict resolution with automatic suffixing
- Multiple naming strategies (kebab-case, camelCase, snake_case)
- Context-aware generation using component names

✅ **AST-Based Transformation**
- Babel AST parsing for React/JSX
- Preserves code formatting and structure
- Non-destructive transformations
- Source map support

## Installation

```bash
npm install @dkoul/auto-testid-core
```

## Quick Start

```typescript
import { createAutoTestID } from '@dkoul/auto-testid-core';

// Create instance with default configuration
const autoTestID = createAutoTestID();

// Process a single file
const result = await autoTestID.processFile('./src/components/Button.tsx', {
  dryRun: true, // Preview changes without modifying files
});

console.log(`Generated ${result.metrics.idGenerated} test IDs`);

// Process multiple files
const files = await autoTestID.scanDirectory('./src/components');
const results = await autoTestID.processFiles(files);
```

## Configuration

```typescript
import { createAutoTestID } from '@dkoul/auto-testid-core';

const autoTestID = createAutoTestID({
  frameworks: ['react'],
  namingStrategy: { type: 'kebab-case' },
  prefix: 'test',
  includeElementTypes: ['button', 'input', 'select', 'textarea', 'form', 'a'],
  maxIdLength: 50,
  preserveExisting: true,
});
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
```

## Examples

### React Component Processing

```typescript
// Input JSX
<div className="login-form">
  <button onClick={handleSubmit}>Sign In</button>
  <a href="/forgot">Forgot Password?</a>
</div>

// Generated Output
<div className="login-form" data-testid="test-login-form-container">
  <button onClick={handleSubmit} data-testid="test-sign-btn">Sign In</button>
  <a href="/forgot" data-testid="test-forgot-password-link">Forgot Password?</a>
</div>
```

### Batch Processing

```typescript
const autoTestID = createAutoTestID({
  namingStrategy: { type: 'camelCase' },
  prefix: 'e2e',
});

const files = await autoTestID.scanDirectory('./src', {
  include: ['**/*.tsx'],
  exclude: ['**/*.test.*'],
  frameworks: ['react'],
});

const results = await autoTestID.processFiles(files, {
  onProgress: (progress) => {
    console.log(`Processing: ${progress.current} (${progress.completed}/${progress.total})`);
  }
});

console.log(`Successfully processed ${results.filter(r => r.success).length} files`);
```

## Supported Elements

By default, the following HTML elements will receive `data-testid` attributes:

- Interactive elements: `button`, `input`, `select`, `textarea`, `a`
- Form elements: `form`, `label`
- Container elements: `div`, `span` (when they contain meaningful content)
- Media elements: `img`, `video`, `audio`

## Framework Support Status

| Framework | Status | Parser | Transformer |
|-----------|--------|---------|-------------|
| React/JSX | ✅ Complete | ✅ Babel AST | ✅ JSX |
| Vue SFC | 🚧 Planned | - | - |
| Angular | 🚧 Planned | - | - |
| HTML | 🚧 Planned | - | - |

## Contributing

We welcome contributions! The architecture is designed to be extensible for additional frameworks.

## License

MIT License - see LICENSE file for details.

---

**Part of the Auto-TestID ecosystem:**
- [`@auto-testid/cli`](https://npmjs.com/package/@auto-testid/cli) - Command-line interface
- [`@auto-testid/vscode-extension`](https://marketplace.visualstudio.com/items?itemName=auto-testid.vscode-extension) - VSCode extension (coming soon) 