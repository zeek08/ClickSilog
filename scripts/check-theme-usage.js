#!/usr/bin/env node

/**
 * Theme Usage Audit Script
 * 
 * Scans codebase for unsafe theme/spacing usage patterns.
 * Fails CI build if unsafe patterns are found.
 * 
 * Usage:
 *   node scripts/check-theme-usage.js
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');
const UNSAFE_PATTERNS = [
  // Bare spacing variable (not from theme)
  /(?:^|[^a-zA-Z_])spacing\s*[=:]/gm,
  /(?:^|[^a-zA-Z_])spacing\s*\./gm,
  // Direct spacing access without theme context
  /const\s+spacing\s*=\s*[^{]/gm,
  // Magic numbers that should be spacing tokens
  /(?:padding|margin|gap|top|bottom|left|right):\s*(\d+)(?!px)/gm,
];

const ALLOWED_PATTERNS = [
  // Theme context usage
  /useTheme\(\)/,
  /theme\.spacing/,
  /spacing\.(xs|sm|md|lg|xl|xxl)/,
  // Theme file definitions
  /export\s+(const|let)\s+spacing/,
  // Comments
  /\/\/.*spacing/,
  /\/\*.*spacing.*\*\//,
  // Prop passing (spacing={spacing})
  /spacing=\{spacing\}/,
  // Context access (themeContext.spacing, lightTheme.spacing)
  /(themeContext|lightTheme|darkTheme|currentTheme)\.spacing/,
  // Utility function parameters
  /function\s+\w+.*spacing/,
  /const\s+\w+\s*=\s*.*spacing/,
  // Theme definition files
  /src[\/\\]config[\/\\]theme\.js/,
  /src[\/\\]theme[\/\\]index\.js/,
  /src[\/\\]theme[\/\\]utils\.js/,
  /src[\/\\]contexts[\/\\]ThemeContext\.js/,
];

const EXCLUDED_DIRS = ['node_modules', '.git', 'dist', 'build', '__tests__', '__mocks__'];
const EXCLUDED_FILES = ['.test.js', '.spec.js', '.snap'];

function shouldExclude(filePath) {
  const relativePath = path.relative(SRC_DIR, filePath);
  return EXCLUDED_DIRS.some(dir => relativePath.includes(dir)) ||
         EXCLUDED_FILES.some(ext => filePath.endsWith(ext));
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  const lines = content.split('\n');
  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');

  // Skip theme definition files
  if (relativePath.includes('src/config/theme.js') || 
      relativePath.includes('src/theme/index.js') ||
      relativePath.includes('src/theme/utils.js') ||
      relativePath.includes('src/contexts/ThemeContext.js')) {
    return issues;
  }

  // Check for unsafe patterns
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const trimmedLine = line.trim();

    // Skip comments and empty lines
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') || trimmedLine === '') {
      continue;
    }

    // Skip allowed patterns
    if (ALLOWED_PATTERNS.some(pattern => pattern.test(line))) {
      continue;
    }

    // Check for unsafe spacing usage (but allow prop passing and context access)
    // Allow JSX prop assignments like spacing="xs" or spacing={'xs'}
    if (/(?:^|[^a-zA-Z_.])spacing\s*[=:]/.test(line) && 
        !/useTheme|theme\.spacing|themeContext\.spacing|lightTheme\.spacing|darkTheme\.spacing|currentTheme\.spacing/.test(line) &&
        !/spacing=\{spacing\}/.test(line) &&
        !/spacing=["'](xs|sm|md|lg|xl|xxl)["']/.test(line) &&
        !/spacing=\{["'](xs|sm|md|lg|xl|xxl)["']\}/.test(line)) {
      issues.push({
        file: filePath,
        line: lineNum,
        content: trimmedLine,
        type: 'bare_spacing_variable',
        message: 'Bare spacing variable detected. Use theme.spacing or spacing from useTheme()',
      });
    }

    // Check for magic numbers in style properties (but skip positioning values like 0)
    const magicNumberMatch = line.match(/(?:padding|margin|gap):\s*(\d+)(?!px|spacing)/);
    if (magicNumberMatch && !line.includes('spacing.') && parseInt(magicNumberMatch[1]) > 0) {
      const value = parseInt(magicNumberMatch[1]);
      // Only flag values that could be spacing tokens (4, 8, 12, 16, 20, 24, 32, 40, 48)
      const spacingValues = [4, 8, 12, 16, 20, 24, 32, 40, 48];
      if (spacingValues.includes(value)) {
        issues.push({
          file: filePath,
          line: lineNum,
          content: trimmedLine,
          type: 'magic_number',
          message: `Magic number ${value} found. Consider using theme.spacing token (${value === 4 ? 'xs' : value === 8 ? 'sm' : value === 12 ? 'sm' : value === 16 ? 'md' : value === 20 ? 'md' : value === 24 ? 'lg' : value === 32 ? 'xl' : value === 40 ? 'xl' : 'xxl'})`,
        });
      }
    }
  }

  return issues;
}

function scanDirectory(dir) {
  const issues = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (shouldExclude(fullPath)) {
      continue;
    }

    if (entry.isDirectory()) {
      issues.push(...scanDirectory(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.jsx') || entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      try {
        issues.push(...scanFile(fullPath));
      } catch (error) {
        console.error(`Error scanning ${fullPath}:`, error.message);
      }
    }
  }

  return issues;
}

function main() {
  console.log('🔍 Scanning codebase for unsafe theme usage...\n');

  const issues = scanDirectory(SRC_DIR);

  if (issues.length === 0) {
    console.log('✅ No unsafe theme usage patterns found!');
    process.exit(0);
  }

  console.log(`❌ Found ${issues.length} issue(s):\n`);

  // Group by file
  const byFile = {};
  for (const issue of issues) {
    if (!byFile[issue.file]) {
      byFile[issue.file] = [];
    }
    byFile[issue.file].push(issue);
  }

  // Print issues
  for (const [file, fileIssues] of Object.entries(byFile)) {
    const relativeFile = path.relative(process.cwd(), file);
    console.log(`📄 ${relativeFile}`);
    for (const issue of fileIssues) {
      console.log(`   Line ${issue.line}: ${issue.message}`);
      console.log(`   ${issue.content}`);
      console.log('');
    }
  }

  console.log(`\n❌ Build failed: ${issues.length} unsafe theme usage pattern(s) found.`);
  console.log('💡 Fix: Use theme.spacing or spacing from useTheme() hook instead of bare spacing variables.');
  process.exit(1);
}

if (require.main === module) {
  main();
}

module.exports = { scanFile, scanDirectory };

