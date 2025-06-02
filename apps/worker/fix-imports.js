const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Map of incorrect imports to correct ones
const importMap = {
  '../../../packages/firebase/init': './lib/firebase',
  '../../../lib/firebase': './lib/firebase',
  '../../lib/firebase': './lib/firebase',
  '../lib/firebase': './lib/firebase',
  'firebase/firestore': './lib/firebase-compat',
  'next': null // Remove next imports
};

function getRelativePathToLib(filePath) {
  const dir = path.dirname(filePath);
  const libPath = path.join(__dirname, 'lib');
  const relativePath = path.relative(dir, libPath);
  return relativePath.startsWith('.') ? relativePath : './' + relativePath;
}

function fixImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Get the correct relative path to lib for this file
  const relativeLibPath = getRelativePathToLib(filePath);

  // Fix imports with dynamic paths
  Object.entries(importMap).forEach(([oldImport, newImport]) => {
    const regex = new RegExp(`from ['"]${oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g');
    if (content.match(regex)) {
      if (newImport === null) {
        // Remove the entire import line
        content = content.replace(new RegExp(`.*${regex.source}.*\n`, 'g'), '');
      } else {
        // Replace with correct relative path
        const correctPath = newImport.replace('./lib', relativeLibPath);
        content = content.replace(regex, `from '${correctPath}'`);
      }
      modified = true;
    }
  });

  // Fix timeout property in fetch calls
  if (content.includes('timeout:')) {
    content = content.replace(/timeout:\s*\d+,/g, '');
    modified = true;
  }
  
  // Fix any remaining relative firebase imports
  const firebaseRegex = /from ['"]\.\.\/.*firebase.*['"]/g;
  if (content.match(firebaseRegex)) {
    content = content.replace(firebaseRegex, `from '${relativeLibPath}/firebase'`);
    modified = true;
  }

  // Fix firebase/firestore imports to use compat layer
  const firestoreRegex = /from ['"]firebase\/firestore['"]/g;
  if (content.match(firestoreRegex)) {
    content = content.replace(firestoreRegex, `from '${relativeLibPath}/firebase-compat'`);
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed imports in: ${filePath}`);
  }
}

// Find all TypeScript files
const files = glob.sync('**/*.ts', { 
  ignore: ['node_modules/**', 'dist/**'] 
});

console.log(`Fixing imports in ${files.length} files...`);
files.forEach(fixImports);

console.log('Import fixes complete!');