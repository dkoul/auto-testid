# Auto-TestID Usage Guide

A powerful tool for automatically adding custom attributes to React and Vue.js components for testing, analytics, and automation.

## 🚀 What's New in V2.0

### ✨ **Configurable Attribute Names**
No longer limited to `data-testid`! Generate any custom attribute for multiple use cases:

```bash
# E2E Testing (default)
auto-testid generate ./src --attribute-name data-testid --prefix test

# Analytics Tracking  
auto-testid generate ./src --attribute-name data-analytics --prefix track

# QA Automation
auto-testid generate ./src --attribute-name data-qa --prefix qa

# Custom Attributes
auto-testid generate ./src --attribute-name data-custom --prefix my
```

**Results:**
- `data-testid="test-login-form"`
- `data-analytics="track-submit-btn"` 
- `data-qa="qa-email-input"`
- `data-custom="my-container"`

### 🎯 **Vue.js Support**
Full support for Vue Single File Components (.vue files):

```bash
# Process Vue components
auto-testid generate ./src --framework vue

# Works with all Vue syntax
auto-testid generate ./src --framework vue --attribute-name data-track --prefix analytics
```

**Supported Vue Features:**
- ✅ Single File Components (.vue)
- ✅ Template sections with HTML elements  
- ✅ Vue directives (`v-model`, `@click`, `:disabled`, etc.)
- ✅ Vue 2 & Vue 3 compatible syntax
- ✅ Scoped styles and script sections preserved

### 🔄 **Backward Compatibility**
All existing V1 functionality preserved - upgrade seamlessly!

---

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
See what attributes would be added without modifying files:

```bash
# React components
auto-testid generate ./src --dry-run --framework react

# Vue components  
auto-testid generate ./src --dry-run --framework vue

# Custom attributes for analytics
auto-testid generate ./src --dry-run --attribute-name data-analytics --prefix track
```

This shows you:
- Number of elements found
- Test IDs that would be generated
- Processing time
- Any errors or warnings

### 3. Apply Changes Safely
Apply the changes with backup files for safety:

```bash
# React components with data-testid
auto-testid generate ./src --framework react --backup

# Vue components with custom attributes
auto-testid generate ./src --framework vue --attribute-name data-analytics --prefix track --backup
```

This will:
- Create `.bak` files for all modified files
- Add custom attributes to React/Vue components
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
- `--attribute-name <name>`: Custom attribute name (default: "data-testid")
- `--prefix <string>`: Custom prefix for test IDs (default: "test")
- `--naming <style>`: Naming convention (kebab-case, camelCase, snake_case)
- `--exclude <patterns>`: Exclude file patterns
- `--max-length <number>`: Maximum length for generated IDs

### Examples Command
```bash
auto-testid examples
```

Shows usage examples and common patterns.

## Real-World Usage Examples

### React E2E Testing Setup
Processing a React Electron app:

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

### Vue.js Component Processing
Processing a Vue.js application:

```bash
# Step 1: Scan Vue files
auto-testid scan ./src --framework vue --stats
# Result: Found 15 Vue files (.vue components)

# Step 2: Preview with custom attributes
auto-testid generate ./src --dry-run --framework vue --attribute-name data-qa --prefix qa
# Result: Would add 145 data-qa attributes to 198 elements

# Step 3: Apply analytics tracking
auto-testid generate ./src --framework vue --attribute-name data-analytics --prefix track --backup
# Result: Successfully added 140 data-analytics attributes across 12 components
```

## Understanding the Output

### Generated Attributes
The tool creates semantic, context-aware attributes for any use case:

**React Examples:**
```tsx
// Default data-testid
<div className="login-form" data-testid="test-form-login-container">
<button type="submit" data-testid="test-submit-btn">Sign In</button>
<input type="email" data-testid="test-email-input" />

// Custom analytics attributes
<div className="dashboard" data-analytics="track-dashboard-container">
<button onClick={handleClick} data-analytics="track-action-btn">Click Me</button>
```

**Vue Examples:**
```vue
<!-- Default data-testid -->
<template>
  <div class="user-profile" data-testid="test-profile-user-container">
    <button @click="save" data-testid="test-save-btn">Save</button>
    <input v-model="name" data-testid="test-name-input" />
  </div>
</template>

<!-- Custom QA attributes -->
<template>  
  <form class="contact-form" data-qa="qa-contact-form">
    <button type="submit" data-qa="qa-submit-btn">Submit</button>
  </form>
</template>
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

**Default Testing Setup:**
```json
{
  "attributeName": "data-testid",
  "prefix": "test",
  "naming": "kebab-case", 
  "frameworks": ["react", "vue"],
  "exclude": ["**/*.test.*", "**/*.spec.*"],
  "maxLength": 50,
  "backup": true
}
```

**Analytics Tracking Setup:**
```json
{
  "attributeName": "data-analytics", 
  "prefix": "track",
  "naming": "camelCase",
  "frameworks": ["react", "vue"],
  "exclude": ["**/node_modules/**", "**/test/**"],
  "maxLength": 60,
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
4. **Review generated attributes** for semantic accuracy
5. **Use framework-specific commands** for better performance
6. **Exclude test files** to avoid adding attributes to test code
7. **Choose meaningful attribute names** for your use case
8. **Use consistent prefixes** across your application

## Use Cases

- 🧪 **E2E Testing**: `data-testid` attributes for Cypress, Playwright, Selenium
- 📊 **Analytics Tracking**: `data-analytics` attributes for user behavior analysis  
- 🔍 **QA Automation**: `data-qa` attributes for quality assurance workflows
- 🎯 **A/B Testing**: `data-experiment` attributes for testing frameworks
- 🤖 **Custom Automation**: Any custom attribute for your specific needs

## Framework Support

| Framework | Status | File Types | Features |
|-----------|--------|------------|----------|
| **React** | ✅ Full | `.jsx`, `.tsx`, `.js`, `.ts` | JSX parsing, TypeScript support |
| **Vue.js** | ✅ Full | `.vue` | SFC parsing, Vue directives |
| **Angular** | 🚧 Planned | `.html`, `.ts` | Coming soon |
| **HTML** | 🚧 Planned | `.html` | Coming soon |

This tool transforms your React and Vue.js components for testing, analytics, and automation workflows with any modern framework. 