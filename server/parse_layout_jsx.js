const fs = require('fs');
const parser = require('@babel/parser');
const code = fs.readFileSync('app/src/components/Layout.jsx', 'utf8');

try {
  parser.parse(code, { sourceType: 'module', plugins: ['jsx'] });
  console.log('parsed ok');
} catch (e) {
  console.error(e.message);
  if (e.loc) {
    console.error('line', e.loc.line, 'col', e.loc.column);
  }
  process.exit(1);
}
