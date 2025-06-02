const fs = require('fs');
const path = require('path');
const glob = require('glob');

function fixImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix firebase/firestore imports to use compat layer
  if (content.includes("from 'firebase/firestore'")) {
    content = content.replace(/from 'firebase\/firestore'/g, "from '../lib/firebase-compat'");
    modified = true;
  }

  // Fix ./lib imports to ../lib (for files in subdirectories)
  if (content.includes("from './lib/")) {
    content = content.replace(/from '\.\/lib\//g, "from '../lib/");
    modified = true;
  }

  // Fix relative firebase imports
  const relativeFirebasePattern = /from ['"]\.\.\/\.\.\/\.\.\/(?:packages\/firebase\/init|lib\/firebase)['"]|from ['"]\.\.\/\.\.\/lib\/firebase['"]/g;
  if (content.match(relativeFirebasePattern)) {
    content = content.replace(relativeFirebasePattern, "from '../lib/firebase'");
    modified = true;
  }

  // Remove Next.js imports
  if (content.includes("from 'next")) {
    content = content.replace(/.*from ['"]next.*['"]\s*;?\s*\n/g, '');
    modified = true;
  }

  // Fix timeout property in fetch calls
  if (content.includes('timeout:')) {
    content = content.replace(/timeout:\s*\d+,/g, '');
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed imports in: ${filePath}`);
  }
}

// Find all TypeScript files
const files = glob.sync('**/*.ts', { 
  ignore: ['node_modules/**', 'dist/**', 'lib/**'] 
});

console.log(`Fixing imports in ${files.length} files...`);
files.forEach(fixImports);

console.log('Import fixes complete!');