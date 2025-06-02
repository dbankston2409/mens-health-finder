const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Map of incorrect imports to correct ones
const importMap = {
  '../../../packages/firebase/init': './lib/firebase',
  '../../../lib/firebase': './lib/firebase',
  '../../lib/firebase': './lib/firebase',
  '../lib/firebase': './lib/firebase',
  'firebase/firestore': 'firebase-admin/firestore',
  'next': null // Remove next imports
};

function fixImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix imports
  Object.entries(importMap).forEach(([oldImport, newImport]) => {
    const regex = new RegExp(`from ['"]${oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g');
    if (content.match(regex)) {
      if (newImport === null) {
        // Remove the entire import line
        content = content.replace(new RegExp(`.*${regex.source}.*\n`, 'g'), '');
      } else {
        content = content.replace(regex, `from '${newImport}'`);
      }
      modified = true;
    }
  });

  // Fix timeout property in fetch calls
  content = content.replace(/timeout:\s*\d+,/g, '');
  
  // Fix any remaining relative firebase imports
  content = content.replace(/from ['"]\.\.\/.*firebase.*['"]/g, `from './lib/firebase'`);

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