// Naprawia składnię Pug dla responsive CSS classes
const fs = require('fs');

const filePath = process.argv[2];
if (!filePath) {
    console.log('Użycie: node fix-pug-syntax.js <file-path>');
    process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

// Napraw responsive classes w dot notation na class="" notation
content = content.replace(/\.([^.\s]*\.(md|lg|xl|sm|hover|focus|active|visited|disabled):[^.\s]*)/g, (match, className) => {
    return `(class="${className.replace(/\./g, ' ')}")`;
});

// Napraw długie linie z wieloma hover/responsive classes
content = content.replace(/\.([\w-]+(?:\.(?:hover|focus|active|md|lg|xl|sm):[^.\s]+)+)/g, (match, classes) => {
    const classNames = classes.replace(/\./g, ' ');
    return `(class="${classNames}")`;
});

fs.writeFileSync(filePath, content);
console.log(`Naprawiono składnię Pug w pliku: ${filePath}`);
