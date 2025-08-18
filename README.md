# Auto-TestID Usage Guide

A practical guide for using the `@dkoul/auto-testid-cli` package to automatically add data-testid attributes to React components.

## Installation

### Global Installation (Recommended)
```bash
npm install -g @dkoul/auto-testid-cli
```

### One-time Usage
```bash
npx @dkoul/auto-testid-cli [command] [options]
```

## Quick Start

### 1. Scan Your Project
Before making any changes, scan your project to see what files will be processed:

```bash
auto-testid scan ./src --stats
```

Example output:
```
Target: /path/to/your/src
Files found: 19

File breakdown:
   .tsx: 11 files
   .ts: 7 files
   .html: 1 files

Files to process:
   • App.tsx
   • components/BackgroundUpload.tsx
   • components/BrandingPanel.tsx
   • ... and 16 more
```

### 2. Dry Run (Preview Changes)
See what data-testid attributes would be added without modifying files:

```bash
auto-testid generate ./src --dry-run --framework react
```

This shows you:
- Number of elements found
- Test IDs that would be generated
- Processing time
- Any errors or warnings

### 3. Apply Changes Safely
Apply the changes with backup files for safety:

```bash
auto-testid generate ./src --framework react --backup
```

This will:
- Create `.bak` files for all modified files
- Add data-testid attributes to React components
- Show detailed results and performance metrics

## Command Reference

### Scan Command
```bash
auto-testid scan <directory> [options]
```

Options:
- `--stats`: Show file breakdown by extension
- `--framework <type>`: Filter by framework (react, vue, angular, html)

### Generate Command
```bash
auto-testid generate <directory> [options]
```

Essential Options:
- `--dry-run`: Preview changes without modifying files
- `--backup`: Create backup files before modifying
- `--framework <type>`: Specify framework (react, vue, angular, html)

Advanced Options:
- `--prefix <string>`: Custom prefix for test IDs (default: "test")
- `--naming <style>`: Naming convention (kebab-case, camelCase, snake_case)
- `--exclude <patterns>`: Exclude file patterns
- `--max-length <number>`: Maximum length for generated IDs

### Examples Command
```bash
auto-testid examples
```

Shows usage examples and common patterns.

## Real-World Usage Example

Based on processing a React Electron app:

```bash
# Step 1: Scan the project
auto-testid scan ./src --stats
# Result: Found 19 files (11 .tsx, 7 .ts, 1 .html)

# Step 2: Preview changes
auto-testid generate ./src --dry-run --framework react
# Result: Would add 242 data-testid attributes to 425 elements

# Step 3: Apply changes with backup
auto-testid generate ./src --framework react --backup
# Result: Successfully added 231 data-testid attributes across 10 components
```

## Understanding the Output

### Generated Test IDs
The tool creates semantic, context-aware test IDs:

```tsx
// Containers
<div className="h-screen bg-gray-50" data-testid="test-screen-bg-container">

// Interactive elements
<button disabled={!hasContent} data-testid="test-full-flex-btn">

// Form inputs
<input type="file" className="hidden" data-testid="test-file-hidden-input" />

// Text elements
<span data-testid="test-text-1">{buttonText}</span>
```

### Performance Metrics
```
Summary:
   Files processed: 19
   Elements found: 425
   Test IDs generated: 242
   Total time: 128ms
   Average per file: 6.7ms
```

## Safety Features

### Backup Files
When using `--backup`, original files are preserved:
```
components/App.tsx         # Modified file
components/App.tsx.bak     # Original backup
```

### Rollback Changes
To restore original files:
```bash
# Single file
mv App.tsx.bak App.tsx

# All files in directory
find ./src -name "*.bak" -exec sh -c 'mv "$1" "${1%.bak}"' _ {} \;
```

### Dry Run First
Always run with `--dry-run` first to verify:
- Number of changes expected
- Files that will be modified
- Any potential issues

## Verification

### Count Added Attributes
```bash
# Count total data-testid attributes
grep -r "data-testid" ./src --include="*.tsx" | wc -l

# Show specific examples
grep -n "data-testid" ./src/components/App.tsx | head -5
```

### Compare Changes
```bash
# View differences
diff -u ./src/components/App.tsx.bak ./src/components/App.tsx

# Show only additions
diff ./src/components/App.tsx.bak ./src/components/App.tsx | grep "^>"
```

## Integration with Testing Tools

### Cypress
```javascript
// Select by test ID
cy.get('[data-testid="test-full-flex-btn"]').click();
cy.get('[data-testid="test-file-hidden-input"]').attachFile('test.jpg');
```

### Playwright
```javascript
// Select by test ID
await page.getByTestId('test-screen-bg-container').isVisible();
await page.getByTestId('test-full-flex-btn').click();
```

### React Testing Library
```javascript
// Select by test ID
const button = getByTestId('test-full-flex-btn');
const container = getByTestId('test-screen-bg-container');
```

## Troubleshooting

### Common Issues

**No parser available for framework: html**
- HTML parsing not yet implemented
- Only affects .html files, .tsx/.ts files process normally

**TypeScript compilation errors**
- The tool only adds attributes, doesn't change TypeScript logic
- If errors occur, check for syntax issues in original files

**Large number of changes**
- Use `--dry-run` first to verify scope
- Consider using `--exclude` to filter out test files or specific directories

### Performance Optimization
- Use `--framework react` to skip non-React files
- Exclude unnecessary directories: `--exclude "**/node_modules/**" "**/dist/**"`
- Process specific directories: `auto-testid generate ./src/components`

## Configuration File

Create `.autotestidrc.json` in your project root:

```json
{
  "prefix": "test",
  "naming": "kebab-case",
  "frameworks": ["react"],
  "exclude": ["**/*.test.*", "**/*.spec.*"],
  "maxLength": 50,
  "backup": true
}
```

Then run simply:
```bash
auto-testid generate ./src
```

## Best Practices

1. **Always use --dry-run first** to preview changes
2. **Enable --backup** for safety on production code
3. **Commit changes separately** from feature work
4. **Review generated IDs** for semantic accuracy
5. **Use framework-specific commands** for better performance
6. **Exclude test files** to avoid adding IDs to test code

This tool transforms your React components to be immediately ready for robust E2E testing with any modern testing framework. 