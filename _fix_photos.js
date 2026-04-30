const fs = require('fs');
let h = fs.readFileSync('d:/VSC/Franz/index.html', 'utf8').replace(/\r\n/g, '\n');

// Switch from absolute GitHub Pages URLs to relative paths
// Works on file://, on GitHub Pages, and on any other host
const before = h;
h = h.replace(/https:\/\/aid4gold\.github\.io\/franz-\//g, '');

const changed = (before.match(/https:\/\/aid4gold\.github\.io\/franz-\//g) || []).length;
console.log('Replaced', changed, 'absolute image URLs with relative paths');

// Change loading="lazy" to loading="eager" so photos in hidden sections always load
const lazyCount = (h.match(/loading="lazy"/g) || []).length;
h = h.replace(/loading="lazy"/g, 'loading="eager"');
console.log('Changed', lazyCount, 'loading="lazy" -> loading="eager"');

fs.writeFileSync('d:/VSC/Franz/index.html', h.replace(/\n/g, '\r\n'), 'utf8');
console.log('Done');
