# @dkoul/auto-testid-cli

🖥️ **Command-line interface for React and Vue.js custom attribute generation**

## V2.0 Features

✨ **Configurable Attribute Names** - Generate any custom attribute:
```bash
# E2E Testing (default)
auto-testid generate ./src --attribute-name data-testid --prefix test

# Analytics Tracking
auto-testid generate ./src --attribute-name data-analytics --prefix track

# QA Automation  
auto-testid generate ./src --attribute-name data-qa --prefix qa

# Custom attributes for any purpose
auto-testid generate ./src --attribute-name data-custom --prefix my
```

🎯 **Vue.js Support** - Full Single File Component (.vue) processing:
```bash
# Process Vue components
auto-testid generate ./src --framework vue

# Vue with custom attributes
auto-testid generate ./src --framework vue --attribute-name data-track --prefix analytics
```

🔄 **React Support** - Enhanced JSX/TSX processing with TypeScript support

## Installation

### Global Installation (Recommended)
```bash
npm install -g @dkoul/auto-testid-cli
```

### One-time Usage
```bash
npx @dkoul/auto-testid-cli generate ./src --dry-run
```

## Quick Start

### 1. Preview Changes (Dry Run)
```bash
# React components
auto-testid generate ./src --dry-run --framework react

# Vue components
auto-testid generate ./src --dry-run --framework vue

# Custom attributes for analytics
auto-testid generate ./src --dry-run --attribute-name data-analytics --prefix track
```

### 2. Apply Changes Safely
```bash
# React with data-testid
auto-testid generate ./src --framework react --backup

# Vue with custom analytics attributes  
auto-testid generate ./src --framework vue --attribute-name data-analytics --prefix track --backup
```

## Command Reference

### Generate Command
```bash
auto-testid generate <path> [options]
```

**Essential Options:**
- `--framework <type>` - Target framework: `react`, `vue`, `angular`, `html`
- `--attribute-name <name>` - Custom attribute name (default: `data-testid`)
- `--prefix <string>` - Custom prefix for values (default: `test`)
- `--dry-run` - Preview changes without modifying files
- `--backup` - Create backup files before modification

**Advanced Options:**
- `--naming <strategy>` - Naming convention: `kebab-case`, `camelCase`, `snake_case`
- `--exclude <patterns>` - Exclude file patterns (glob)
- `--include <patterns>` - Include file patterns (glob)
- `--max-length <number>` - Maximum attribute value length

### Scan Command
```bash
auto-testid scan <path> [options]
```

- `--stats` - Show detailed file statistics
- `--framework <type>` - Filter by framework

## Real-World Examples

### E2E Testing Setup
```bash
# Step 1: Scan React project
auto-testid scan ./src --framework react --stats
# Result: Found 25 React files

# Step 2: Preview test ID generation  
auto-testid generate ./src --dry-run --framework react
# Result: Would add 180 data-testid attributes

# Step 3: Apply changes with backup
auto-testid generate ./src --framework react --backup
# Result: Successfully added 175 data-testid attributes
```

### Analytics Tracking Setup
```bash
# Step 1: Scan Vue.js project
auto-testid scan ./src --framework vue --stats  
# Result: Found 18 Vue files

# Step 2: Preview analytics attributes
auto-testid generate ./src --dry-run --framework vue --attribute-name data-analytics --prefix track
# Result: Would add 142 data-analytics attributes

# Step 3: Apply analytics tracking
auto-testid generate ./src --framework vue --attribute-name data-analytics --prefix track --backup
# Result: Successfully added 138 data-analytics attributes
```

## Generated Attributes Examples

### React Components

**Input:**
```tsx
function LoginForm() {
  return (
    <form className="login-form">
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
    <form className="login-form" data-testid="test-form-login">
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
    <form className="login-form" data-analytics="track-form-login">
      <input type="email" placeholder="Email" data-analytics="track-email-input" />
      <button type="submit" data-analytics="track-sign-btn">Sign In</button>
    </form>
  );
}
```

### Vue Components

**Input:**
```vue
<template>
  <div class="user-profile">
    <h2>{{ user.name }}</h2>
    <button @click="editProfile">Edit Profile</button>
  </div>
</template>
```

**Output:**
```vue
<template>
  <div class="user-profile" data-testid="test-profile-user-container">
    <h2 data-testid="test-name-heading">{{ user.name }}</h2>
    <button @click="editProfile" data-testid="test-edit-profile-btn">Edit Profile</button>
  </div>
</template>
```

## Configuration File

Create `.autotestidrc.json` in your project root:

**Testing Setup:**
```json
{
  "attributeName": "data-testid",
  "prefix": "test",
  "frameworks": ["react", "vue"],
  "naming": "kebab-case",
  "exclude": ["**/*.test.*", "**/*.spec.*"],
  "backup": true
}
```

**Analytics Setup:**
```json
{
  "attributeName": "data-analytics",
  "prefix": "track", 
  "frameworks": ["react", "vue"],
  "naming": "camelCase",
  "exclude": ["**/node_modules/**"],
  "backup": true
}
```

Then run simply:
```bash
auto-testid generate ./src
```

## Use Cases

- 🧪 **E2E Testing**: `data-testid` attributes for Cypress, Playwright, Selenium
- 📊 **Analytics Tracking**: `data-analytics` attributes for user behavior analysis
- 🔍 **QA Automation**: `data-qa` attributes for quality assurance workflows
- 🎯 **A/B Testing**: `data-experiment` attributes for testing frameworks
- 🤖 **Custom Automation**: Any custom attribute for your specific needs

## Integration Examples

### Cypress Testing
```javascript
// Using generated data-testid attributes
cy.get('[data-testid="test-form-login"]').should('be.visible');
cy.get('[data-testid="test-email-input"]').type('user@example.com');
cy.get('[data-testid="test-sign-btn"]').click();
```

### Analytics Tracking
```javascript
// Using generated data-analytics attributes
document.querySelectorAll('[data-analytics]').forEach(element => {
  element.addEventListener('click', (e) => {
    const trackingId = e.target.getAttribute('data-analytics');
    analytics.track('element_clicked', { id: trackingId });
  });
});
```

## Framework Support

| Framework | Status | File Types | Features |
|-----------|--------|------------|----------|
| **React** | ✅ Full | `.jsx`, `.tsx`, `.js`, `.ts` | JSX parsing, TypeScript support |
| **Vue.js** | ✅ Full | `.vue` | SFC parsing, Vue directives |
| **Angular** | 🚧 Planned | `.html`, `.ts` | Coming soon |
| **HTML** | 🚧 Planned | `.html` | Coming soon |

## Best Practices

1. **Always use --dry-run first** to preview changes
2. **Enable --backup** for safety on production code
3. **Choose meaningful attribute names** for your use case
4. **Use consistent prefixes** across your application
5. **Exclude test files** to avoid adding attributes to test code

## Performance

- **Small projects** (< 50 files): ~100ms
- **Medium projects** (50-200 files): ~500ms
- **Large projects** (200+ files): ~2s

## License

MIT License - see [LICENSE](https://github.com/dkoul/auto-testid/blob/main/LICENSE) for details.

---

**Part of the Auto-TestID ecosystem:**
- [`@dkoul/auto-testid-core`](https://npmjs.com/package/@dkoul/auto-testid-core) - Core parsing and transformation logic