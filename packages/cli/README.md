# @dkoul/auto-testid-cli

🖥️ **Command-line interface for automated data-testid generation**

## Overview

The `@auto-testid/cli` package provides a powerful command-line tool for automatically generating semantic `data-testid` attributes in your React, Vue, Angular, and HTML projects. Perfect for improving E2E testing workflows and QA automation.

## Features

✅ **Professional CLI Experience**
- Beautiful progress indicators and colored output
- Comprehensive error handling and validation
- Dry-run mode to preview changes safely
- Backup file creation for safety
- Detailed metrics and performance reporting

✅ **Flexible Processing**
- Single file or entire directory processing
- Framework auto-detection or manual specification
- Configurable include/exclude patterns
- Batch processing with progress tracking

✅ **Production Ready**
- Zero breaking changes to existing code
- Semantic, readable test ID generation
- Conflict resolution and uniqueness guarantees
- Integration with CI/CD pipelines

## Installation

### Global Installation (Recommended)
```bash
npm install -g @dkoul/auto-testid-cli
```

### Project-Specific Installation
```bash
npm install --save-dev @dkoul/auto-testid-cli
```

### One-time Usage
```bash
npx @dkoul/auto-testid-cli generate ./src
```

## Quick Start

### 1. Initialize Configuration (Optional)
```bash
auto-testid init
```

### 2. Preview Changes (Dry Run)
```bash
auto-testid generate ./src --dry-run
```

### 3. Apply Changes with Backup
```bash
auto-testid generate ./src --backup
```

## Commands

### `generate` (Main Command)
Generate data-testid attributes for files or directories.

```bash
auto-testid generate [path] [options]
```

**Options:**
- `--framework <framework>` - Target framework (react, vue, angular, html)
- `--dry-run` - Preview changes without modifying files  
- `--backup` - Create backup files before modification
- `--prefix <prefix>` - Test ID prefix (default: "test")
- `--naming <strategy>` - Naming strategy (kebab-case, camelCase, snake_case)
- `--exclude <patterns>` - Exclude file patterns
- `--include <patterns>` - Include file patterns
- `--config <path>` - Path to configuration file

### `scan`
Scan directory for files that would be processed.

```bash
auto-testid scan [path] [options]
```

**Options:**
- `--stats` - Show detailed file statistics
- `--framework <framework>` - Filter by framework

### `validate`
Validate existing data-testid attributes (coming soon).

```bash
auto-testid validate [path] [options]
```

### `init`
Initialize configuration file.

```bash
auto-testid init [options]
```

**Options:**
- `--format <format>` - Configuration format (json, js)
- `--interactive` - Interactive setup (coming soon)

### `examples`
Show usage examples and best practices.

```bash
auto-testid examples
```

## Usage Examples

### Basic Usage
```bash
# Generate test IDs for all React components in src/
auto-testid generate ./src --framework react

# Preview changes without modifying files
auto-testid generate ./src --dry-run

# Generate with custom prefix and backup
auto-testid generate ./src --prefix e2e --backup
```

### Framework-Specific
```bash
# React/TypeScript project
auto-testid generate ./src --framework react --naming camelCase

# Vue project (when supported)
auto-testid generate ./src --framework vue

# Mixed project with custom patterns
auto-testid generate ./src --include "**/*.{tsx,vue}" --exclude "**/test/**"
```

### Advanced Usage
```bash
# Custom configuration file
auto-testid generate ./src --config .autotestidrc.json

# Exclude specific patterns
auto-testid generate ./src --exclude "**/node_modules/**" "**/*.test.*"

# Maximum ID length limit
auto-testid generate ./src --max-length 40 --naming snake_case
```

### CI/CD Integration
```bash
# Check what would be generated (exit code 0 if changes needed)
auto-testid generate ./src --dry-run --silent

# Apply changes in CI pipeline
auto-testid generate ./src --backup --silent
```

## Configuration File

Create `.autotestidrc.json` in your project root:

```json
{
  "frameworks": ["react"],
  "namingStrategy": { "type": "kebab-case" },
  "prefix": "test",
  "exclude": [
    "**/node_modules/**",
    "**/dist/**",
    "**/*.test.*",
    "**/*.spec.*"
  ],
  "includeElementTypes": [
    "button", "input", "select", "textarea", 
    "form", "a", "div", "span"
  ],
  "maxIdLength": 50,
  "preserveExisting": true
}
```

Or JavaScript config `autotestid.config.js`:

```javascript
module.exports = {
  frameworks: ['react'],
  namingStrategy: { type: 'kebab-case' },
  prefix: 'test',
  exclude: ['**/node_modules/**', '**/dist/**'],
  includeElementTypes: ['button', 'input', 'select', 'textarea', 'form', 'a'],
  maxIdLength: 50,
  preserveExisting: true,
};
```

## Sample Output

```bash
$ auto-testid generate ./src --dry-run

🎯 Auto-TestID Generation Results

📋 Dry Run Mode - No files were modified

📊 Summary:
   Files processed: 15
   Elements found: 127
   Test IDs generated: 89

✅ Successfully processed:
   ✓ LoginForm.tsx (12 test IDs, 8ms)
     + button "Sign In" → data-testid="test-sign-btn"
     + input[type="email"] → data-testid="test-email-input"
     + form → data-testid="test-login-form"
     ... and 9 more
   
   ✓ UserCard.tsx (8 test IDs, 5ms)
   ✓ Navigation.tsx (15 test IDs, 7ms)
   ...

⚡ Performance:
   Total time: 156ms
   Average per file: 10.4ms

💡 Next steps:
   • Run without --dry-run to apply 89 changes
   • Use --backup to create backup files
```

## Integration Examples

### Package.json Scripts
```json
{
  "scripts": {
    "testids:preview": "auto-testid generate ./src --dry-run",
    "testids:apply": "auto-testid generate ./src --backup",
    "testids:scan": "auto-testid scan ./src --stats"
  }
}
```

### Pre-commit Hook
```bash
# .husky/pre-commit
auto-testid generate ./src --dry-run --silent || {
  echo "❌ Missing test IDs detected. Run 'npm run testids:apply' to fix."
  exit 1
}
```

### GitHub Actions
```yaml
- name: Generate Test IDs
  run: |
    npx @dkoul/auto-testid-cli generate ./src --dry-run --silent
    if [ $? -eq 1 ]; then
      echo "::warning::Missing test IDs detected"
    fi
```

## Supported Frameworks

| Framework | Status | File Extensions |
|-----------|--------|-----------------|
| React/JSX | ✅ Complete | `.jsx`, `.tsx`, `.js`, `.ts` |
| Vue SFC | 🚧 Planned | `.vue` |
| Angular | 🚧 Planned | `.html`, `.ts` |
| HTML | 🚧 Planned | `.html` |

## Troubleshooting

### Common Issues

**No files found:**
```bash
# Check your include/exclude patterns
auto-testid scan ./src --stats
```

**Permission errors:**
```bash
# Ensure write permissions
chmod -R u+w ./src
```

**Configuration not loading:**
```bash
# Verify config file location and syntax
auto-testid generate ./src --config .autotestidrc.json --dry-run
```

## Performance

- **Small projects** (< 50 files): ~100ms
- **Medium projects** (50-200 files): ~500ms  
- **Large projects** (200+ files): ~2s

Processing is highly optimized with intelligent caching and parallel execution.

## Contributing

We welcome contributions! See our [Contributing Guide](https://github.com/auto-testid/auto-testid/blob/main/CONTRIBUTING.md).

## License

MIT License - see LICENSE file for details.

---

**Part of the Auto-TestID ecosystem:**
- [`@auto-testid/core`](https://npmjs.com/package/@auto-testid/core) - Core parsing and transformation logic
- [`@auto-testid/vscode-extension`](https://marketplace.visualstudio.com/items?itemName=auto-testid.vscode-extension) - VSCode extension (coming soon) 