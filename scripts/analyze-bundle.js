#!/usr/bin/env node

/**
 * Bundle size analyzer
 * Analyzes webpack build output and provides detailed size information
 */

const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const SIZE_LIMIT_KB = 500; // 500 KB warning threshold

/**
 * Get file size in KB
 */
function getFileSizeInKB(filepath) {
  const stats = fs.statSync(filepath);
  return (stats.size / 1024).toFixed(2);
}

/**
 * Get all files in directory recursively
 */
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);

    if (stat.isDirectory()) {
      getAllFiles(filepath, fileList);
    } else {
      fileList.push(filepath);
    }
  });

  return fileList;
}

/**
 * Analyze bundle
 */
function analyzeBundle() {
  console.log('=====================================');
  console.log('  Bundle Size Analyzer');
  console.log('=====================================\n');

  if (!fs.existsSync(DIST_DIR)) {
    console.error(`Error: Build directory not found at ${DIST_DIR}`);
    console.error('Run "npm run build:renderer" first');
    process.exit(1);
  }

  // Get all files
  const files = getAllFiles(DIST_DIR);

  // Categorize files
  const bundles = {
    js: [],
    css: [],
    images: [],
    fonts: [],
    other: []
  };

  let totalSize = 0;

  files.forEach((file) => {
    const size = parseFloat(getFileSizeInKB(file));
    totalSize += size;

    const relativePath = path.relative(DIST_DIR, file);
    const ext = path.extname(file).toLowerCase();

    const fileInfo = {
      path: relativePath,
      size,
      ext
    };

    if (ext === '.js') {
      bundles.js.push(fileInfo);
    } else if (ext === '.css') {
      bundles.css.push(fileInfo);
    } else if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(ext)) {
      bundles.images.push(fileInfo);
    } else if (['.woff', '.woff2', '.ttf', '.eot', '.otf'].includes(ext)) {
      bundles.fonts.push(fileInfo);
    } else {
      bundles.other.push(fileInfo);
    }
  });

  // Sort by size (largest first)
  Object.keys(bundles).forEach((key) => {
    bundles[key].sort((a, b) => b.size - a.size);
  });

  // Display results
  console.log('JavaScript Bundles:');
  console.log('-----------------------------------');
  if (bundles.js.length > 0) {
    bundles.js.forEach((file) => {
      const warning = file.size > SIZE_LIMIT_KB ? ' ⚠️  LARGE' : '';
      console.log(`  ${file.path.padEnd(40)} ${file.size.toString().padStart(10)} KB${warning}`);
    });
    const jsTotal = bundles.js.reduce((sum, f) => sum + f.size, 0);
    console.log(`  ${'TOTAL:'.padEnd(40)} ${jsTotal.toFixed(2).padStart(10)} KB\n`);
  } else {
    console.log('  No JS files found\n');
  }

  console.log('CSS Files:');
  console.log('-----------------------------------');
  if (bundles.css.length > 0) {
    bundles.css.forEach((file) => {
      console.log(`  ${file.path.padEnd(40)} ${file.size.toString().padStart(10)} KB`);
    });
    const cssTotal = bundles.css.reduce((sum, f) => sum + f.size, 0);
    console.log(`  ${'TOTAL:'.padEnd(40)} ${cssTotal.toFixed(2).padStart(10)} KB\n`);
  } else {
    console.log('  No CSS files found\n');
  }

  console.log('Images:');
  console.log('-----------------------------------');
  if (bundles.images.length > 0) {
    bundles.images.forEach((file) => {
      console.log(`  ${file.path.padEnd(40)} ${file.size.toString().padStart(10)} KB`);
    });
    const imgTotal = bundles.images.reduce((sum, f) => sum + f.size, 0);
    console.log(`  ${'TOTAL:'.padEnd(40)} ${imgTotal.toFixed(2).padStart(10)} KB\n`);
  } else {
    console.log('  No images found\n');
  }

  console.log('Fonts:');
  console.log('-----------------------------------');
  if (bundles.fonts.length > 0) {
    bundles.fonts.forEach((file) => {
      console.log(`  ${file.path.padEnd(40)} ${file.size.toString().padStart(10)} KB`);
    });
    const fontTotal = bundles.fonts.reduce((sum, f) => sum + f.size, 0);
    console.log(`  ${'TOTAL:'.padEnd(40)} ${fontTotal.toFixed(2).padStart(10)} KB\n`);
  } else {
    console.log('  No fonts found\n');
  }

  // Summary
  console.log('=====================================');
  console.log('Summary:');
  console.log('-----------------------------------');
  console.log(`  Total files: ${files.length}`);
  console.log(`  Total size:  ${totalSize.toFixed(2)} KB (${(totalSize / 1024).toFixed(2)} MB)`);

  const jsSize = bundles.js.reduce((sum, f) => sum + f.size, 0);
  const cssSize = bundles.css.reduce((sum, f) => sum + f.size, 0);
  const imgSize = bundles.images.reduce((sum, f) => sum + f.size, 0);

  console.log(`\n  JavaScript:  ${jsSize.toFixed(2)} KB (${((jsSize / totalSize) * 100).toFixed(1)}%)`);
  console.log(`  CSS:         ${cssSize.toFixed(2)} KB (${((cssSize / totalSize) * 100).toFixed(1)}%)`);
  console.log(`  Images:      ${imgSize.toFixed(2)} KB (${((imgSize / totalSize) * 100).toFixed(1)}%)`);

  // Warnings
  console.log('\n=====================================');
  const largeFiles = [...bundles.js, ...bundles.css].filter(f => f.size > SIZE_LIMIT_KB);

  if (largeFiles.length > 0) {
    console.log('⚠️  WARNINGS:');
    console.log('-----------------------------------');
    largeFiles.forEach((file) => {
      console.log(`  ${file.path} is ${file.size} KB (>${SIZE_LIMIT_KB} KB)`);
    });
    console.log('\nConsider:');
    console.log('  - Code splitting for large bundles');
    console.log('  - Lazy loading for non-critical code');
    console.log('  - Analyzing with webpack-bundle-analyzer');
  } else {
    console.log('✓ All bundles are within size limits');
  }

  console.log('=====================================\n');

  // Exit with error if total size is too large
  if (totalSize > 5000) { // 5 MB
    console.error('❌ Total bundle size exceeds 5 MB!');
    process.exit(1);
  }
}

// Run analyzer
try {
  analyzeBundle();
} catch (error) {
  console.error('Error analyzing bundle:', error.message);
  process.exit(1);
}
